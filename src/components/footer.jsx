import React from "react";
import { Mail, BookOpen, ArrowUp } from "lucide-react";
import Logo from "./logo";
import { Link } from "react-router-dom";

function Footer({ darkMode, toggleDarkMode, className = "" }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`relative mt-20 rounded-t-3xl bg-gradient-to-br  from-gray-900 via-slate-900 to-gray-800 text-white overflow-hidden shadow-[0_-10px_30px_rgba(255,255,255,0.1)] dark:shadow-[0_-10px_30px_rgba(255,255,255,0.05)] ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative">
        {/* Main Footer Content */}
        <div className="px-6 py-12">
          <div className=" px-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-8">
              <div className="space-y-4">
                <div className="transform hover:scale-105 transition-transform duration-300">
                  <Logo />
                </div>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Empowering education through innovative technology. Track
                  attendance, manage classes, and enhance learning experiences.
                </p>
              </div>

              {/* Quick Links */}
              <div className="hidden md:block">
                <div className="space-y-4 flex flex-col items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="p-1 bg-blue-500/20 rounded-lg">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    Quick Links
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => scrollToTop()}
                        className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group text-sm"
                      >
                        <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-300" />
                        Your Classes
                      </button>
                    </li>
                    <li>
                      <Link
                        to ="/ChangeDevice"
                        className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group text-sm"
                      >
                        <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-300" />
                        Change Device
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/Calendar"
                        className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group text-sm"
                      >
                        <div className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-300" />
                        Calendar
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 flex flex-col items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="p-1 bg-purple-500/20 rounded-lg">
                    <Mail className="w-4 h-4 text-purple-400" />
                  </div>
                  Stay Connected
                </h3>
                <p className="hidden text-gray-300 text-sm">
                  Have suggestions? We'd love to hear from you
                </p>

                <button
                  href="mailto:manasvasana@gmail.com"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </button>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-400">
                  <p>© {currentYear} ClassTrack. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className="absolute bottom-6 right-6 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 hover:shadow-xl group"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 text-white group-hover:animate-bounce" />
        </button>
      </div>
    </footer>
  );
}

export default Footer;
