import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminShell } from './components/layout/AdminShell'
import { PortalShell } from './components/layout/PortalShell'

import Login from './pages/Login'
import Invite from './pages/Invite'
import NotAuthorized from './pages/NotAuthorized'
import Dashboard from './pages/admin/Dashboard'
import Clients from './pages/admin/Clients'
import ClientDetail from './pages/admin/ClientDetail'
import NewClient from './pages/admin/NewClient'
import Documents from './pages/admin/Documents'
import DocumentEditor from './pages/admin/DocumentEditor'
import PortalHome from './pages/portal/PortalHome'
import DocumentView from './pages/portal/DocumentView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<Invite />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminShell>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/new" element={<NewClient />} />
                  <Route path="clients/:id" element={<ClientDetail />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="documents/:id" element={<DocumentEditor />} />
                </Routes>
              </AdminShell>
            </ProtectedRoute>
          }
        />

        {/* Client portal routes */}
        <Route
          path="/portal/*"
          element={
            <ProtectedRoute requiredRole="client">
              <PortalShell>
                <Routes>
                  <Route index element={<PortalHome />} />
                  <Route path="documents/:id" element={<DocumentView />} />
                </Routes>
              </PortalShell>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
