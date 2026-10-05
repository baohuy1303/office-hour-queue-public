import { EmptyState } from './components/EmptyState'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { CreateCoursePage } from './pages/CreateCoursePage'
import { DirectoryPage } from './pages/DirectoryPage'
import { StudentPage } from './pages/StudentPage'
import { TaHomePage } from './pages/TaHomePage'
import { TaPage } from './pages/TaPage'

export default function App() {
  return (
    <ToastProvider>
      <Layout>
        <Page />
      </Layout>
    </ToastProvider>
  )
}

// Picks the page from the URL path. A handful of pages is simple enough to need no router library:
//   /             the course directory
//   /ta           TA sign-in, or the signed-in TA's courses
//   /new          add a course
//   /c/cs315      a course's student page
//   /c/cs315/ta   a course's TA page
function Page() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return <DirectoryPage />
  if (path === '/ta') return <TaHomePage />
  if (path === '/new') return <CreateCoursePage />

  const match = path.match(/^\/c\/([^/]+)(\/ta)?$/)
  if (match) {
    const slug = decodeURIComponent(match[1]).toLowerCase()
    return match[2] ? <TaPage slug={slug} /> : <StudentPage slug={slug} />
  }

  return <EmptyState title="Page not found." hint="Check the link, or start from the course directory." />
}
