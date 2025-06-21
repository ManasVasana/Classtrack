import dayjs from "dayjs";
import { Check, X, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import api from "../utils/api";

const AttendanceTable = ({ studentData1, onRefetch }) => {
  const [editTarget, setEditTarget] = useState(null); // { studentName, date, currentStatus }

  const [isEditing, setIsEditing] = useState(false);
  const [edditAttend, setEditAttend] = useState(false);

  const handleClick = (studentName, date, currentStatus) => {
    setEditTarget({ studentName, date, currentStatus });
  };

  const handleeditAttend = async (studentName, date, currentStatus) => {
    try {
      const { data } = await api.post("/UpdateAttendance", {
        studentName,
        date,
        attendanceStatus: currentStatus ? "Absent" : "Present", // Toggle status
      });

      console.log("Attendance updated successfully", data);
      if (onRefetch) onRefetch(); // ✅ Trigger a refetch
    } catch (err) {
      console.error("Error updating attendance:", err);
    }
  };

  const uniqueDates = useMemo(() => {
    const dates = Array.from(
      new Set(
        studentData1.map((row) => dayjs(row.session_date).format("MM/DD"))
      )
    );
    return dates.sort();
  }, [studentData1]);

  const studentData = useMemo(() => {
    const students = {};

    studentData1.forEach((row) => {
      const formattedDate = dayjs(row.session_date).format("MM/DD");
      if (!students[row.student_id]) {
        students[row.student_id] = {
          name: row.student_name,
          attendance: {},
        };
      }
      students[row.student_id].attendance[formattedDate] =
        row.attendance_status === "Present";
    });

    return Object.values(students).map((student) => ({
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
      className={`col-span-full rounded-lg shadow-md overflow-hidden border 
        ${
          isEditing
            ? "border-blue-400 dark:border-blue-500"
            : "border-gray-200 dark:border-gray-700"
        } 
        bg-white dark:bg-gray-800`}
    >
      <div className="p-3 sm:p-4 md:p-6 flex justify-between items-center border-b dark:border-gray-700">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Student Attendance
        </h2>
        <button
          onClick={() => setIsEditing((prev) => !prev)}
          className={`p-2 rounded-full border border-gray-300 dark:border-gray-600 transition-all
            hover:bg-blue-100 dark:hover:bg-blue-900 hover:shadow-md group`}
          title={isEditing ? "Exit Edit Mode" : "Edit Attendance"}
        >
          <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600" />
        </button>
      </div>

      {/* Edit Mode Banner */}
      {isEditing && (
        <div className="bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-center text-sm py-2 font-medium border-b border-blue-200 dark:border-blue-800">
          Edit Mode is <span className="font-bold">ON</span>. Click on
          attendance to modify.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-700 text-left px-6 py-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                Student Name
              </th>
              {uniqueDates.map((date) => (
                <th
                  key={date}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase"
                >
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {studentData.map((student) => (
              <tr key={student.name}>
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {student.name}
                </td>
                {student.attendance.map(({ date, present }, idx) => (
                  <td key={idx} className="px-6 py-4 text-center">
                    {isEditing ? (
                      <button
                        onClick={() => {
                          handleClick(student.name, date, present);
                          setEditAttend((prev) => !prev);
                        }}
                        className={`text-sm rounded-full p-1 transition-all ${
                          present
                            ? "text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                            : "text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                        }`}
                      >
                        {present ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    ) : present ? (
                      <Check className="text-emerald-600 dark:text-emerald-500 w-5 h-5" />
                    ) : (
                      <X className="text-red-500 dark:text-red-500 w-5 h-5" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-[90%] max-w-md p-4 animate-scaleIn">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Confirm Attendance Edit
              </h2>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to mark{" "}
              <span className="font-semibold">{editTarget.studentName}</span> as{" "}
              <span className="font-semibold">
                {editTarget.currentStatus ? "Absent" : "Present"}
              </span>{" "}
              on <span className="font-semibold">{editTarget.date}</span>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleeditAttend(
                    editTarget.studentName,
                    editTarget.date,
                    !editTarget.currentStatus
                  );
                  setEditTarget(null);
                }}
                className="px-4 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white transition"
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
