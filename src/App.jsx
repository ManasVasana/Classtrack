import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './pages/Navbar.jsx';
import Login from './pages/login.jsx';
import Mainpage from './pages/mainpage.jsx';
import SignUp from './pages/SignUp.jsx';
import StudentClass from './pages/Student_class.jsx';
import TeacherClass from './pages/Teacher_class.jsx';
import ProfilePage from './pages/profile.jsx';
import ChangeDevice from './pages/change_device.jsx';
import Calendar from './pages/calendar.jsx';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation(); 

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  
  const hideNavbarRoutes = ['/', '/SignUp'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Mainpage" element={<Mainpage />} />
        <Route path="/TClass/:id" element={<TeacherClass/>} />
        <Route path="/StClass/:id" element={<StudentClass/>} />
        <Route path="/Profile" element={<ProfilePage />} />
        <Route path="/ChangeDevice" element={<ChangeDevice />} />
        <Route path="/Calendar" element={<Calendar />} />
      </Routes>
    </>
  );
}
