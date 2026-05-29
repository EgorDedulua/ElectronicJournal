export const formatTime = (time: string): string => {
  // Формирует время в формат HH:MM (без секунд)
  if (!time) return '';
  return time.substring(0, 5);
};
