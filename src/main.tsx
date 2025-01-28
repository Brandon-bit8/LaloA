import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeTables, initializeUsers } from './lib/supabase';

// Initialize database and users
Promise.all([initializeTables(), initializeUsers()])
  .then(() => console.log('Database and users initialized successfully'))
  .catch((error) => {
    console.error('Failed to initialize:', error);
    // Show error message to user if needed
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);