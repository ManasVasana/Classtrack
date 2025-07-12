import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, X } from "react-feather";
import { User, Users, BarChart, Copy } from "react-feather";
import api from "../utils/api";
// import Notification from "../components/notification";
import { jwtDecode } from "jwt-decode";
import {
  CheckCircle,
  BookOpen,
  Calendar,
  Clock,
  Star,
  Target,
  TrendingUp,
  AlertTriangle,
  Plus,
  TrendingDown,
  Activity,
  Shield,
  Trophy,
  Activity as ActivityIcon,
  BarChart as BarChartIcon,
  Copy as CopyIcon,
  Percent,
} from "lucide-react";
import Footer from "../components/footer";
import { handleCopy } from "../components/Copy";

const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    console.log("Decoded token:", decoded);
    return decoded;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
};

function Mainpage({ darkMode, toggleDarkMode }) {
  const [joinCode, setJoinCode] = useState("");
  const [className, setClassName] = useState("");
  const [frequencyRate, setFrequencyRate] = useState(0);
  const [attendanceLimit, setAttendanceLimit] = useState(0);
  const [isTeacher, setIsTeacher] = useState(false);
  const [username, setUsername] = useState("");
  const [newClass, setNewClass] = useState(false);
  const [classes, setClasses] = useState([]);
  // const [showNotification, setShowNotification] = useState(false);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get("/GetClasses");
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  useEffect(() => {
    const user = getUserFromToken();
    if (user) {
      setIsTeacher(user.role === "teacher");
      setUsername(user.username);
      fetchClasses();
    } else {
      alert("Invalid or missing token. Please login again.");
    }
  }, []);

  const addClass = () => {
    setNewClass(!newClass);
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/JoinClass", {
        class_code: joinCode,
      });

      const result = await res.data;

      if (res.status === 200) {
        alert("Successfully joined class!");
        setNewClass(false);
        setJoinCode("");
        fetchClasses();
      } else {
        alert(result.message || "Unable to join class.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again.");
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/CreateClass", {
        name: className,
        frequency_rate: frequencyRate,
        attendance_limit: attendanceLimit,
      });

      const result = await res.data;

      if (res.status === 200) {
        alert(`Class created successfully! Code: ${result.class_code}`);
        setNewClass(false);
        setClassName("");
        fetchClasses();
      } else {
        alert(result.message || "Error creating class.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  };

  const totalSessionsAllClasses = classes.reduce(
    (sum, cls) => sum + cls.total_sessions,
    0
  );

  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );

      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalAttendancePercentage = classes.reduce((sum, cls) => {
    if (cls.total_sessions > 0) {
      const percentage = (cls.present_sessions / cls.total_sessions) * 100;
      return sum + percentage;
    }
    return sum;
  }, 0);

  const classCountWithSessions = classes.filter(
    (cls) => cls.total_sessions > 0
  ).length;
  const averageAttendancePercentage =
    classCountWithSessions > 0
      ? (totalAttendancePercentage / classCountWithSessions).toFixed(1)
      : "0.0";

      const totalSessionsTaken = classes.reduce(
  (sum, cls) => sum + cls.total_sessions,
  0
);


  const dangerClasses = [
    // {
    //   id: 1,
    //   name: "Mathematics",
    //   attendance_rate: 62,
    //   sessions_missed: 5,
    // },
    // {
    //   id: 2,
    //   name: "Physics",
    //   attendance_rate: 68,
    //   sessions_missed: 4,
    // },
    // {
    //   id: 3,
    //   name: "Chemistry",
    //   attendance_rate: 59,
    //   sessions_missed: 6,
    // },
  ];

  return (
    <>
      <div className="p-6 pt-24 md:block min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 transition-all duration-500">
        <div className="relative">
          <div className="absolute inset-0 opacity-40 dark:opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
          <div className="mb-6 sm:mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/30 dark:border-gray-700/30">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
                <div className="flex-1 w-full lg:w-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[46px] font-bold text-gray-900 dark:text-white leading-tight">
                        Welcome back,{""}
                        <span className="dark:text-white text-gray-900">
                          {username.charAt(0).toUpperCase() + username.slice(1)}
                        </span>
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                        {isTeacher
                          ? "Manage your classes and track student progress"
                          : "Access your classes and view your attendance"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full lg:w-auto">
                  <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1">
                    {currentDate}
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    {currentTime}
                  </div>
                  <div className="content-center flex items-center justify-center gap-2">
                    <div className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium">
                      {isTeacher ? "Teacher" : "Student"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {classes.length > 0 && (
            <div className="grid xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-2 gap-6 mb-10">
              {/* Active Classes */}
              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Active Classes
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {classes.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +0 this week
                  </span>
                </div>
              </div>

              {/* Weekly Attendance */}
              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Weekly Attendance
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {averageAttendancePercentage}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                    <BarChart className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +{0}% from last week
                  </span>
                </div>
              </div>

              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {isTeacher === true
                        ? "Sessions Taken"
                        : "Sessions Attended"}
                    </p>

                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isTeacher === true ? 0 : totalSessionsAllClasses}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <Clock className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    0 sessions today
                  </span>
                </div>
              </div>

              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Average Performance
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {averageAttendancePercentage}%
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                    <Target className="w-6 h-6 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    Above target
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
            <div className="xl:col-span-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Your Classes
                  </h2>
                  <p className="text-gray-600 hidden md:block dark:text-gray-400 mt-1 text-sm sm:text-base">
                    Manage and access all your classes
                  </p>
                </div>
                <button
                  onClick={addClass}
                  className="md:inline-flex relative items-center hidden gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-xl hover:scale-105 text-sm sm:text-base cursor-pointer"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isTeacher ? "Create Class" : "Join Class"}
                </button>
              </div>
              <div className="grid xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 gap-y-14 px-3 py-4">
                {classes.map((cls, index) => (
                  <Link
                    to={isTeacher ? `/TClass/${cls.id}` : `/STClass/${cls.id}`}
                    key={index}
                  >
                    <div className="hover:-translate-y-2 duration-200 transition-all max-w-[300px] mx-auto">
                      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
                        <div className="h-20 bg-gradient-to-r from-cyan-500 to-blue-500 relative">
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleCopy(cls.class_code);
                              }}
                              className="text-white text-xs hover:text-cyan-300"
                              title="Copy class code"
                            >
                              <span className="text-xs font-medium text-white hover:text-cyan-300">
                                {cls.class_code}
                              </span>
                            </button>
                          </div>

                          <div className="absolute -bottom-10 left-5 h-20 w-20 rounded-full z-10 bg-gray-100 dark:bg-gray-900 dark:border-4 dark:border-gray-800 flex items-center justify-center shadow-md">
                            <div className="...">
                              <span className="text-gray-900 dark:text-white font-bold text-4xl">
                                {cls.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 pt-12 space-y-4 bg-white z-0 dark:bg-gray-800 rounded-b-lg relative">
                          <div className="space-y-1 mt-2">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {cls.name}
                            </h3>
                            {!isTeacher && (
                              <span className="text-cyan-600 dark:text-cyan-400">
                                <User className="h-4 w-4 inline text-cyan-400 mr-1" />
                                {cls.teacher_name.charAt(0).toUpperCase() +
                                  cls.teacher_name.slice(1)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Users className="h-4 w-4 text-cyan-400 mr-1" />
                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                  Students
                                </span>
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {cls.student_count}
                              </div>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                              <div className="flex items-center justify-center mb-1">
                                <BarChart className="h-4 w-4 text-cyan-400 mr-1" />
                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                  Attendance
                                </span>
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {cls.total_sessions > 0
                                  ? `${Math.round(
                                      (cls.present_sessions /
                                        cls.total_sessions) *
                                        100
                                    )}%`
                                  : "0%"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="xl:col-span-1 space-y-4 sm:space-y-6">
              {/* Classes Need Attention */}
              {!isTeacher &&
                (false ? (
                  <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl text-white">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base">
                          Achievement
                        </h3>
                        <p className="text-xs sm:text-sm opacity-90">
                          Perfect Week!
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm opacity-90">
                      You've maintained 100% attendance this week. Keep up the
                      excellent work!
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl text-gray-700 dark:text-gray-300 text-center">
                    <p className="text-sm sm:text-base font-medium">
                      No achievements yet
                    </p>
                    <p className="text-xs sm:text-sm opacity-80">
                      Attend regularly to unlock badges and achievements.
                    </p>
                  </div>
                ))}

              {!isTeacher && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 dark:border-gray-700/30 hover:shadow-2xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    Classes Need Attention
                  </h3>
                  <div className="space-y-4">
                    {dangerClasses.length > 0 ? (
                      dangerClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 via-orange-50 to-red-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50 hover:from-red-100 hover:via-orange-100 hover:to-red-100 dark:hover:from-red-900/30 dark:hover:via-orange-900/30 dark:hover:to-red-900/30 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-white font-bold text-sm">
                                  {cls.name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-red-900 dark:text-red-300 text-sm truncate">
                                    {cls.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    Attendance:{" "}
                                    <span className="font-semibold">
                                      {cls.attendance_rate}%
                                    </span>
                                  </p>
                                  <span className="text-xs text-red-500">
                                    •
                                  </span>
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    Need:{" "}
                                    <span className="font-semibold">70%</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                                      style={{
                                        width: `${cls.attendance_rate}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    {cls.sessions_missed} missed
                                  </span>
                                </div>
                              </div>
                              <div className="text-red-500 group-hover:scale-110 transition-transform duration-300">
                                <TrendingDown className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <h4 className="font-bold text-green-700 dark:text-green-300 text-base mb-1">
                          All Classes Performing Well!
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Your attendance is above the required threshold
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 dark:border-gray-700/30">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  Recent Activity
                </h3>

                <div className="space-y-4">
                  {false ? (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          Attendance marked
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Advanced Mathematics - 2 hours ago
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center fixed bottom-8 md:hidden right-8">
            <button
              onClick={addClass}
              className="group relative inline-flex items-center justify-center px-3 py-3 overflow-hidden font-bold text-white rounded-full shadow-2xl bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 ease-out hover:scale-105"
            >
              <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
              <PlusCircle />
            </button>
          </div>

          {newClass && !isTeacher && (
            <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-40">
              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Join New Class
                  </h2>
                  <button
                    onClick={addClass}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form className="space-y-4" onSubmit={handleJoinClass}>
                  <div>
                    <label
                      htmlFor="classCode"
                      className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                    >
                      Class Code
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                      placeholder="Enter class code"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg shadow-md hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-all duration-300"
                  >
                    Join Class
                  </button>
                </form>
              </div>
            </div>
          )}

          {isTeacher && newClass && (
            <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center z-50 justify-center">
              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-2xl w-96 transform transition-all duration-300 ease-in-out hover:scale-105">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Class
                  </h2>
                  <button
                    onClick={addClass}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form className="space-y-4" onSubmit={handleCreateClass}>
                  <div>
                    <label
                      htmlFor="ClassName"
                      className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                    >
                      Create a Class Name
                    </label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                      placeholder="Class name"
                      required
                    />
                  </div>

                  {/* Attendance Frequency Rate */}
                  <div>
                    <label
                      htmlFor="attendanceRate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Reminder Frequency Rate
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="attendanceRate"
                        value={frequencyRate}
                        onChange={(e) => setFrequencyRate(e.target.value)}
                        className="w-full px-4 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Times per week"
                        min="1"
                        max="100"
                        required
                      />
                    </div>
                  </div>

                  {/* Attendance Limit */}
                  <div>
                    <label
                      htmlFor="attendanceLimit"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Attendance Limit
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        id="attendanceLimit"
                        value={attendanceLimit}
                        onChange={(e) => setAttendanceLimit(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter attendance limit"
                        min="0"
                        max="100"
                        step="1"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg shadow-md hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-all duration-300"
                  >
                    Create Class
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* {showNotification && (
            <Notification
              icon={<CheckCircle className="w-5 h-5 text-white" />}
              message="Class Code Copied!"
              color="#10b981" 
              onClose={() => setShowNotification(false)}
            />
          )} */}
        </div>
        <Footer darkMode={darkMode} className="-m-6" />
      </div>
    </>
  );
}

export default Mainpage;
