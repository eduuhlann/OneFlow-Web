import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Bible from './pages/Bible';
import Olyviah from './pages/Olyviah';
import Plans from './pages/Plans';
import Prayer from './pages/Prayer';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Navigate to="/#auth" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/bible" element={
            <ProtectedRoute>
              <Bible />
            </ProtectedRoute>
          } />
          <Route path="/bible/:book" element={
            <ProtectedRoute>
              <Bible />
            </ProtectedRoute>
          } />
          <Route path="/bible/:book/:chapter" element={
            <ProtectedRoute>
              <Bible />
            </ProtectedRoute>
          } />
          <Route path="/olyviah" element={
            <ProtectedRoute>
              <Olyviah />
            </ProtectedRoute>
          } />
          <Route path="/plans" element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          } />
          <Route path="/prayer" element={
            <ProtectedRoute>
              <Prayer />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}
