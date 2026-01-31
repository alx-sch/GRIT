export const timestampToLocalTime = (timestamp: Date): string => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return time;
};
