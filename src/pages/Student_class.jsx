import { useState } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import base64url from "base64url";

axios.defaults.withCredentials = true;

function StudentClass() {
  const { id: class_id } = useParams();
  const student_username = localStorage.getItem("username");

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

  if (!attendanceCode) return alert("Please enter the code");

  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        // Step 1: Request authentication options
        const optionsRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/generate-authentication-options`,
          { username: student_username },
          { withCredentials: true }
        );

        const options = optionsRes.data;

        // Step 2: If user has no credentials, do registration
        if (options.registrationRequired) {
          const regOptionsRes = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/generate-registration-options`,
            { username: student_username },
            { withCredentials: true }
          );

          const regOptions = regOptionsRes.data;

          // ⚠️ Ensure proper config is enforced here for device-resident passkey
          regOptions.authenticatorSelection = {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "required",
            requireResidentKey: true,
          };
          regOptions.attestation = "none";

          const attestationResponse = await startRegistration({optionsJSON: regOptions});

          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/verify-registration`,
            {
              username: student_username,
              attestationResponse,
            },
            { withCredentials: true }
          );

          alert("✅ Device registered! Retrying attendance...");
          return handleAttendanceSubmit(e); // Re-attempt authentication
        }

        // Step 3: Authenticate using registered passkey
        const authResponse = await startAuthentication({optionsJSON: options});

        // Step 4: Submit attendance
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/markAttendance`,
          {
            class_id,
            student_username,
            attendance_code: attendanceCode,
            student_lat: lat,
            student_lng: lng,
            auth_response: authResponse,
          },
          { withCredentials: true }
        );

        setStatus({ success: true, message: res.data.message });
      } catch (err) {
        console.error("Attendance error:", err);

        const serverMessage =
          err?.response?.data?.message || err.message || "Attendance failed";

        setStatus({ success: false, message: serverMessage });
      }
    },
    () => alert("Unable to retrieve your location"),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};


  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-950 min-h-screen p-8 flex flex-col gap-8 md:flex-row">
      <div className="flex flex-col gap-8 md:w-[40%] w-full">
        {/* Attendance Piechart */}
        <div className="flex items-center justify-center">
          <div
            className="w-full bg-gray-800/80 backdrop-blur-lg text-white border border-white/10 shadow-2xl 
          hover:shadow-3xl transition-all duration-500 ease-in-out rounded-xl overflow-hidden"
          >
            <div className="p-6">
              <h2
                className="text-2xl font-bold text-center text-white bg-clip-text text-transparent bg-gradient-to-r 
              from-white to-gray-300 mb-4"
              >
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
                    <span className="text-gray-100 text-base">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Class Box */}
        <div className="w-full bg-gray-800 rounded-xl shadow-lg shadow-cyan-500/20 h-fit sticky top-8">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2 text-cyan-400 text-2xl font-semibold">
              <Clock className="w-6 h-6" />
              Live Class
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <form className="space-y-6" onSubmit={handleAttendanceSubmit}>
                <div className="space-y-4">
                  <label className="text-gray-400 block text-lg">
                    Attendance Code
                  </label>
                  <input
                    type="text"
                    value={attendanceCode}
                    onChange={(e) => setAttendanceCode(e.target.value)}
                    placeholder="Enter attendance code"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 h-12 text-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                      status.success ? "text-green-400" : "text-red-400"
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
        <div className="bg-gray-800/50 rounded-xl shadow-lg shadow-cyan-500/10 backdrop-blur-sm border border-gray-700/50">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl text-cyan-400 font-semibold">
              Attendance History
            </h2>
          </div>
          {/* Card Body */}
          <div className="p-6">
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-sm">
                  <tr className="border-b border-gray-800">
                    <th className="py-4 px-6 text-left text-gray-400 text-lg">
                      Date
                    </th>
                    <th className="py-4 px-6 text-left text-gray-400 text-lg">
                      Subject
                    </th>
                    <th className="py-4 px-6 text-left text-gray-400 text-lg">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 text-lg text-white">22/12/2024</td>
                    <td className="py-4 px-6 text-lg text-white">
                      Mathematics
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-500 text-lg">Present</span>
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 text-lg text-white">22/12/2024</td>
                    <td className="py-4 px-6 text-lg text-white">
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
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Create New Class
              </h2>
            </div>
            <div className="space-y-4">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentClass;
