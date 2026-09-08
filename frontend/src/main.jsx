import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { applyTheme } from './utils/theme'
import { GoogleOAuthProvider } from '@react-oauth/google'

if (localStorage.getItem("c2c-theme") === "system") {
  localStorage.setItem("c2c-theme", "light");
}
applyTheme()

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const appTree = (
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appTree}
      </GoogleOAuthProvider>
    ) : appTree}
  </StrictMode>,
)
