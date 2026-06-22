import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import { Spinner } from './components/ui/Primitives'

import LoginPage from './pages/LoginPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import ProfileEditPage from './pages/ProfileEditPage'
import ProfilePage from './pages/ProfilePage'
import FeedPage from './pages/FeedPage'
import ConnectPage from './pages/ConnectPage'
import CommunityPage from './pages/CommunityPage'
import EventsPage from './pages/EventsPage'
import MessagesPage from './pages/MessagesPage'

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <Spinner size={28} />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading, isProfileComplete } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isProfileComplete) return <Navigate to="/profile/setup" replace />
  return children
}

function RequireProfileSetup({ children }) {
  const { user, loading, isProfileComplete } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (isProfileComplete) return <Navigate to="/feed" replace />
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, loading, isProfileComplete } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user && isProfileComplete) return <Navigate to="/feed" replace />
  if (user && !isProfileComplete) return <Navigate to="/profile/setup" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
      <Route path="/profile/setup" element={<RequireProfileSetup><ProfileSetupPage /></RequireProfileSetup>} />

      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/connect" element={<ConnectPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:userId" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
