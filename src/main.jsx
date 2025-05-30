import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './pages/login.jsx'
import SignUp from './pages/SignUp.jsx'
import StudentClass from './pages/Student_class.jsx'
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
    <App />
    </BrowserRouter>  
  </StrictMode>,
)
