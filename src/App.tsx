import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AnimatePresence } from 'motion/react';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Bible from './pages/Bible';
import Olyviah from './pages/Olyviah';
import Plans from './pages/Plans';
import AiPlanGenerator from './pages/AiPlanGenerator';
import PlanDetails from './pages/PlanDetails';
import Prayer from './pages/Prayer';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Journey from './pages/Journey';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
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
        <Route path="/plans/ai-generator" element={
          <ProtectedRoute>
            <AiPlanGenerator />
          </ProtectedRoute>
        } />
        <Route path="/plans/:id" element={
          <ProtectedRoute>
            <PlanDetails />
          </ProtectedRoute>
        } />
        <Route path="/prayer" element={
          <ProtectedRoute>
            <Prayer />
          </ProtectedRoute>
        } />
        <Route path="/journey" element={
          <ProtectedRoute>
            <Journey />
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
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <PreferencesProvider>
          <Router>
            <AnimatedRoutes />
          </Router>
        </PreferencesProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

