import dayjs from "dayjs";
import { Check, X, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import api from "../utils/api";

const AttendanceTable = ({ studentData1, onRefetch, class_id }) => {
  console.log("AttendanceTable component rendered");
  console.log("Student Data 1:", studentData1);
  const [editTarget, setEditTarget] = useState(null); 

  const [isEditing, setIsEditing] = useState(false);
  const [edditAttend, setEditAttend] = useState(false);

  const handleClick = (student_id, date, currentStatus, studentName) => {
    setEditTarget({ student_id, date, currentStatus, studentName });
  };

  const handleeditAttend = async (student_id, date, currentStatus) => {
    const reversedDate = date.split("-").reverse().join("-");

    try {
      const { data } = await api.get("/getsessionId", {
        params: {
          class_id,
          date: reversedDate,
        },
      });

      const session_id = data.sessionId;

      const newStatus = currentStatus;

      const res = await api.post("/UpdateAttendance", {
        student_id,
        session_id,
        date: reversedDate,
        attendanceStatus: newStatus,
      });

      console.log("Attendance updated successfully", res.data);

      if (onRefetch) onRefetch();
    } catch (err) {
      console.error("Error updating attendance:", err);
    }
  };

  const uniqueDates = useMemo(() => {
    const dates = Array.from(
      new Set(studentData1.map((row) => row.session_date))
    );

    dates.sort(
      (a, b) =>
        dayjs(a, "DD-MM-YYYY").toDate() - dayjs(b, "DD-MM-YYYY").toDate()
    );

    return dates; 
  }, [studentData1]);

  const studentData = useMemo(() => {
    const students = {};

    studentData1.forEach((row) => {
      const sessionDate = row.session_date; // "05-07-2025"
      if (!students[row.student_id]) {
        students[row.student_id] = {
          name: row.student_name,
          attendance: {},
        };
      }
      students[row.student_id].attendance[sessionDate] =
        row.attendance_status === "Present";
    });

    return Object.entries(students).map(([student_id, student]) => ({
      student_id: Number(student_id),
      name: student.name,
      attendance: uniqueDates.map((date) => ({
        date,
        present: student.attendance[date] ?? false,
      })),
    }));
  }, [studentData1, uniqueDates]);

  console.log("Student Data:", studentData);
  console.log("Unique Dates:", studentData1);

  return (
    <div
      className={`col-span-full rounded-lg shadow-md overflow-hidden border w-full
        ${
          isEditing
            ? "border-blue-400 dark:border-blue-500"
            : "border-gray-200 dark:border-gray-700"
        } 
        bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden transition-all duration-300 hover:shadow-xl`}
    >
      <div className="p-3 sm:p-4 md:p-6 flex flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 border-b dark:border-gray-700">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Student Attendance
        </h2>
        <button
          onClick={() => setIsEditing((prev) => !prev)}
          className={`p-2 rounded-full border border-gray-300 dark:border-gray-600 transition-all
            hover:bg-blue-100 dark:hover:bg-blue-900 hover:shadow-md group flex-shrink-0`}
          title={isEditing ? "Exit Edit Mode" : "Edit Attendance"}
        >
          <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600" />
        </button>
      </div>

      {isEditing && (
        <div className="bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-center text-xs sm:text-sm py-2 font-medium border-b border-blue-200 dark:border-blue-800">
          Edit Mode is <span className="font-bold">ON</span>. Click on
          attendance to modify.
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-100 dark:bg-gray-700 text-left px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase min-w-[150px] shadow-sm">
                  Student Name
                </th>
                {uniqueDates.map((date) => (
                  <th
                    key={date}
                    className="text-center py-2 sm:py-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase min-w-[80px] sm:min-w-[100px] whitespace-nowrap"
                  >
                    <span className="inline">{date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {studentData.map((student) => (
                <tr
                  key={student.name}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-3 sm:px-4 md:px-6 py-2 sm:py-4 font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base shadow-sm border-r border-gray-200 dark:border-gray-700">
                    <div
                      className="truncate max-w-[120px] sm:max-w-none"
                      title={student.name}
                    >
                      {student.name}
                    </div>
                  </td>
                  {student.attendance.map(({ date, present }, idx) => (
                    <td
                      key={idx}
                      className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-center"
                    >
                      {isEditing ? (
                        <button
                          onClick={() => {
                            handleClick(
                              student.student_id,
                              date,
                              present,
                              student.name
                            );
                            setEditAttend((prev) => !prev);
                          }}
                          className={`text-sm rounded-full p-1 sm:p-2 transition-all hover:scale-110 ${
                            present
                              ? "text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                              : "text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                          }`}
                        >
                          {present ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      ) : present ? (
                        <Check className="text-emerald-600 dark:text-emerald-500 w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                      ) : (
                        <X className="text-red-500 dark:text-red-500 w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 animate-scaleIn mx-4">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white leading-tight">
                Confirm Attendance Edit
              </h2>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">
              Are you sure you want to mark{" "}
              <span className="font-semibold break-words">
                {editTarget.studentName}
              </span>{" "}
              as{" "}
              <span className="font-semibold">
                {editTarget.currentStatus ? "Absent" : "Present"}
              </span>{" "}
              on <span className="font-semibold">{editTarget.date}</span>?
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleeditAttend(
                    editTarget.student_id,
                    editTarget.date,
                    editTarget.currentStatus
                  );
                  setEditTarget(null);
                }}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white transition order-1 sm:order-2"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
