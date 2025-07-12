"use client";

import api from "../utils/api.js";
import { useEffect } from "react";
import React, { useState, useCallback } from "react";
import { Play, Users, Check, X, Megaphone, Bell } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import AttendanceTable from "../components/Tclass-attend_table.jsx";
import { PieChartIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";
import {
  Settings,
  Copy,
  Calendar,
  GraduationCap,
  Percent,
} from "lucide-react";

import { handleCopy } from "../components/Copy.jsx";

import { 
  CustomCard,
  CustomCardHeader,
  CustomCardTitle,
  CustomCardContent,
  CustomButton,
  CustomBarTooltip,
  renderActiveShape
} from "../components/CustomComponents.jsx";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";


function Dashboard({ darkMode, toggledarkMode }) {
  const { id: class_id } = useParams();
  const [status, setStatus] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);
  const onPieLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  const [isClassActive, setIsClassActive] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState("");
  const [settingOpen, setSettingOpen] = useState(false);

  const handleToggleClass = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const teacher_lat = position.coords.latitude;
        const teacher_lng = position.coords.longitude;

        try {
          if (!isClassActive) {
            const response = await api.post(`/startAttendance`, {
              class_id,
              teacher_lat,
              teacher_lng,
            });

            setAttendanceCode(response.data.code);
            setIsClassActive(true);
          } else {
            await api.post(`/stopAttendance`, {
              class_id,
            });

            setIsClassActive(false);
            setAttendanceCode("");
          }
        } catch (error) {
          console.error("Attendance error:", error);
          setStatus({
            success: false,
            message: response.data.message || "Attendance failed",
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to get your location. Please allow location access.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const [classDetails, setclassDetails] = useState("");
  const [attend_tableDetails, setattend_tableDetails] = useState([]);
  const [attendanceData, setattendanceData] = useState([]);
  const total = attend_tableDetails.length;

  useEffect(() => {
    console.log("Attendance table details length:", attend_tableDetails.length);
    if (attend_tableDetails.length === 0) {
      setEmpty(true);
      setattendanceData([]);
      return;
    }

    setEmpty(false);

    const dateMap = {};

    for (let entry of attend_tableDetails) {
      const { session_date, attendance_status } = entry;
      // Parsing DD-MM-YYYY manually
      let d;
      if (/^\d{2}-\d{2}-\d{4}$/.test(session_date)) {
        const [day, month, year] = session_date.split("-");
        d = new Date(`${year}-${month}-${day}`);
      } else {
        d = new Date(session_date);
      }
      if (isNaN(d.getTime())) {
        console.warn("Invalid session_date:", session_date, entry);
        continue;
      }
      const dateKey = `${String(d.getDate()).padStart(2, "0")}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${d.getFullYear()}`;

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { total: 0, present: 0 };
      }

      dateMap[dateKey].total++;
      if (attendance_status === "Present") {
        dateMap[dateKey].present++;
      }
    }

    let sessions = Object.entries(dateMap).map(
      ([date, { total, present }]) => ({
        date, // now in "DD/MM"
        attendance: present,
        percentage: Math.round((present / total) * 100),
      })
    );

    // Sorting by actual date
    sessions.sort((a, b) => {
      const [da, ma] = a.date.split("/").map(Number);
      const [db, mb] = b.date.split("/").map(Number);
      const d1 = new Date(2024, ma - 1, da); 
      const d2 = new Date(2024, mb - 1, db);
      return d1 - d2;
    });
    setattendanceData(sessions);
  }, [attend_tableDetails]);

  useEffect(() => {}, [attendanceData]);

  const presentCount = attend_tableDetails.filter(
    (entry) => entry.attendance_status === "Present"
  ).length;

  const absentCount = attend_tableDetails.filter(
    (entry) => entry.attendance_status === "Absent"
  ).length;

  const presentPercentage =
    total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0;

  const absentPercentage =
    total > 0 ? ((absentCount / total) * 100).toFixed(2) : 0;

  const pieData = [
    { name: "Present", value: parseFloat(presentPercentage), color: "#22C55E" },
    { name: "Absent", value: parseFloat(absentPercentage), color: "#EF4444" },
  ];

  console.log("Pie Data:", pieData);

  useEffect(() => {
    fetchClassDetails(class_id);
    fetchAttendtableDetails(class_id);
  }, [class_id]);

  useEffect(() => {
    console.log("Fetching class status for ID:", class_id);
    checkClassStatus();
  }, []);

  const checkClassStatus = async () => {
    try {
      const response = await api.get(`/isClassActive`, {
        params: { class_id },
      });

      setIsClassActive(response.data.isActive);
      console.log("Class status response:", response.data);
      console.log("Attendance code:", response.data.attendance_code);
      if (response.data.isActive) {
        setAttendanceCode(response.data.attendance_code);
      } else {
        setAttendanceCode("");
      }
    } catch (error) {
      console.error("Error checking class status:", error);
    }
  };

  const fetchClassDetails = async (class_id) => {
    console.log("Fetching class details for ID:", class_id);
    try {
      const res = await api.get(`/getTClassDetails/${class_id}`);
      setclassDetails(res.data);
    } catch (err) {
      console.error("Failed to load class details", err);
    }
  };

  const fetchAttendtableDetails = async (class_id) => {
    console.log("Fetching attendance table details for ID:", class_id);
    try {
      const res = await api.get(`/getTClass_attend_table_details/${class_id}`);

      // Format session_date in each item to DD-MM-YYYY
      const formatted = res.data.map((entry) => {
        const d = new Date(entry.session_date);
        const formattedDate = `${String(d.getDate()).padStart(2, "0")}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}-${d.getFullYear()}`;
        return {
          ...entry,
          session_date: formattedDate,
        };
      });

      console.log("Formatted attendance data:", formatted);

      setattend_tableDetails(formatted);

      console.log("Attendance table details:", res.data);
    } catch (err) {
      console.error("Failed to load attendance table details", err);
    }
  };

  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    console.log("Updated classDetails:", classDetails);
    console.log("Updated attendance table details:", attend_tableDetails);
    if (attend_tableDetails.length === 0) {
      setEmpty(true);
    } else {
      setEmpty(false);
    }
  }, [classDetails, attend_tableDetails]);

  const handleSettings = () => {
    setSettingOpen(true);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 transition-all duration-500 p-6 sm:p-10 md:p-12 lg:p-16 pt-24 sm:pt-24 md:pt-28 lg:pt-28 text-gray-900 dark:text-gray-100">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Course Info Card */}
            <CustomCard className="w-full bg-white dark:bg-gray-800 col-span-1 flex flex-col justify-between h-full">
              <CustomCardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500">
                <div className="flex items-center justify-between">
                  <CustomCardTitle className="text-white text-lg sm:text-xl font-semibold truncate">
                    {classDetails.name}
                  </CustomCardTitle>
                  <button
                    onClick={handleSettings}
                    className="p-2 sm:p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 group backdrop-blur-sm border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
                    title="Class Settings"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </CustomCardHeader>

              <CustomCardContent className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Teacher Info */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Instructor
                      </p>
                      <p className="text-md font-semibold text-gray-800 dark:text-gray-200 truncate">
                        <span className="text-base sm:text-lg font-medium break-words flex-1">
                          {classDetails.teacher_name
                            ? classDetails.teacher_name
                                .charAt(0)
                                .toUpperCase() +
                              classDetails.teacher_name.slice(1)
                            : ""}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Class Code */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Class Code
                      </p>
                      <div className="flex items-end justify-between">
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {classDetails.class_code}
                        </div>
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleCopy(classDetails.class_code);
                            }}
                            className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-600 flex-shrink-0"
                            title="Copy class code"
                          >
                            <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>

            {/* Live Class Card */}
            <CustomCard className="bg-white dark:bg-gray-800 lg:col-span-1">
              <CustomCardHeader>
                <CustomCardTitle className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isClassActive ? "bg-red-500 animate-pulse" : "bg-gray-400"
                    }`}
                  ></div>
                  Live Class
                </CustomCardTitle>
              </CustomCardHeader>
              <CustomCardContent className="space-y-4 text-gray-700 dark:text-gray-300">
                <CustomButton
                  className={`w-full ${
                    isClassActive
                      ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
                      : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                  } text-white font-semibold`}
                  onClick={handleToggleClass}
                >
                  {isClassActive ? "Stop Live Class" : "Start Live Class"}
                </CustomButton>
                {!isClassActive && (
                  <div className="text-center pt-2">
                    <CustomButton on className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <Calendar  onClick={() => Navigate('/Calendar')} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Schedule class
                      </span>
                    </CustomButton>
                  </div>
                )}

                {isClassActive && (
                  <div className="text-center space-y-3">
                    <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-lg p-2">
                      <div className="relative">
                        <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-wider">
                          {attendanceCode}
                        </p>
                        <button
                          onClick={() => handleCopy(attendanceCode)}
                          className="absolute -top-2 -right-2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                          title="Copy attendance code"
                        >
                          <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CustomCardContent>
            </CustomCard>

            {/* Total Students Card */}
            <CustomCard className="bg-white dark:bg-gray-800 col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col justify-between h-full">
              <CustomCardHeader>
                <CustomCardTitle>Total Students</CustomCardTitle>
              </CustomCardHeader>

              <CustomCardContent className="flex justify-between items-center text-gray-700 dark:text-gray-300 mt-auto">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-3xl">{classDetails.student_count}</span>
              </CustomCardContent>
            </CustomCard>
          </div>

          {!empty && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              {/* Average Attendance Pie Chart */}
              <CustomCard className="animate-fade-in w-full">
                <CustomCardHeader>
                  <div className="flex items-center space-x-2">
                    <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <CustomCardTitle className="truncate">
                      Average Attendance
                    </CustomCardTitle>
                  </div>
                </CustomCardHeader>
                <CustomCardContent className="flex flex-col items-center">
                  <div className="h-48 sm:h-56 md:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius="30%"
                          outerRadius="70%"
                          dataKey="value"
                          onMouseEnter={onPieEnter}
                          onMouseLeave={onPieLeave}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 mt-4 w-full">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 break-words">
                          {entry.name}
                          <span className="lg:hidden ">
                            : {entry.value.toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CustomCardContent>
              </CustomCard>

              {/* Daily Attendance Bar Chart */}
              <CustomCard
                className="animate-fade-in w-full"
                style={{ animationDelay: "0.1s" }}
              >
                <CustomCardHeader>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <CustomCardTitle className="truncate">
                      Daily Attendance Percentage
                    </CustomCardTitle>
                  </div>
                </CustomCardHeader>
                <CustomCardContent>
                  <div className="h-48 sm:h-56 md:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceData}>
                        <XAxis
                          dataKey="date"
                          stroke="currentColor"
                          className="text-gray-600 dark:text-gray-400"
                          tick={{ fill: "currentColor" }}
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <Tooltip
                          content={<CustomBarTooltip />}
                          cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                        />
                        <Bar
                          dataKey="percentage"
                          fill="url(#colorGradient)"
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient
                            id="colorGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3B82F6"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#1D4ED8"
                              stopOpacity={0.6}
                            />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CustomCardContent>
              </CustomCard>
            </div>
          )}
          {empty && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg font-semibold">
                No attendance records found for this class.
              </p>
              <p className="text-sm mt-2">
                Start a live class to begin recording attendance.
              </p>
            </div>
          )}

          {!empty && (
            <div className="w-full">
              <AttendanceTable
                studentData1={attend_tableDetails}
                onRefetch={fetchAttendtableDetails}
                class_id={class_id}
              />
            </div>
          )}

          {/* {settingOpen && (
            <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Settings
                  </h2>
                  <button
                    onClick={() => setSettingOpen(false)}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form
                  // onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="className"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Change class name
                    </label>
                    <input
                      type="text"
                      id="className"
                      // value={formData.name}
                      // onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter new name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="attendanceRate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Change attendance frequency rate
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="attendanceRate"
                        // value={formData.attendanceRate}
                        // onChange={(e) => handleInputChange('attendanceRate', e.target.value)}
                        className="w-full px-4 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Times per week"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="attendanceLimit"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Change attendance limit
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        id="attendanceLimit"
                        // value={formData.attendanceLimit}
                        // onChange={(e) => handleInputChange('attendanceLimit', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Percentage"
                        min="0"
                        max="100"
                        step="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
