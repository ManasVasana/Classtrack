// Updated Navbar component with full mobile responsiveness, bottom menu, dark/light theme, and elegant dropdown
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import {
  faSignOutAlt,
  faUser,
  faExchangeAlt,
  faLaptop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Navbar({ darkMode, toggleDarkMode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/Logout`, {
      method: "POST",
      credentials: "include",
    });

    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e8f3ff] dark:from-gray-900 dark:to-gray-950 transition-colors duration-300 px-4 py-4 flex justify-between items-center relative shadow-sm">
      <Link
        to="/Mainpage"
        className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500"
      >
        ClassTrack
      </Link>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full block bg-white bg-opacity-20 backdrop-blur hover:bg-opacity-30 transition"
        >
          {darkMode ? (
            <FaMoon className="text-gray-100" />
          ) : (
            <FaSun className="text-yellow-400" />
          )}
        </button>

        <div
          className="relative hidden md:block"
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            className="rounded-full border-2 border-gray-700 p-0 hover:border-white transition"
            title="User Menu"
          >
            <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold text-xl">
              M
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 w-48 z-50">
              {/* Transparent gap filler to avoid hover loss */}
              <div className="h-2 pointer-events-none" />

              {/* Actual dropdown menu */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl animate-fadeIn">
                <div className="p-3 space-y-2">
                  <Link
                    to="/Profile"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-cyan-500 text-lg"
                    />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/Profile"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FontAwesomeIcon
                      icon={faLaptop}
                      className="text-yellow-400 text-[16px"
                    />
                    <span>Change Device</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
                  >
                    <FontAwesomeIcon
                      icon={faSignOutAlt}
                      className="text-red-500 text-lg"
                    />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Menu */}
      <div className="fixed bottom-0 left-0 w-full md:hidden bg-gray-800 rounded-t-lg text-white flex justify-around items-center py-2 border-t border-gray-700 z-40">
        <Link to="/Profile" className="flex flex-col items-center text-xs">
          <FontAwesomeIcon icon={faUser} className="text-cyan-400 text-lg" />
          <span>Profile</span>
        </Link>
        <Link to="/Profile" className="flex flex-col items-center text-xs">
          <FontAwesomeIcon
            icon={faLaptop}
            className="text-yellow-400 text-lg"
          />
          <span>Change</span>
        </Link>
        <button
          onClick={() => {
            handleLogout();
            alert("Logged out");
          }}
          className="flex flex-col items-center text-xs"
        >
          <FontAwesomeIcon
            icon={faSignOutAlt}
            className="text-red-400 text-lg"
          />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Navbar;
