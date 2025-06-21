import React, { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";

function Notification({ icon, message, color, onClose }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setProgress(0);

    const startTime = Date.now();
    const progressDuration = 1500; // Progress fills in 2 seconds
    const totalDuration = 1600; // Total visible time (2s progress + 0.5s buffer)

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / progressDuration) * 100, 100);
      setProgress(newProgress);
    }, 16);

    const timeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation to complete
    }, totalDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-60 px-4 py-3 rounded-lg shadow-xl text-white text-sm flex flex-col gap-2 transition-all duration-300 ease-out ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-[120%] opacity-0"
      }`}
      style={{ 
        backgroundColor: color,
        boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {icon || <BadgeCheck className="w-5 h-5 text-white" />}
        </div>
        <span className="leading-snug flex-1">{message}</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-1 overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default Notification;