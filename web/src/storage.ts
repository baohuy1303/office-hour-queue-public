// What the browser remembers between visits. Every call is wrapped in try/catch, because
// storage can be blocked (for example in private mode) and the app should still work.

const SAVED_COURSES_KEY = 'ohq-courses'

// Courses this device has joined, with their join codes, like { "cs315": "K7Q2PX" }.
// Students don't have to retype the code, and the directory shows their courses first.
export function loadSavedCourses(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SAVED_COURSES_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveCourse(slug: string, joinCode: string) {
  try {
    localStorage.setItem(SAVED_COURSES_KEY, JSON.stringify({ ...loadSavedCourses(), [slug]: joinCode }))
  } catch {
    // Storage blocked: the student types the code again next time.
  }
}

// A student's ticket id for one course, so refreshing keeps their spot. Each course has its
// own key, so a student can be in more than one course's queue at once.
function ticketKey(slug: string) {
  return `ohq-ticket:${slug}`
}

export function loadTicketId(slug: string) {
  try {
    return localStorage.getItem(ticketKey(slug))
  } catch {
    return null
  }
}

export function saveTicketId(slug: string, id: string | null) {
  try {
    if (id) localStorage.setItem(ticketKey(slug), id)
    else localStorage.removeItem(ticketKey(slug))
  } catch {
    // Storage blocked: the ticket only lasts until the page closes.
  }
}
