import { createElement } from 'react'
import { createBrowserRouter, Outlet } from 'react-router'
import App from './App'
import Dashboard from './pages/dashboard'
import Register from './pages/register'

const RootLayout = () => createElement(Outlet)

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: App },
      { path: 'register', Component: Register },
      { path: 'dashboard', Component: Dashboard },
    ],
  },
])

export default router