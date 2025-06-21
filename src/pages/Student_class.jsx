import { useState } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import api from "../utils/api";

axios.defaults.withCredentials = true;

function StudentClass() {
  const { id: class_id } = useParams();

  const data = [
    { name: "Present", value: 75, color: "#22c55e" },
    { name: "Absent", value: 25, color: "#ef4444" },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/20">
          <p className="text-white text-base font-semibold">
            {payload[0].name}: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  const [activeIndex, setActiveIndex] = useState(null);
  const [attendanceCode, setAttendanceCode] = useState("");
  const [status, setStatus] = useState(null);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();

    if (!attendanceCode?.trim())
      return alert("Please enter the attendance code");
    if (!navigator.geolocation) return alert("📍 Geolocation not supported");

    setStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("📍 Location:", lat, lng);

        try {
          // Step 1: Try initial attendance attempt
          const res = await api.post("/markAttendance", {
            class_id,
            attendance_code: attendanceCode,
            student_lat: lat,
            student_lng: lng,
          });

          // Case 1: Already registered and attendance marked
          if (res.status === 200) {
            return setStatus({ success: true, message: res.data.message });
          }

          // Case 2: Registration required
          if (res.status === 206 && res.data.step === "register") {
            console.log("Starting registration...");
            const attResp = await startRegistration({
              optionsJSON: res.data.registrationOptions,
            });
            await api.post("/verify-registration", attResp);
            alert("Registered successfully. Proceeding to authenticate...");
          }

          const authOptsRes = await api.post(
            "/generate-authentication-options"
          );
          const authResp = await startAuthentication({
            optionsJSON: authOptsRes.data,
          });

          await api.post("/verify-authentication", { auth_response: authResp });

          const finalRes = await api.post("/markAttendance", {
            class_id,
            attendance_code: attendanceCode,
            student_lat: lat,
            student_lng: lng,
          });

          setStatus({ success: true, message: finalRes.data.message });
        } catch (err) {
          console.error("Error:", err);
          const msg = err?.response?.data?.message || err.message;
          setStatus({ success: false, message: msg });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Please allow location access to mark attendance.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location unavailable. Please try again.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out. Try again.");
            break;
          default:
            alert("Unknown location error.");
        }
      }
    );
  };

  return (
    <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e8f3ff] dark:from-gray-900 dark:to-gray-950 min-h-screen p-8 flex flex-col gap-8 md:flex-row">
      <div className="flex flex-col gap-8 md:w-[40%] w-full">
        {/* Attendance Piechart */}
        <div className="flex items-center justify-center">
          <div className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-4">
                Student Attendance Report
              </h2>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={0}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                          className="transition-all duration-300"
                          style={{
                            filter:
                              activeIndex === index
                                ? "brightness(1.2)"
                                : "brightness(1)",
                            transform:
                              activeIndex === index
                                ? "scale(1.05)"
                                : "scale(1)",
                            transformOrigin: "center",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center space-x-8 mt-4">
                {data.map((entry, index) => (
                  <div key={index} className="flex items-center p-2 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-700 dark:text-gray-100 text-base">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Class Box */}
        <div className="w-full border border-gray-300 dark:border-white/10  bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-cyan-500/20 h-fit sticky top-8">
          <div className="p-6 border-b border-gray-300 dark:border-gray-800">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-2xl font-semibold">
              <Clock className="w-6 h-6" />
              Live Class
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <form className="space-y-6" onSubmit={handleAttendanceSubmit}>
                <div className="space-y-4">
                  <label className="text-gray-600 dark:text-gray-400 block text-lg">
                    Attendance Code
                  </label>
                  <input
                    type="text"
                    value={attendanceCode}
                    onChange={(e) => setAttendanceCode(e.target.value)}
                    placeholder="Enter attendance code"
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 h-12 text-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg h-12 text-lg transition-colors"
                >
                  Submit Attendance
                </button>

                {status && (
                  <div
                    className={`text-center text-lg mt-4 ${
                      status.success ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {status.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-[60%] w-full mx-auto">
        {/* Card Container */}
        <div className="bg-white/60 dark:bg-gray-800/50 rounded-xl shadow-lg shadow-cyan-500/10 backdrop-blur-sm border border-gray-300 dark:border-gray-700/50">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-300 dark:border-gray-700/50">
            <h2 className="text-xl text-cyan-600 dark:text-cyan-400 font-semibold">
              Attendance History
            </h2>
          </div>
          {/* Card Body */}
          <div className="p-6">
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <tr className="border-b border-gray-300 dark:border-gray-800">
                    <th className="py-4 px-6 text-left text-gray-600 dark:text-gray-400 text-lg">
                      Date
                    </th>
                    <th className="py-4 px-6 text-left text-gray-600 dark:text-gray-400 text-lg">
                      Subject
                    </th>
                    <th className="py-4 px-6 text-left text-gray-600 dark:text-gray-400 text-lg">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 text-lg text-gray-900 dark:text-white">
                      22/12/2024
                    </td>
                    <td className="py-4 px-6 text-lg text-gray-900 dark:text-white">
                      Mathematics
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-500 text-lg">Present</span>
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 text-lg text-gray-900 dark:text-white">
                      22/12/2024
                    </td>
                    <td className="py-4 px-6 text-lg text-gray-900 dark:text-white">
                      Mathematics
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-500 text-lg">Present</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {data.needsConfirmation && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Class
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="ClassName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2"
                >
                  Create a Class Name
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                  placeholder="Class name"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentClass;
