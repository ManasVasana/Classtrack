import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, X } from "react-feather";
import { User, Users, BarChart, Copy } from "react-feather";
import { data } from "autoprefixer";
import TypingText from "./Typing_text";

function Mainpage() {
  const [joinCode, setJoinCode] = useState("");
  const [className, setClassName] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [newClass, setNewClass] = useState(false);
  const [classes, setClasses] = useState([]);

  const fetchClasses = (uname) => {
    fetch(`http://localhost:3001/GetClasses/${uname}`)
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch((err) => console.error("Failed to load classes", err));

    console.log("Classes fetched:", classes); // Log the fetched classes
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsTeacher(role === "teacher");
    setName(localStorage.getItem("name"));
    setUsername(localStorage.getItem("username"));
  }, []);

  useEffect(() => {
    if (username) {
      console.log("Fetching classes for:", username);
      fetchClasses(username);
    }
  }, [username]);

  const addClass = () => {
    setNewClass(!newClass);
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    const student_username = localStorage.getItem("username");

    try {
      const res = await fetch("http://localhost:3001/JoinClass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_code: joinCode, student_username }),
      });

      const result = await res.json();

      if (res.status === 200) {
        alert("Successfully joined class!");
        setNewClass(false);
        setJoinCode(""); // clear input
        fetchClasses(student_username); // refresh cards
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

    const teacher_username = localStorage.getItem("username");
    console.log("Sending:", className); // Add this line

    try {
      const res = await fetch("http://localhost:3001/CreateClass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: className,
          teacher_username,
        }),
      });

      const result = await res.json();

      if (res.status === 200) {
        alert(`Class created successfully! Code: ${result.class_code}`);
        setNewClass(false);
        setClassName(""); // reset
        fetchClasses(teacher_username); // refresh cards
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
        alert("Class code copied!");
      })
      .catch(() => {
        alert("Failed to copy class code.");
      });
  };

  return (
    <div className="min-h-screen md:block hidden bg-gradient-to-r from-gray-900 to-gray-950">
      <TypingText text={`Welcome ${name}!`} />

      {/* <div className="flex justify-center p-8">
        <Link to="/STClass">
          <div className="hover:-translate-y-1 duration-300 transition-all">
            // Card with Gradient Line 
            <div className="min-w-[250px]">
              <div className="flex justify-center items-center min-w-[250px] min-h-[250px] bg-gray-800 rounded-t-lg shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]">
                <div className="text-[#D1D5DB] text-lg">Physics</div>
              </div>
              // Gradient Line (Directly attached to the card) 
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-b-lg"></div>
            </div>
          </div>
        </Link>
      </div> */}
      <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-y-14 px-6 py-4">
        {/* {classes.length === 0 && (
          <div className="text-center text-gray-400 text-xl py-10">
            You haven't joined or created any classes yet.
          </div>
        )} */}
        {classes.map((cls, index) => (
          <Link
            to={isTeacher ? `/TClass/${cls.id}` : `/STClass/${cls.id}`}
            key={index}
          >
            <div className="hover:-translate-y-2 duration-200 transition-all max-w-[300px] mx-auto">
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-[0_0_12px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                {/* Header */}
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

                  <div className="absolute -bottom-10 left-5 h-20 w-20 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center shadow-md">
                    <div className="...">
                      <span className="text-white font-bold text-4xl">
                        {cls.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 pt-12 space-y-4">
                  <div className="space-y-1 mt-2">
                    <h3 className="text-2xl font-bold text-white">
                      {cls.name}
                    </h3>
                    {!isTeacher && (
                      <span className="text-cyan-400">
                        <User className="h-4 w-4 inline text-cyan-400 mr-1" />
                        {cls.teacher_name}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-cyan-400 mr-1" />
                        <span className="text-xs text-gray-300">Students</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {cls.student_count}
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BarChart className="h-4 w-4 text-cyan-400 mr-1" />
                        <span className="text-xs text-gray-300">
                          Attendance
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white">90%</div>
                    </div>
                  </div>
                </div>

                {/* Footer line */}
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

      {/* Join Class */}
      {newClass && !isTeacher && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Join New Class</h2>
              <button
                onClick={addClass}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleJoinClass}>
              <div>
                <label
                  htmlFor="classCode"
                  className="block text-sm font-medium text-gray-400 mb-2"
                >
                  Class Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
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

      {/* Create Class */}
      {isTeacher && newClass && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Create New Class
              </h2>
              <button
                onClick={addClass}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleCreateClass}>
              <div>
                <label
                  htmlFor="ClassName"
                  className="block text-sm font-medium text-gray-400 mb-2"
                >
                  Create a Class Name
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
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
    </div>
  );
}

export default Mainpage;
