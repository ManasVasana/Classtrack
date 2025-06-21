import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, X } from "react-feather";
import { User, Users, BarChart, Copy } from "react-feather";
import { data } from "autoprefixer";
import TypingText from "./Typing_text";
// import { fetchWithAuth } from "../utils/fetchWithAuth";
import api from "../utils/api"; // ✅ correct
import Notification from "../components/notification";
import { CheckCircle } from "lucide-react";
import { jwtDecode } from "jwt-decode"; // ✅ correct

const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    console.log("Decoded token:", decoded);
    return decoded; // { id, username, role, ... }
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
};

function Mainpage({ darkMode, toggleDarkMode }) {
  const [joinCode, setJoinCode] = useState("");
  const [className, setClassName] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [username, setUsername] = useState("");
  const [newClass, setNewClass] = useState(false);
  const [classes, setClasses] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get("/GetClasses");
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  useEffect(() => {
    const user = getUserFromToken();
    if (user) {
      setIsTeacher(user.role === "teacher");
      setUsername(user.username);
      fetchClasses();
    } else {
      alert("Invalid or missing token. Please login again.");
    }
  }, []);

  const addClass = () => {
    setNewClass(!newClass);
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/JoinClass", {
        class_code: joinCode,
      });

      const result = await res.data;

      if (res.status === 200) {
        alert("Successfully joined class!");
        setNewClass(false);
        setJoinCode("");
        fetchClasses(); // No need to pass username
      } else {
        alert(result.message || "Unable to join class.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again.");
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/CreateClass", {
        name: className,
      });

      const result = await res.data;

      if (res.status === 200) {
        alert(`Class created successfully! Code: ${result.class_code}`);
        setNewClass(false);
        setClassName("");
        fetchClasses(); // No need to pass teacher_username
      } else {
        alert(result.message || "Error creating class.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setShowNotification(true);
      })
      .catch(() => {
        alert("Failed to copy class code.");
      });
  };

  return (
    <div className="min-h-screen md:block hidden bg-gradient-to-r from-[#e0f7fa] to-[#f0faff] dark:from-gray-900 dark:to-gray-950 transition-colors">
      <TypingText text={`Welcome ${username}!`} />

      <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-y-14 px-6 py-4">
        {classes.map((cls, index) => (
          <Link
            to={isTeacher ? `/TClass/${cls.id}` : `/STClass/${cls.id}`}
            key={index}
          >
            <div className="hover:-translate-y-2 duration-200 transition-all max-w-[300px] mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md dark:shadow-[0_0_12px_rgba(0,255,255,0.2)] hover:dark:shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                <div className="h-20 bg-gradient-to-r from-cyan-500 to-blue-500 relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleCopy(cls.class_code);
                      }}
                      className="text-white text-xs hover:text-cyan-300"
                      title="Copy class code"
                    >
                      <span className="text-xs font-medium text-white hover:text-cyan-300">
                        {cls.class_code}
                      </span>
                    </button>
                  </div>

                  <div className="absolute -bottom-10 left-5 h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-900 dark:border-4 dark:border-gray-800 flex items-center justify-center shadow-md">
                    <div className="...">
                      <span className="text-gray-900 dark:text-white font-bold text-4xl">
                        {cls.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-12 space-y-4">
                  <div className="space-y-1 mt-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {cls.name}
                    </h3>
                    {!isTeacher && (
                      <span className="text-cyan-600 dark:text-cyan-400">
                        <User className="h-4 w-4 inline text-cyan-400 mr-1" />
                        {cls.teacher_name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-cyan-400 mr-1" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          Students
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {cls.student_count}
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BarChart className="h-4 w-4 text-cyan-400 mr-1" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          Attendance
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        90%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center fixed bottom-8 right-8">
        <button
          onClick={addClass}
          className="group relative inline-flex items-center justify-center px-3 py-3 overflow-hidden font-bold text-white rounded-full shadow-2xl bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 ease-out hover:scale-105"
        >
          <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
          <PlusCircle />
        </button>
      </div>

      {newClass && !isTeacher && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Join New Class
              </h2>
              <button
                onClick={addClass}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleJoinClass}>
              <div>
                <label
                  htmlFor="classCode"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                >
                  Class Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                  placeholder="Enter class code"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg shadow-md hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-all duration-300"
              >
                Join Class
              </button>
            </form>
          </div>
        </div>
      )}

      {isTeacher && newClass && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Class
              </h2>
              <button
                onClick={addClass}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleCreateClass}>
              <div>
                <label
                  htmlFor="ClassName"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                >
                  Create a Class Name
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                  placeholder="Class name"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg shadow-md hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-all duration-300"
              >
                Create Class
              </button>
            </form>
          </div>
        </div>
      )}
      {showNotification && (
        <Notification
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          message="Class Code Copied!"
          color="#10b981" // tailwind green-500
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
}

export default Mainpage;
