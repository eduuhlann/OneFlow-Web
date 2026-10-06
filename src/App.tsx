import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AnimatePresence } from 'motion/react';
import { DiscipleshipListener } from './components/DiscipleshipListener';
import ParticleBackground from './components/ParticleBackground';

// Pages
const Landing = lazy(() => import('./pages/Landing'));

import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Bible from './pages/Bible';

import Plans from './pages/Plans';
import AiPlanGenerator from './pages/AiPlanGenerator';
import PlanDetails from './pages/PlanDetails';
import PlanView from './pages/PlanView';
import Settings from './pages/Settings';
import Discipleship from '@/src/pages/Discipleship';
import EditProfile from './pages/EditProfile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import PublicProfile from './pages/PublicProfile';
import Help from './pages/Help';
import OneFlowAI from './pages/OneFlowAI';
// import Journey from './pages/Journey';

function AppBackground() {
  const { pathname } = useLocation();
  return pathname === '/' ? null : <ParticleBackground />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center" role="status">
              <span className="font-outfit text-sm tracking-[0.2em] uppercase">Carregando OneFlow…</span>
            </div>
          }>
            <Landing />
          </Suspense>
        } />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/ajuda" element={<Help />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/oneflow-ai" element={
          <ProtectedRoute>
            <OneFlowAI />
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
        <Route path="/discipleship" element={
          <ProtectedRoute>
            <Discipleship />
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
        <Route path="/plano/:id" element={<PlanView />} />
        {/* <Route path="/journey" element={
          <ProtectedRoute>
            <Journey />
          </ProtectedRoute>
        } /> */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PublicProfile />
          </ProtectedRoute>
        } />
        <Route path="/profile/edit" element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <PreferencesProvider>
            <AppBackground />
            <DiscipleshipListener />
            <AnimatedRoutes />
          </PreferencesProvider>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}
