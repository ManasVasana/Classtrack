import dayjs from "dayjs";
import { Check, X } from "lucide-react"; // assuming you're using these icons
import { useMemo } from "react";

const AttendanceTable = ({ studentData1 }) => {
    const CustomTable = ({ children, className = "" }) => (
  <div className={`w-full overflow-x-auto ${className}`}>
    <table className="min-w-full divide-y divide-gray-700">{children}</table>
  </div>
);

const CustomTableHeader = ({ children }) => (
  <thead className="bg-gray-700">
    <tr>{children}</tr>
  </thead>
);

const CustomTableBody = ({ children }) => (
  <tbody className="bg-gray-800 divide-y divide-gray-700">{children}</tbody>
);

const CustomTableHead = ({ children, className = "" }) => (
  <th
    scope="col"
    className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

const CustomTableRow = ({ children }) => <tr>{children}</tr>;

const CustomTableCell = ({ children, className = "" }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-gray-300 ${className}`}>
    {children}
  </td>
);

const CustomCard = ({ children, className = "" }) => (
  <div
    className={`bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const CustomCardHeader = ({ children, className = "" }) => (
  <div className={`p-3 sm:p-4 md:p-6 ${className}`}>{children}</div>
);

const CustomCardTitle = ({ children, className = "" }) => (
  <h2
    className={`text-lg sm:text-xl md:text-2xl font-semibold text-gray-100 ${className}`}
  >
    {children}
  </h2>
);

const CustomCardContent = ({ children, className = "" }) => (
  <div className={`p-3 sm:p-4 md:p-6 ${className}`}>{children}</div>
);
  // Extract and sort unique session dates
  const uniqueDates = useMemo(() => {
    const dates = Array.from(
      new Set(studentData1.map((row) => dayjs(row.session_date).format("MM/DD")))
    );
    return dates.sort();
  }, [studentData1]);

  // Transform flat studentData1 data to student-wise attendance
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
      attendance: uniqueDates.map(
        (date) => student.attendance[date] ?? false // false if Absent
      ),
    }));
  }, [studentData1, uniqueDates]);

  return (
    <CustomCard className="col-span-full">
      <CustomCardHeader>
        <CustomCardTitle>Student Attendance</CustomCardTitle>
      </CustomCardHeader>
      <CustomCardContent>
        <CustomTable>
          <CustomTableHeader>
            <CustomTableHead className="w-[120px] sm:w-[160px] md:w-[200px]">
              STUDENT NAME
            </CustomTableHead>
            {uniqueDates.map((date) => (
              <CustomTableHead key={date}>{date}</CustomTableHead>
            ))}
          </CustomTableHeader>
          <CustomTableBody>
            {studentData.map((student) => (
              <CustomTableRow key={student.name}>
                <CustomTableCell className="font-medium text-xs sm:text-sm md:text-base">
                  {student.name}
                </CustomTableCell>
                {student.attendance.map((present, index) => (
                  <CustomTableCell key={index}>
                    {present ? (
                      <Check className="text-emerald-500 w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <X className="text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </CustomTableCell>
                ))}
              </CustomTableRow>
            ))}
          </CustomTableBody>
        </CustomTable>
      </CustomCardContent>
    </CustomCard>
  );
};

export default AttendanceTable;
