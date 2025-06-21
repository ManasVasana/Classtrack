import { useState } from "react";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaChevronDown,
  FaEnvelope,
} from "react-icons/fa";
import Axios from "axios";
import { useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import Notification from "../components/Notification";

function SignUp() {
  const [showNotification, setShowNotification] = useState(false);

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState("");

  const toggleRoleDropdown = () => {
    setIsRoleDropdownOpen(!isRoleDropdownOpen);
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    setIsRoleDropdownOpen(false);
    setErrors((prev) => ({ ...prev, role: "" }));
  };

  const validateFields = () => {
    const newErrors = {};
    if (!role) newErrors.role = "Please select a role.";
    if (!username) newErrors.username = "Username is required.";
    if (!password) newErrors.password = "Password is required.";
    if (!email) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email format is invalid.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const data = {
      username,
      password_hash: password,
      role,
      email,
    };

    console.log("Sending data:", data);

    try {
      const response = await Axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/SignUp`,
        data
      );
      console.log("Sending data:", data);

      if (response.status === 200) {
        setShowNotification(true);
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (err) {
      console.error(err);

      if (err.response) {
        if (err.response.status === 409) {
          // Handle conflict: username already exists
          setErrors((prev) => ({
            ...prev,
            username: err.response.data.message || "Username already exists.",
          }));
        } else if (err.response.data?.error) {
          // Handle other known server errors
          setErrors((prev) => ({ ...prev, username: err.response.data.error }));
        } else {
          alert("Server error. Please try again later.");
        }
      } else {
        alert("Unable to reach server. Please check your connection.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 text-cyan-400">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 shadow-2xl rounded-3xl overflow-hidden">
          <h1 className="text-white bg-cyan-400 shadow-lg flex justify-center items-center text-3xl sm:text-4xl p-6 font-bold font-sans rounded-t-3xl">
            Join ClassTrack
          </h1>

          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <h2 className="text-cyan-400 text-2xl font-bold text-center mb-6">
              Create your account
            </h2>

            <div className="space-y-4">
              {/* Role Selection */}
              <div className="relative">
                <div
                  className={`flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 transition duration-300 ${
                    isRoleDropdownOpen
                      ? "ring-2 ring-cyan-400 border-cyan-400"
                      : "focus-within:ring-2 focus-within:ring-cyan-400 focus-within:border-cyan-400"
                  }`}
                  onClick={toggleRoleDropdown}
                >
                  <div className="flex items-center gap-3 text-white cursor-pointer">
                    {role === "" ? (
                      <FaUser className="text-cyan-400" />
                    ) : role === "student" ? (
                      <FaUserGraduate className="text-cyan-400" />
                    ) : (
                      <FaChalkboardTeacher className="text-cyan-400" />
                    )}
                    <span>
                      {role === ""
                        ? "Please select your role"
                        : role === "student"
                        ? "Student"
                        : "Teacher"}
                    </span>
                  </div>
                  <FaChevronDown
                    className={`text-cyan-400 transition-transform duration-300 ${
                      isRoleDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Dropdown (absolute but overlaps) */}
                {isRoleDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 rounded-lg bg-gray-700 border border-gray-600 shadow-lg z-10">
                    <div
                      className={`px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2 ${
                        role === "student" ? "bg-gray-600" : ""
                      }`}
                      onClick={() => selectRole("student")}
                    >
                      <FaUserGraduate className="text-cyan-400" />
                      <span>Student</span>
                    </div>
                    <div
                      className={`px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2 ${
                        role === "teacher" ? "bg-gray-600" : ""
                      }`}
                      onClick={() => selectRole("teacher")}
                    >
                      <FaChalkboardTeacher className="text-cyan-400" />
                      <span>Teacher</span>
                    </div>
                  </div>
                )}

                {errors.role && (
                  <p className="text-red-400 text-sm mt-1">{errors.role}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400 transition duration-300 px-3 py-2">
                  <FaEnvelope className="text-cyan-400 mr-3" />
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Enter your email"
                    className="bg-transparent outline-none text-white w-full"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400 transition duration-300 px-3 py-2">
                  <FaUser className="text-cyan-400 mr-3" />
                  <input
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Username"
                    className="bg-transparent outline-none text-white w-full"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400 transition duration-300 px-3 py-2">
                  <FaLock className="text-cyan-400 mr-3" />
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="bg-transparent outline-none text-white w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-cyan-400 hover:text-cyan-500 ml-2"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                )}
              </div>
            </div>

            <button
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 rounded-full transition duration-300 shadow-lg"
              type="submit"
            >
              Sign Up
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pb-8">
            <p className="text-gray-400">Already have an account?</p>
            <a
              className="text-cyan-400 hover:text-cyan-500 hover:cursor-pointer transition duration-300 inline-block relative group"
              onClick={() => navigate("/")}
            >
              Log In
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </a>
          </div>
        </div>
      </div>
      {showNotification && (
        <Notification
          icon={<BadgeCheck className="w-5 h-5 text-white" />}
          message="Account created successfully! Redirecting to login..."
          color="#10b981" // tailwind green-500
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
}

export default SignUp;
