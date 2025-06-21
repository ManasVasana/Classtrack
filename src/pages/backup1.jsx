import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaUser, FaMale, FaFemale, FaChevronDown } from "react-icons/fa";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "Manas Kumar",
    username: "manas123",
    email: "manas@example.com",
    gender: "",
    role: "Teacher",
    joinedAt: "2023-08-10",
    deviceBound: true,
    image: "/male-student.png",
  });

  const [password, setPassword] = useState("");
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);

  const toggleGenderDropdown = () => {
    setIsGenderDropdownOpen(!isGenderDropdownOpen);
  };

  const selectGender = (selectedGender) => {
    setUserData({ ...userData, gender: selectedGender });
    setIsGenderDropdownOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-75px)] bg-gradient-to-r from-gray-900 to-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-gray-800 text-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="md:w-1/3 bg-gray-850 p-8 flex flex-col items-center justify-center border-r border-gray-700">
          <img
            src={userData.image}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-cyan-400 shadow-lg"
          />
          <h2 className="text-2xl font-semibold text-cyan-400">
            {userData.name}
          </h2>
        </div>

        {/* Right Panel */}
        <div className="md:w-2/3 p-8 md:space-y-6 space-y-4">
          <h2 className="text-3xl font-bold hidden md:block text-cyan-400 mb-2">
            Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-gray-400 mb-1">Username</label>
              <input
                disabled
                value={userData.username}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
              />
            </div>

            {/* Device Binding */}
            <div>
              <label className="block text-gray-400 mb-1">Device Binding</label>
              <input
                disabled
                value={userData.deviceBound ? "Active" : "Not Bound"}
                className={`w-full px-4 py-2 rounded-lg bg-gray-700 ${userData.deviceBound ? "text-green-400" : "text-red-400"}
                 border border-gray-600`}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-gray-400 mb-1">Full Name</label>
              <input
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <input
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
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
            <div className="relative">
              <label className="block text-gray-400 mb-1">Gender</label>
              <div
                className="flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 cursor-pointer"
                onClick={toggleGenderDropdown}
              >
                <div className="flex items-center gap-3 text-white">
                  {userData.gender === "female" ? (
                    <FaFemale className="text-cyan-400" />
                  ) : userData.gender === "male" ? (
                    <FaMale className="text-cyan-400" />
                  ) : (
                    <FaUser className="text-cyan-400" />
                  )}
                  <span>
                    {userData.gender === ""
                      ? "Select Gender"
                      : userData.gender.charAt(0).toUpperCase() +
                        userData.gender.slice(1)}
                  </span>
                </div>
                <FaChevronDown
                  className={`text-cyan-400 transition-transform duration-300 ${
                    isGenderDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {isGenderDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-lg bg-gray-700 border border-gray-600 shadow-lg z-10">
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
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-4">
            <button
              onClick={() => alert("Change Password")}
              className="px-6 py-2 rounded-lg bg-cyan-400 text-gray-900 hover:bg-cyan-500 font-semibold transition"
            >
              Save Changes
            </button>
            <button
              onClick={() => alert("Logged out")}
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
