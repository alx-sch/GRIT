export const timestampToLocalTime = (timestamp: Date): string => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return time;
};
