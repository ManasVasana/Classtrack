export const LoadingButton = ({ text }) => {
  return (
    <div className="flex justify-center items-center gap-2">
      <svg
        className="animate-spin h-5 w-5 text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <span className="text-gray-900 flex">
        {text}
        <span className="loading-dots ml-1"></span>
      </span>
      <style jsx>{`
        .loading-dots::after {
          content: "";
          display: inline-block;
          width: 1em;
          text-align: left;
          animation: dots 1.4s steps(3, end) infinite;
        }

        @keyframes dots {
          0% {
            content: ".";
          }
          33% {
            content: "..";
          }
          66% {
            content: "...";
          }
          100% {
            content: "";
          }
        }
      `}</style>
    </div>
  );
};
