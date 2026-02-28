import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Kept your Bootstrap import!
import 'bootstrap/dist/css/bootstrap.min.css';
import { ClerkProvider } from '@clerk/clerk-react';

// Import your Publishable Key from the .env file
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  const container = document.getElementById("root");
  if (container) {
    createRoot(container).render(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Missing Clerk Configuration</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Authentication is required to use the whiteboard.</p>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <p>Please add your Clerk Publishable Key to your environment variables:</p>
          <code style={{ display: 'block', backgroundColor: '#f1f5f9', padding: '1rem', marginTop: '1rem', borderRadius: '0.25rem', color: '#db2777' }}>
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </code>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>Edit the <code>whiteboard/.env</code> file and restart the dev server.</p>
        </div>
      </div>
    );
  }
  throw new Error("Missing Publishable Key");
}

const container = document.getElementById("root");
if (!container) throw new Error("Could not find root element");

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
