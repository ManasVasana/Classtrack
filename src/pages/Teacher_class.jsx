"use client";

import axios from "axios";
import api from "../utils/api.js";
import { useEffect } from "react";
import React, { useState, useCallback } from "react";
import { Play, Users, Check, X, Megaphone, Bell } from "lucide-react";
import { useParams } from "react-router-dom";
import CountUp from "./Counting.jsx";
import AttendanceTable from "../components/Tclass-attend_table.jsx";
import { PlusCircle } from "react-feather";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";

const CustomCard = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const CustomCardHeader = ({ children, className = "" }) => (
  <div className={`p-3 sm:p-4 md:p-6 ${className}`}>{children}</div>
);

const CustomCardTitle = ({ children, className = "" }) => (
  <h2
    className={`text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 ${className}`}
  >
    {children}
  </h2>
);

const CustomCardContent = ({ children, className = "" }) => (
  <div className={`p-3 sm:p-4 md:p-6 ${className}`}>{children}</div>
);

const CustomButton = ({ children, className = "", ...props }) => (
  <button
    className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-900 dark:text-gray-100 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const CustomTable = ({ children, className = "" }) => (
  <div className={`w-full overflow-x-auto ${className}`}>
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </table>
  </div>
);

const CustomTableHeader = ({ children }) => (
  <thead className="bg-gray-100 dark:bg-gray-700">
    <tr>{children}</tr>
  </thead>
);

const CustomTableBody = ({ children }) => (
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    {children}
  </tbody>
);

const CustomTableHead = ({ children, className = "" }) => (
  <th
    scope="col"
    className={`px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

const CustomTableRow = ({ children }) => <tr>{children}</tr>;

const CustomTableCell = ({ children, className = "" }) => (
  <td
    className={`px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300 ${className}`}
  >
    {children}
  </td>
);

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-lg font-bold text-blue-500">{payload[0].value}%</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Date: {payload[0].payload.date}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Attendance: {payload[0].payload.attendance} students
        </p>
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;
  const sin = Math.sin((-midAngle * Math.PI) / 180);
  const cos = Math.cos((-midAngle * Math.PI) / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#E5E7EB"
        fontSize={14}
        fontWeight="bold"
      >
        {`${payload.name} ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// function getLast5SessionAttendance(data) {
//   // Step 1: Group by session_id
//   const sessions = {};

//   data.forEach((record) => {
//     const { session_id, session_date, attendance_status } = record;

//     if (!sessions[session_id]) {
//       sessions[session_id] = {
//         date: new Date(session_date),
//         total: 0,
//         present: 0,
//       };
//     }

//     sessions[session_id].total += 1;
//     if (attendance_status === "Present") {
//       sessions[session_id].present += 1;
//     }
//   });

//   // Step 2: Convert to array and sort by date (latest last)
//   const sessionArray = Object.values(sessions)
//     .map((s) => ({
//       date: s.date.toISOString().slice(5, 10), // "MM-DD"
//       percentage: Math.round((s.present / s.total) * 100),
//     }))
//     .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort descending
//     .slice(0, 5) // Last 5 sessions
//     .reverse(); // So it shows oldest to newest

//   return sessionArray;
// }

function Dashboard() {
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
            // Starting the class
            const response = await api.post(`/startAttendance`, {
              class_id,
              teacher_lat,
              teacher_lng,
            });

            setAttendanceCode(response.data.code);
            setIsClassActive(true);
          } else {
            // Stopping the class
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
    if (attend_tableDetails.length === 0) {
      setEmpty(true);
      setattendanceData([]);
      return;
    }

    setEmpty(false);

    const dateMap = {};

    for (let entry of attend_tableDetails) {
      const { session_date, attendance_status } = entry;

      const dateKey = new Date(session_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      }); // ⬅️ DD/MM format (using "en-GB")

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

    // Sort by actual date (using ISO parsing hack)
    sessions.sort((a, b) => {
      const [da, ma] = a.date.split("/").map(Number);
      const [db, mb] = b.date.split("/").map(Number);
      const d1 = new Date(2024, ma - 1, da); // year is dummy
      const d2 = new Date(2024, mb - 1, db);
      return d1 - d2;
    });
    setattendanceData(sessions);
  }, [attend_tableDetails]);

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
      setattend_tableDetails(res.data);
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
    <div className="min-h-screen w-full bg-gradient-to-r from-[#f0f9ff] to-[#e8f3ff] dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-950 p-2 sm:p-4 md:p-6 lg:p-14 text-gray-900 dark:text-gray-100">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Top Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Course Info Card */}
          <CustomCard className="w-full bg-white dark:bg-gray-800">
            <CustomCardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <CustomCardTitle>{classDetails.name}</CustomCardTitle>
            </CustomCardHeader>
            <CustomCardContent className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm sm:text-base">
                {classDetails.teacher_name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleCopy(classDetails.class_code);
                }}
                className="text-xs text-blue-600 dark:text-cyan-300 ml-auto"
                title="Copy class code"
              >
                {classDetails.class_code}
              </button>
            </CustomCardContent>
          </CustomCard>

          {/* Live Class Card */}
          <CustomCard className="bg-white dark:bg-gray-800">
            <CustomCardHeader>
              <CustomCardTitle>Live Class</CustomCardTitle>
            </CustomCardHeader>
            <CustomCardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <CustomButton
                className={`w-full ${
                  isClassActive
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                } text-white text-xs sm:text-sm md:text-base`}
                onClick={handleToggleClass}
              >
                {isClassActive ? "Stop Live Class" : "Start Live Class"}
              </CustomButton>

              {status && (
                <div className="text-center text-lg mt-4 text-red-500 dark:text-red-400">
                  {status.message}
                </div>
              )}

              {isClassActive && (
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Attendance Code:
                  </p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 px-4 py-2 rounded-md inline-block tracking-widest shadow-md border border-emerald-600">
                    {attendanceCode}
                  </p>
                </div>
              )}
            </CustomCardContent>
          </CustomCard>

          {/* Total Students Card */}
          <CustomCard className="bg-white dark:bg-gray-800">
            <CustomCardHeader>
              <CustomCardTitle>Total Students</CustomCardTitle>
            </CustomCardHeader>
            <CustomCardContent className="flex justify-between items-center text-gray-700 dark:text-gray-300">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              <CountUp target={classDetails.student_count} />
            </CustomCardContent>
          </CustomCard>
        </div>

        {!empty && (
          <div className="flex gap-4 sm:gap-6 items-center justify-center">
            {/* Average Attendance Card */}
            <CustomCard className="w-2/5 h-[400px] bg-white dark:bg-gray-800">
              <CustomCardHeader>
                <CustomCardTitle>Average Attendance</CustomCardTitle>
              </CustomCardHeader>
              <CustomCardContent className="flex flex-col items-center text-gray-700 dark:text-gray-300">
                <div className="md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="0%"
                        outerRadius="80%"
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
                <div className="flex gap-4 sm:gap-8 mt-2 sm:mt-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                    <span>Absent</span>
                  </div>
                </div>
                <div className="flex justify-center space-x-8 mt-4">
                  {pieData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-base">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CustomCardContent>
            </CustomCard>

            {/* Daily Attendance Chart */}
            <CustomCard className="w-3/5 h-[400px] bg-black dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow">
              <CustomCardHeader>
                <CustomCardTitle className="text-gray-900 dark:text-gray-100">
                  Daily Attendance Percentage
                </CustomCardTitle>
              </CustomCardHeader>
              <CustomCardContent className="text-gray-700 dark:text-gray-300">
                <div className="md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                      <XAxis
                        dataKey="date"
                        stroke="#6B7280"
                        tick={{ fill: "#6B7280" }}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<CustomBarTooltip />}
                        cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                      />
                      <Bar
                        dataKey="percentage"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CustomCardContent>
            </CustomCard>
          </div>
        )}

        {!empty && (
          <AttendanceTable
            studentData1={attend_tableDetails}
            onRefetch={fetchAttendtableDetails}
          />
        )}
      </div>
      {/* <div className="flex justify-center fixed bottom-8 right-8">
        <button
          // onClick={addClass}
          className="group relative inline-flex items-center justify-center px-3 py-3 overflow-hidden font-bold text-white rounded-full shadow-2xl bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 ease-out hover:scale-105"
        >
          <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
          <PlusCircle />
        </button>
      </div> */}
    </div>
  );
}

export default Dashboard;
