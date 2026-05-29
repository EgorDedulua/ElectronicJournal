import { useMemo, MouseEvent } from 'react';
import { JournalCell } from '../types';
import { groupDatesByYearMonth } from '../utils/monthNames';

const lessonTypeLabels: Record<string, string> = {
  lab: 'Лабораторная',
  practice: 'Практика',
  usual: 'Урок',
  test: 'Тест',
  control: 'Контроль'
};

interface JournalTableRow {
  name: string;
  cells: JournalCell[];
  number?: number;
  isExpelled?: boolean;
  summary?: string;
}

interface JournalTableProps<RowType extends JournalTableRow = JournalTableRow> {
  header: string[];
  rows: RowType[];
  rowLabel?: string;
  summaryLabel?: string;
  onCellClick?: (row: RowType, date: string, cell?: JournalCell) => void;
  onCellAuxClick?: (row: RowType, date: string, cell: JournalCell | undefined, button: number) => void;
  onCellContextMenu?: (row: RowType, date: string, cell: JournalCell | undefined, event: MouseEvent<HTMLTableCellElement>) => void;
}

const JournalTable = <RowType extends JournalTableRow = JournalTableRow>({ header, rows, rowLabel = 'Предмет', summaryLabel, onCellClick, onCellAuxClick, onCellContextMenu }: JournalTableProps<RowType>) => {
  const dateGroups = useMemo(() => groupDatesByYearMonth(header), [header]);
  
  // Создаем плоский список дат для маппинга cells
  const flatDates = useMemo(() => {
    return dateGroups.flatMap(yearGroup =>
      yearGroup.months.flatMap(monthGroup =>
        monthGroup.days.map(day => day.date)
      )
    );
  }, [dateGroups]);

  return (
    <div className="journal-table-wrapper">
      <table className="journal-table">
        <thead>
          <tr>
            <th rowSpan={3}>{rowLabel}</th>
            {dateGroups.map((yearGroup) => (
              <th key={`year-${yearGroup.year}`} colSpan={yearGroup.months.reduce((sum, m) => sum + m.days.length, 0)} className="year-header">
                {yearGroup.year}
              </th>
            ))}
            {summaryLabel && (
              <th rowSpan={3} className="summary-header">
                {summaryLabel}
              </th>
            )}
          </tr>
          <tr>
            {dateGroups.map((yearGroup) =>
              yearGroup.months.map((monthGroup) => (
                <th key={`month-${yearGroup.year}-${monthGroup.month}`} colSpan={monthGroup.days.length} className="month-header">
                  {monthGroup.monthName}
                </th>
              ))
            )}
          </tr>
          <tr>
            {dateGroups.map((yearGroup) =>
              yearGroup.months.map((monthGroup) =>
                monthGroup.days.map((day, index) => (
                  <th key={`day-${day.date}-${index}`} className="day-header">
                    {day.day}
                  </th>
                ))
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className={row.isExpelled ? 'row-expelled' : ''}>
              <td className={`row-name ${row.isExpelled ? 'expelled' : ''}`}>
                {row.number && <span className="student-number">{row.number}</span>}
                {row.name}
              </td>
              {flatDates.map((date, cellIndex) => {
                const cell = row.cells[cellIndex];
                const isDisabled = row.isExpelled;
                const hasCredit = Boolean(cell?.credit && ['lab', 'practice'].includes(cell.lessonType ?? ''));
                const lessonTypeLabel = cell?.lessonType ? lessonTypeLabels[cell.lessonType] ?? cell.lessonType : undefined;

                return (
                  <td 
                    key={`${row.name}-${date}-${cellIndex}`} 
                    className={`journal-cell ${row.isExpelled ? 'cell-expelled' : ''} ${hasCredit ? 'journal-credit-cell' : ''} ${onCellClick && !isDisabled ? 'journal-cell-clickable' : ''}`}
                    onClick={() => !isDisabled && onCellClick?.(row, date, cell)}
                    onMouseDown={(event) => {
                      if (!isDisabled && event.button === 1) {
                        event.preventDefault();
                        onCellAuxClick?.(row, date, cell, event.button);
                      }
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      if (!isDisabled) {
                        onCellContextMenu?.(row, date, cell, event);
                      }
                    }}
                    title={lessonTypeLabel ? `Тип урока: ${lessonTypeLabel}` : undefined}
                    role={onCellClick && !isDisabled ? 'button' : undefined}
                    tabIndex={onCellClick && !isDisabled ? 0 : undefined}
                  >
                    {cell && (
                      <>
                        {cell.mark && <div className="journal-mark">{cell.mark}</div>}
                        {cell.absence && <div className="journal-absence">Н</div>}
                        {cell.lateMinutes != null && <div className="journal-late">{cell.lateMinutes}м</div>}
                      </>
                    )}
                  </td>
                );
              })}
              {summaryLabel && (
                <td className="summary-cell">{row.summary ?? '-'}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JournalTable;
