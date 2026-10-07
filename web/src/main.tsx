import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/assets/styles/globals.css'

// Suppress benign Google Identity Services duplicate initialization notice in React 18 StrictMode
const isGsiDuplicateWarning = (args: unknown[]): boolean =>
  typeof args[0] === 'string' &&
  args[0].includes('[GSI_LOGGER]: google.accounts.id.initialize() is called multiple times');

const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (isGsiDuplicateWarning(args)) return;
  origWarn.apply(console, args);
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  if (isGsiDuplicateWarning(args)) return;
  origError.apply(console, args);
};

const origInfo = console.info;
console.info = (...args: unknown[]) => {
  if (isGsiDuplicateWarning(args)) return;
  origInfo.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
