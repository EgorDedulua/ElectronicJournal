export const monthNames: Record<number, string> = {
  1: 'Январь',
  2: 'Февраль',
  3: 'Март',
  4: 'Апрель',
  5: 'Май',
  6: 'Июнь',
  7: 'Июль',
  8: 'Август',
  9: 'Сентябрь',
  10: 'Октябрь',
  11: 'Ноябрь',
  12: 'Декабрь'
};

export interface DateGroup {
  year: number;
  months: Array<{
    month: number;
    monthName: string;
    days: Array<{
      date: string;
      day: number;
    }>;
  }>;
}

export const groupDatesByYearMonth = (dates: string[]): DateGroup[] => {
  const grouped: Record<number, Record<number, Array<{ date: string; day: number }>>> = {};

  dates.forEach((date) => {
    const [year, month, day] = date.split('-').map(Number);
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push({ date, day });
  });

  return Object.entries(grouped)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([yearStr, months]) => ({
      year: Number(yearStr),
      months: Object.entries(months)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([monthStr, daysArray]) => {
          const month = Number(monthStr);
          return {
            month,
            monthName: monthNames[month],
            days: daysArray.map((item) => item)
          };
        })
    }));
};
