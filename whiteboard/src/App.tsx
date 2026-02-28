import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import Whiteboard from './Whiteboard';
import Friends from './components/Friends';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>
            <SignedOut>
              <LandingPage />
            </SignedOut>
            <SignedIn>
              <Dashboard />
            </SignedIn>
          </>
        } />

        <Route path="/friends" element={
          <>
            <SignedIn>
              <Friends />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />

        <Route path="/session/:sessionId" element={
          <>
            <SignedIn>
              <Whiteboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
