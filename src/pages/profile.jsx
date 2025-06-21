import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FaUser, FaMale, FaFemale, FaChevronDown } from "react-icons/fa";
import api from "../utils/api";
import { startTransition } from "react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setuserData] = useState({});
  const [password, setPassword] = useState("");
  // const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  // const dropdownRef = useRef();

useEffect(() => {
  const cachedUser = localStorage.getItem("userData");
  if (cachedUser) {
    setuserData(JSON.parse(cachedUser));
  }

  fetchUserInfo(); // Fetch in background to update if needed
}, []);

const fetchUserInfo = async () => {
  try {
    const { data } = await api.get("/GetUserInfo");
    startTransition(() => {
      setuserData(data);
    });
      console.log(userData);
    localStorage.setItem("userData", JSON.stringify(data));
  } catch (err) {
    console.error("Failed to load user info", err);
  }
};


  const handleChanges = async () => {
    console.log("userdata:",userData);

    try {
      const res = await api.post("/handleChanges",{
        userData,
        password,
      });
    }
    catch (err) {
      console.error("Failed to update the data:", data);
    }

  }

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account?")) {
      try {
        await api.post("/DeleteAccount");
        navigate("/");
      } catch (err) {
        console.error("Failed to delete account", err);
        alert("Failed to delete account. Please try again later.");
      }
    }
  };

  // const toggleGenderDropdown = () => {
  //   setIsGenderDropdownOpen((prev) => !prev);
  // };

  // const selectGender = (selectedGender) => {
  //   setuserData({ ...userData, gender: selectedGender });
  //   setIsGenderDropdownOpen(false);
  // };

  // // Close dropdown on outside click
  // useEffect(() => {
  //   const handleClickOutside = (e) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
  //       setIsGenderDropdownOpen(false);
  //     }
  //   };
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);

  // const getIcon = () => {
  //   if (userData.gender === "male") return <FaMale className="text-cyan-400" />;
  //   if (userData.gender === "female")
  //     return <FaFemale className="text-cyan-400" />;
  //   return <FaUser className="text-cyan-400" />;
  // };

  // const getGenderLabel = () => {
  //   if (!userData.gender) return "Select Gender";
  //   return userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1);
  // };

  return (
    <div className="min-h-[calc(100vh-75px)] bg-gradient-to-r from-gray-900 to-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-gray-800 text-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="md:w-1/3 bg-gray-850 p-8 flex flex-col items-center justify-center border-r border-gray-700">
          <img
            src="./female-student.png"
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-cyan-400 shadow-lg"
          />
          <h2 className="text-2xl font-semibold text-cyan-400 truncate max-w-[200px]">
            {userData.username}
          </h2>
        </div>

        {/* Right Panel */}
        <div className="md:w-2/3 p-8 md:space-y-6 space-y-4">
          <h2 className="text-3xl font-bold hidden md:block text-cyan-400 mb-2">
            Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            {/* <div>
              <label className="block text-gray-400 mb-1">Username</label>
              <input
                disabled
                value={userData.username || ""}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
              />
            </div> */}

            {/* Full Name */}
            <div>
              <label className="block text-gray-400 mb-1">Full Name</label>
              <input
                value={userData.username || ""}
                onChange={(e) =>
                  setuserData({ ...userData, username: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Device Binding */}
            <div>
              <label className="block text-gray-400 mb-1">Device Binding</label>
              <input
                disabled
                value={userData.deviceBound ? "Active" : "Not Bound"}
                className={`w-full px-4 py-2 rounded-lg bg-gray-700 ${
                  userData.deviceBound ? "text-green-400" : "text-red-400"
                } border border-gray-600`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <input
                value={userData.email || ""}
                onChange={(e) =>
                  setuserData({ ...userData, email: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-400 mb-1">
                Change Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Gender Dropdown */}
            {/* <div className="relative" ref={dropdownRef}>
              <label className="block text-gray-400 mb-1">Gender</label>
              <div
                className="flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 cursor-pointer"
                onClick={toggleGenderDropdown}
              >
                <div className="flex items-center gap-3 text-white">
                  {getIcon()}
                  <span>{getGenderLabel()}</span>
                </div>
                <FaChevronDown
                  className={`text-cyan-400 transition-transform duration-300 ${
                    isGenderDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {isGenderDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-lg bg-gray-700 border border-gray-600 shadow-lg z-[999]">
                  <div
                    className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2"
                    onClick={() => selectGender("male")}
                  >
                    <FaMale className="text-cyan-400" />
                    <span>Male</span>
                  </div>
                  <div
                    className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2"
                    onClick={() => selectGender("female")}
                  >
                    <FaFemale className="text-cyan-400" />
                    <span>Female</span>
                  </div>
                </div>
              )}
            </div> */}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-4">
            <button
              onClick={() => handleChanges()}
              className="px-6 py-2 rounded-lg bg-cyan-400 text-gray-900 hover:bg-cyan-500 font-semibold transition"
            >
              Save Changes
            </button>
            <button
              onClick={() => handleDeleteAccount()}
              className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
