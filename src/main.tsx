import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Capacitor
import '@capacitor/core';

createRoot(document.getElementById("root")!).render(<App />);
