import { useState } from "react";
import { Link } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import { PlusCircle } from "react-feather";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

function Navbar({ darkMode, toggleDarkMode }) {

  const navigate = useNavigate();
    const handleLogout = () => {
    localStorage.removeItem("username");
    navigate("/");
    }

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-950 py-4 px-6 flex justify-between items-center">
      <Link
        to="/Mainpage"
        className="text-[35px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-pink-500 hover:text-gray-300 transition-colors duration-200"
      >
        ClassTrack
      </Link>
      <div className="flex items-center space-x-2"> 
      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-full text-xl transition-all duration-300 
                   focus:outline-none 
                   bg-white bg-opacity-20 backdrop-blur-md 
                   hover:bg-opacity-30 "
      >
        {darkMode ? (
          <FaMoon className="text-gray-200" />
        ) : (
          <FaSun className="text-yellow-500" />
        )}
      </button>
      <button onClick={handleLogout} className="flex hover:cursor-pointer items-center bg-transparent text-white rounded-lg hover:text-white p-3 text-xl transition-all duration-300 
                   focus:outline-none 
                   bg-white bg-opacity-20 backdrop-blur-md 
                   hover:bg-opacity-30 dark:hover:bg-opacity-40">
        <FontAwesomeIcon icon={faSignOutAlt} className="mr-0 text-lg" />
      </button>
      </div>
    </div>
  );
}

export default Navbar;
