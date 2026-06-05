export const formatTime = (time: string): string => {
  if (!time) return '';
  return time.substring(0, 5);
};
