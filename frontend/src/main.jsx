import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import SessionProvider from "./context/user_session.jsx"
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <SessionProvider>
       <BrowserRouter>
      <App />
    </BrowserRouter>
    </SessionProvider>
   
 
)
