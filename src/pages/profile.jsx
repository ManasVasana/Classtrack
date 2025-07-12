import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { startTransition } from "react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setuserData] = useState({});
  const [password, setPassword] = useState("");

  useEffect(() => {
    const cachedUser = localStorage.getItem("userData");
    if (cachedUser) {
      setuserData(JSON.parse(cachedUser));
    }

    fetchUserInfo();
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
    console.log("userdata:", userData);

    try {
      const res = await api.post("/handleChanges", {
        userData,
        password,
      });
    } catch (err) {
      console.error("Failed to update the data:", err);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-6 pt-28 md:pt-16">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 dark:text-white text-gray-900 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="md:w-1/3 bg-gray-300 dark:bg-gray-800 p-8 flex flex-col items-center justify-center border-r border-gray-300 dark:border-gray-700">
          <img
            src="./user (1).png"
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-cyan-400 shadow-lg"
          />
          <h2 className="text-2xl font-semibold text-cyan-600 dark:text-cyan-400 truncate max-w-[200px]">
            {userData.username}
          </h2>
        </div>

        {/* Right Panel */}
        <div className="md:w-2/3 p-8 md:space-y-6 space-y-4">
          <h2 className="text-3xl font-bold hidden md:block text-cyan-600 dark:text-cyan-400 mb-2">
            Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1">
                Full Name
              </label>
              <input
                value={userData.username || ""}
                onChange={(e) =>
                  setuserData({ ...userData, username: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1">
                Device Binding
              </label>
              <input
                disabled
                value={userData.deviceBound ? "Active" : "Not Bound"}
                className={`w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${
                  userData.deviceBound
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                } border border-gray-300 dark:border-gray-600`}
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1">
                Email
              </label>
              <input
                value={userData.email || ""}
                onChange={(e) =>
                  setuserData({ ...userData, email: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1">
                Change Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-4">
            <button
              onClick={() => handleChanges()}
              className="px-6 py-2 rounded-lg bg-cyan-500 dark:bg-cyan-400 text-white dark:text-gray-900 hover:bg-cyan-600 dark:hover:bg-cyan-500 font-semibold transition"
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
