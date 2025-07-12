"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingButton } from "../components/Loading";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); 
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/Login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 200) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("name", result.name);
        localStorage.setItem("username", result.username);
        localStorage.setItem("role", result.role);
        navigate("/MainPage");
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-900 p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 shadow-2xl rounded-3xl overflow-hidden animate-fade-in flex flex-col md:flex-row">
          {/* Left Panel */}
          <div className="bg-gray-700 hidden sm:block w-full md:w-2/5 p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-6">
              ClassTrack
            </h1>
            <p className="text-white mb-8">
              Empower your educational journey with our state-of-the-art class
              management platform
            </p>
            <div className="space-y-4">
              <div className="flex items-center text-cyan-400">
                <svg
                  className="w-6 h-6 mr-2 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-white">Dynamic scheduling</span>
              </div>
              <div className="flex items-center text-cyan-400">
                <svg
                  className="w-6 h-6 mr-2 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-white">Time-saving automation</span>
              </div>
              <div className="flex items-center text-cyan-400">
                <svg
                  className="w-6 h-6 mr-2 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  ></path>
                </svg>
                <span className="text-white">Comprehensive analytics</span>
              </div>
              <div className="flex items-center text-cyan-400">
                <svg
                  className="w-6 h-6 mr-2 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  ></path>
                </svg>
                <span className="text-white">Advanced security</span>
              </div>
            </div>
          </div>
          {/* Right Panel */}
          <div className="w-full md:w-3/5 p-8">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Login</h2>
            <div className="space-y-6">
              <div>
                <label className="text-gray-300 block mb-2">Username</label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 transition duration-300"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-gray-300 block mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 transition duration-300"
                  placeholder="Enter your password"
                />
              </div>

              <div className="text-right">
                <a
                  href="#"
                  className="text-cyan-400 hover:text-cyan-500 transition duration-300 inline-block relative group"
                >
                  Forgot Password?
                  <span className="absolute left-0 bottom-0 w-full h-0.5 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </a>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full py-2 border-none ${
                  loading
                    ? "bg-cyan-300 cursor-not-allowed"
                    : "bg-cyan-400 hover:bg-cyan-500 hover:scale-105"
                } text-gray-900 rounded-lg font-semibold transition duration-300 transform`}
              >
                {loading ? (
                  <LoadingButton text={"Logging in"} />
                ) : (
                  "Login"
                )}
              </button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-gray-400">Don't have an account?</p>
              <a
                onClick={() => navigate("/SignUp")}
                className="text-cyan-400 hover:text-cyan-500 hover:cursor-pointer transition duration-300 inline-block relative group"
              >
                SignUp
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
