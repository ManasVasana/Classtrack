import React from "react";
import { Wrench, Home } from "lucide-react";
import { Link } from "react-router-dom";

function Calendar() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 transition-all duration-500 p-4">
      <div className="relative backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg">
            <Wrench className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white">
          Under Construction
        </h1>

        <p className="text-gray-800 dark:text-gray-300 text-lg mb-8 leading-relaxed">
          We're working hard to bring you something amazing. Stay tuned!
        </p>

        <Link
          to="/Mainpage"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50"
        >
          <Home className="w-5 h-5" />
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default Calendar;
