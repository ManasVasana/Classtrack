export const handleCopy = (code) => {
  navigator.clipboard
    .writeText(code)
    .then(() => {
      alert("Class code copied!");
    })
    .catch(() => {
      alert("Failed to copy class code.");
    });
};
