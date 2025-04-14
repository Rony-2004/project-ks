// frontend/src/main.tsx (Ensure BrowserRouter is HERE)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- Import BrowserRouter
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx'; // Verify path
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- MUST WRAP HERE */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter> {/* <-- END WRAP */}
  </React.StrictMode>,
)