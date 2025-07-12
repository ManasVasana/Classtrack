"use client";
import React from "react";
import { Sector } from "recharts";

export const CustomCard = ({ children, className = "" }) => (
  <div
    className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${className}`}
  >
    {children}
  </div>
);

export const CustomCardHeader = ({ children, className = "" }) => (
  <div className={`p-3 sm:p-4 md:p-6 ${className}`}>{children}</div>
);

export const CustomCardTitle = ({ children, className = "" }) => (
  <h2
    className={`text-base sm:text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 ${className}`}
  >
    {children}
  </h2>
);

export const CustomCardContent = ({ children, className = "" }) => (
  <div className={`p-3 sm:p-4 md:p-6 ${className}`}>{children}</div>
);

export const CustomButton = ({
  children,
  className = "",
  onClick,
  disabled,
  ...props
}) => (
  <button
    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base ${className}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

export const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <p className="text-base sm:text-lg font-bold text-blue-500 dark:text-blue-400">
          {payload[0].value}%
        </p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Date: {payload[0].payload.date}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Attendance: {payload[0].payload.attendance} students
        </p>
      </div>
    );
  }
  return null;
};

export const renderActiveShape = (props) => {
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
        fill="currentColor"
        className="fill-gray-700 dark:fill-gray-300"
        fontSize={14}
        fontWeight="bold"
      >
        {`${payload.name} ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};
