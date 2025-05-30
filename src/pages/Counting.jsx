import { useEffect, useState } from "react";

const CountUp = ({ target, stepDuration = 100 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0); // Always start from 0

    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      setCount(current);

      if (current >= target) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [target, stepDuration]);

  return (
    <span className="text-2xl sm:text-3xl md:text-4xl font-bold">
      {count}
    </span>
  );
};

export default CountUp;
