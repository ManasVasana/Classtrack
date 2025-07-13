import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import api from "../utils/api";
import {
  AttendanceHistoryCard,
  AvgAttendance,
} from "../components/Sclass_components";

axios.defaults.withCredentials = true;

function StudentClass() {
  const { id: class_id } = useParams();

  const [attendanceData, setAttendanceData] = useState([]);

  const attendancePercentage =
    attendanceData.length > 0
      ? Math.round(
          (attendanceData.filter((entry) => entry.status === "Present").length /
            attendanceData.length) *
            100
        )
      : 0;

  const pieData = [
    { name: "Present", value: attendancePercentage, color: "#22C55E" },
    { name: "Absent", value: 100 - attendancePercentage, color: "#EF4444" },
  ];

  const getClassData = async () => {
    try {
      const res = await api.get(`/getClassData/${class_id}`);
      if (res.status === 200) {
        setAttendanceData(res.data);
      } else {
        alert("Failed to fetch class data: " + res.data.message);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
    }
  };

  useEffect(() => {
    getClassData();
  }, [class_id]);

  const [attendanceCode, setAttendanceCode] = useState("");
  const [status, setStatus] = useState(null);

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();

    if (!attendanceCode?.trim())
      return alert("Please enter the attendance code");
    if (!navigator.geolocation) return alert("Geolocation not supported");

    setStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("Location:", lat, lng);

        try {
          // Step 1: Try initial attendance attempt
          const res = await api.post(
            "/markAttendance",
            {
              class_id,
              attendance_code: attendanceCode,
              student_lat: lat,
              student_lng: lng,
            },
            { withCredentials: true }
          );

          // // Case 1: Already registered and attendance marked
          // if (res.status === 200) {
          //   return setStatus({ success: true, message: res.data.message });
          // }

          // Case 2: Registration required
          if (res.status === 206 && res.data.step === "register") {
            console.log("Starting registration...");
            const attResp = await startRegistration({
              optionsJSON: res.data.registrationOptions,
            });
            console.log("Registration response:", attResp);
            await api.post("/verify-registration", attResp, {
              withCredentials: true,
            });
            alert("Registered successfully. Click again to authenticate and mark");
          }

          if (res.status === 206 && res.data.step == "authenticate") {
            const authOptsRes = await api.post(
              "/generate-authentication-options",
              {},
              { withCredentials: true }
            );

            const authResp = await startAuthentication({
              optionsJSON: authOptsRes.data,
            });

            await api.post(
              "/verify-authentication",
              {
                auth_response: authResp,
              },
              { withCredentials: true }
            );

            const finalRes = await api.post(
              "/markAttendance",
              {
                class_id,
                attendance_code: attendanceCode,
                student_lat: lat,
                student_lng: lng,
              },
              { withCredentials: true }
            );

            setStatus({ success: true, message: finalRes.data.message });
          }
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
    <div className="relative">
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 transition-all duration-500 p-6 sm:p-10 md:p-12 lg:p-16 pt-24 sm:pt-24 md:pt-28 lg:pt-28 text-gray-900 dark:text-gray-100 flex flex-col gap-8 md:flex-row">
        <div className="flex flex-col gap-8 md:w-[40%] w-full">
          {/* Attendance Piechart */}
          <div className="flex items-center justify-center">
            <AvgAttendance pieData={pieData} attendanceData={attendanceData} />
          </div>

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

        <AttendanceHistoryCard
          class_id={class_id}
          attendanceData={attendanceData}
        />

        {/* {data.needsConfirmation && (
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
      )} */}
      </div>
    </div>
  );
}

export default StudentClass;
