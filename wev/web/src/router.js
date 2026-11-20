import { createBrowserRouter } from 'react-router'
import App from './App'
import Dashboard from './pages/dashboard'

const router = createBrowserRouter([
  { path: '/', Component: App },
  { path: '/dashboard', Component: Dashboard },
])

export default router