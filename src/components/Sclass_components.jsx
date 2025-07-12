import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import {
  CustomCard,
  CustomCardHeader,
  CustomCardTitle,
  CustomCardContent,
  renderActiveShape,
} from "./CustomComponents";
import { PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useCallback } from "react";

export const AvgAttendance = ({ pieData,attendanceData }) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);
  
  return (
    <>
      {attendanceData.length > 0 ? (
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
                    <span className="lg:hidden">: {entry.value.toFixed(1)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </CustomCardContent>
        </CustomCard>
      ) : (
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
            <div className="h-48 sm:h-56 md:h-64 w-full flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                No attendance data available
              </span>
            </div>
            </CustomCardContent>
          </CustomCard>
      )
      }
    </>
  );
};

export const AttendanceHistoryCard = ({ class_id, attendanceData }) => (
  <div className="w-full max-w-4xl mx-auto sm:px-4 md:px-0">
    <div className="bg-white/60 dark:bg-gray-800/50 rounded-xl shadow-lg shadow-cyan-500/10 backdrop-blur-sm border border-gray-300 dark:border-gray-700/50">
      <div className="p-4 sm:p-6 border-b border-gray-300 dark:border-gray-700/50">
        <h2 className="text-lg sm:text-xl text-cyan-600 dark:text-cyan-400 font-semibold">
          Attendance History
        </h2>
      </div>

      <div className="p-3 sm:p-6">
        <div className="overflow-auto">
          <table className="w-full table-auto text-sm sm:text-base">
            <thead className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
              <tr className="border-b border-gray-300 dark:border-gray-800">
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-gray-600 dark:text-gray-400">
                  Date
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-gray-600 dark:text-gray-400">
                  Class
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-gray-600 dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length > 0 ? (
                attendanceData.map((row) => (
                  <tr
                    key={row.session_id}
                    className="border-b border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-900 dark:text-white">
                      {row.session_date}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-900 dark:text-white">
                      {row.class_name || "—"}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className="flex items-center gap-1 sm:gap-2">
                        {row.status === "Present" ? (
                          <>
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            <span className="text-green-500">
                              Present
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                            <span className="text-red-500">
                              Absent
                            </span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center text-gray-500 dark:text-gray-400 py-3 sm:py-4"
                  >
                    No attendance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
