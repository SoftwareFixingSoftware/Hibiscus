import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initConsoleMessage from './consoleMessage';

initConsoleMessage(); // run once on app startup

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);