// Date utility functions

// Format date dari nanosecond timestamp ke DD/MM/YY, HH:MM
export function formatDate(timestamp) {
  if (!timestamp) return "";

  // Convert nanosecond to millisecond
  const milliseconds = Number(timestamp) / 1000000;
  const date = new Date(milliseconds);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}
