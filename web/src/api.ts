// Typed helpers for calling the API. The API's address comes from VITE_API_URL
// (.env.development locally; set by CI for the deployed build).
import { getSession, saveSession, type Session } from './auth'

const API_URL = import.meta.env.VITE_API_URL

export type QueueStatus = 'Waiting' | 'Helping' | 'Done' | 'Removed'

// Thrown for any failed request, with the API's message and the HTTP status code.
export class ApiError extends Error {
  status: number
  detail?: string

  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init)
  if (!response.ok) {
    // The API sends errors as { "title": "..." }, ASP.NET Core's "problem details" format.
    // Validation errors also list what's wrong in "errors"; show the first of those.
    const problem = await response.json().catch(() => null)
    const firstError = problem?.errors ? Object.values(problem.errors).flat()[0] : undefined
    throw new ApiError(String(firstError ?? problem?.title ?? `Request failed (${response.status})`), response.status, problem?.detail)
  }
  // Some responses have no body (204 No Content, or the register endpoint's empty 200).
  // Only parse JSON when there is some.
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

function postJson<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Every course's endpoints start here, like /api/courses/cs315.
function coursePath(slug: string) {
  return `/api/courses/${encodeURIComponent(slug)}`
}

// ---- The directory ----

// One row in the course directory.
export type CourseListItem = {
  slug: string
  code: string
  name: string
  isOpen: boolean
  waitingCount: number
}

export type CreatedCourse = {
  slug: string
  code: string
  name: string
  joinCode: string
}

export function getCourses() {
  return request<CourseListItem[]>('/api/courses')
}

// ---- Students ----

// A course's public status, shown before joining.
export type CourseSummary = {
  slug: string
  code: string
  name: string
  isOpen: boolean
  waitingCount: number
  estimatedWaitMinutes: number
}

// position and estimatedWaitMinutes are only set while the student is waiting.
export type Ticket = {
  id: string
  name: string
  topic: string
  status: QueueStatus
  position: number | null
  estimatedWaitMinutes: number | null
}

export function getCourse(slug: string) {
  return request<CourseSummary>(coursePath(slug))
}

export type FoundCourse = {
  slug: string
  code: string
  name: string
}

// Finds the course a join code belongs to. The API answers 404 if no course has that code.
export function lookupCourse(joinCode: string) {
  return postJson<FoundCourse>('/api/courses/lookup', { joinCode })
}

export function joinQueue(slug: string, name: string, topic: string, joinCode: string) {
  return postJson<{ id: string }>(`${coursePath(slug)}/queue`, { name, topic, joinCode })
}

export function getTicket(slug: string, id: string) {
  return request<Ticket>(`${coursePath(slug)}/queue/${id}`)
}

export function leaveQueue(slug: string, id: string) {
  return request<void>(`${coursePath(slug)}/queue/${id}`, { method: 'DELETE' })
}

// ---- TA accounts ----

// What the API's login and refresh endpoints return. expiresIn is in seconds.
type Tokens = { accessToken: string; refreshToken: string; expiresIn: number }

function toSession(email: string, tokens: Tokens): Session {
  return {
    email,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  }
}

export async function signIn(email: string, password: string) {
  try {
    saveSession(toSession(email, await postJson<Tokens>('/api/auth/login', { email, password })))
  } catch (error) {
    // The API says why in "detail": "Failed" for a wrong password, or "LockedOut".
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError(
        error.detail === 'LockedOut' ? 'Too many wrong tries. Wait 5 minutes, then try again.' : "That email and password don't match.",
        401,
      )
    }
    throw error
  }
}

export async function createAccount(email: string, password: string) {
  await postJson<void>('/api/auth/register', { email, password })
  await signIn(email, password)
}

// The access token lasts an hour. A minute before it runs out, trade the refresh token for new
// tokens, so TAs stay signed in through office hours. Requests made at the same moment share
// one renewal instead of each starting their own.
let renewal: Promise<void> | null = null

async function freshAccessToken() {
  const session = getSession()
  if (session && Date.now() > session.expiresAt - 60_000) {
    renewal ??= renew(session).finally(() => {
      renewal = null
    })
    await renewal
  }
  return getSession()?.accessToken ?? null
}

async function renew(session: Session) {
  try {
    saveSession(toSession(session.email, await postJson<Tokens>('/api/auth/refresh', { refreshToken: session.refreshToken })))
  } catch (error) {
    // The refresh token stopped working too (they last 14 days): sign out.
    if (error instanceof ApiError && error.status === 401) saveSession(null)
    else throw error
  }
}

// TA requests send the signed-in TA's token in the Authorization header. If the API answers 401,
// the token doesn't work anymore, so sign out; pages then show the sign-in form.
async function taRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = await freshAccessToken()
  if (!token) throw new ApiError('Sign in first.', 401)
  try {
    return await request<T>(path, {
      method,
      headers: body === undefined ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) saveSession(null)
    throw error
  }
}

// ---- TAs ----

// The courses the signed-in TA runs. For the admin, isAdmin is true and it's every course.
export type MyCourses = { isAdmin: boolean; courses: CourseListItem[] }

export function getMyCourses() {
  return taRequest<MyCourses>('/api/ta/courses')
}

// Adds a course. The signed-in TA becomes its first TA.
export function createCourse(code: string, name: string) {
  return taRequest<CreatedCourse>('/api/courses', 'POST', { code, name })
}

// One row in the TA's list.
export type TaEntry = {
  id: string
  name: string
  topic: string
  status: QueueStatus
  joinedAt: string
  calledAt: string | null
}

export type TaQueue = {
  code: string
  name: string
  isOpen: boolean
  joinCode: string
  // True for the TA who added the course, and for the admin.
  canDelete: boolean
  entries: TaEntry[]
}

// One of a course's TAs. isYou marks the signed-in TA.
export type CourseTa = {
  userId: string
  email: string
  isYou: boolean
}

export function getTaQueue(slug: string) {
  return taRequest<TaQueue>(`${coursePath(slug)}/ta/queue`)
}

export function openQueue(slug: string) {
  return taRequest<void>(`${coursePath(slug)}/ta/queue/open`, 'POST')
}

export function closeQueue(slug: string) {
  return taRequest<void>(`${coursePath(slug)}/ta/queue/close`, 'POST')
}

export function callNext(slug: string) {
  return taRequest<TaEntry>(`${coursePath(slug)}/ta/queue/next`, 'POST')
}

export function markDone(slug: string, id: string) {
  return taRequest<void>(`${coursePath(slug)}/ta/queue/${id}/done`, 'POST')
}

export function removeEntry(slug: string, id: string) {
  return taRequest<void>(`${coursePath(slug)}/ta/queue/${id}`, 'DELETE')
}

export function clearQueue(slug: string) {
  return taRequest<{ removed: number }>(`${coursePath(slug)}/ta/queue/clear`, 'POST')
}

export function newJoinCode(slug: string) {
  return taRequest<{ joinCode: string }>(`${coursePath(slug)}/ta/join-code`, 'POST')
}

export function deleteCourse(slug: string) {
  return taRequest<void>(coursePath(slug), 'DELETE')
}

export function getCourseTas(slug: string) {
  return taRequest<CourseTa[]>(`${coursePath(slug)}/ta/tas`)
}

export function addCourseTa(slug: string, email: string) {
  return taRequest<CourseTa>(`${coursePath(slug)}/ta/tas`, 'POST', { email })
}

export function removeCourseTa(slug: string, userId: string) {
  return taRequest<void>(`${coursePath(slug)}/ta/tas/${encodeURIComponent(userId)}`, 'DELETE')
}
