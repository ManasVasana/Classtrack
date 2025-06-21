import { useEffect, useState } from "react";

const TypingText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, 150); // typing speed

    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="text-gray-700 dark:text-white text-3xl font-bold p-8 flex justify-center">
      {displayedText}
    </div>
  );
};

export default TypingText;
