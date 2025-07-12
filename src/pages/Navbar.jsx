import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Moon, Sun, User, Monitor, LogOut, Menu, X } from "lucide-react";
import Logo from "../components/logo.jsx";

function Navbar({ darkMode, toggleDarkMode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/Logout`, {
      method: "POST",
      credentials: "include",
    });

    localStorage.clear();
    navigate("/");
  };

  return (
    <>
     <>
      <nav className="bg-white/80 z-40 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-500/20 dark:border-gray-700/20 transition-all duration-300 fixed w-full top-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link 
                to="/Mainpage"
                className="text-[28px] font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200"
              >
                <Logo />
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link to={'/Calendar'} className="p-2 hidden md:block rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 group">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
              </Link>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 group"
              >
                {darkMode ? (
                  <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
                )}
              </button>

              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    M
                  </div>
                </button>

                {profileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-20 animate-in slide-in-from-top-2 duration-200">
                      <div className="p-2">
                        <Link to={'/profile'} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                          <User className="w-4 h-4 mr-3 text-blue-500" />
                          Profile Settings
                        </Link>
                        <Link to={'/ChangeDevice'} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                          <Monitor className="w-4 h-4 mr-3 text-green-500" />
                          Change Device
                        </Link>
                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                        <button 
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
            <div className="px-4 py-3 space-y-2">
              <Link to={'/profile'} className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200">
                <User className="w-4 h-4 mr-3 text-blue-500" />
                Profile Settings
              </Link>
              <Link to={'/ChangeDevice'} className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200">
                <Monitor className="w-4 h-4 mr-3 text-green-500" />
                Change Device
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
    </>
  );
}

export default Navbar;
