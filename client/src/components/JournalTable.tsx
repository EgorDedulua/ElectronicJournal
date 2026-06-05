import { useMemo, MouseEvent } from 'react';
import { JournalCell } from '../types';
import { lessonTypeLabels } from '../types/lesson';
import { groupDatesByYearMonth } from '../utils/monthNames';

interface JournalTableRow {
  name: string;
  cells: JournalCell[];
  subjectId?: number;
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
  onHeaderWorkButtonClick?: (date: string, workId?: number | null, lessonId?: number) => void;
  /** view-only: кнопка только если есть workId (для студента) */
  workHeaderMode?: 'create-or-view' | 'view-only';
  onCellWorkClick?: (row: RowType, cell: JournalCell) => void;
  showCellWorkButton?: boolean;
  onHeaderDeleteLessonClick?: (lessonId: number, date: string) => void;
}

const JournalTable = <RowType extends JournalTableRow = JournalTableRow>({
  header,
  rows,
  rowLabel = 'Предмет',
  summaryLabel,
  onCellClick,
  onCellAuxClick,
  onCellContextMenu,
  onHeaderWorkButtonClick,
  workHeaderMode = 'create-or-view',
  onCellWorkClick,
  showCellWorkButton = false,
  onHeaderDeleteLessonClick,
}: JournalTableProps<RowType>) => {
  const dateGroups = useMemo(() => groupDatesByYearMonth(header), [header]);

  const flatDates = useMemo(() => {
    return dateGroups.flatMap((yearGroup) =>
      yearGroup.months.flatMap((monthGroup) => monthGroup.days.map((day) => day.date))
    );
  }, [dateGroups]);

  /** Метаданные по индексу колонки (одна колонка = один урок, даже при одинаковой дате) */
  const columnMeta = useMemo(() => {
    return flatDates.map((date, index) => {
      const cellsAtColumn = rows
        .map((row) => row.cells[index])
        .filter((cell): cell is JournalCell => Boolean(cell?.lessonId != null));
      const cellWithWork = cellsAtColumn.find((cell) => cell.workId != null);
      const fallbackCell = cellsAtColumn[0];
      const cell = cellWithWork ?? fallbackCell;
      return {
        date,
        lessonId: cell?.lessonId,
        workId: cell?.workId,
      };
    });
  }, [rows, flatDates]);

  let headerColumnIndex = 0;

  return (
    <div className="journal-table-wrapper">
      <table className="journal-table">
        <thead>
          <tr>
            <th rowSpan={3}>{rowLabel}</th>
            {dateGroups.map((yearGroup) => (
              <th
                key={`year-${yearGroup.year}`}
                colSpan={yearGroup.months.reduce((sum, m) => sum + m.days.length, 0)}
                className="year-header"
              >
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
                <th
                  key={`month-${yearGroup.year}-${monthGroup.month}`}
                  colSpan={monthGroup.days.length}
                  className="month-header"
                >
                  {monthGroup.monthName}
                </th>
              ))
            )}
          </tr>
          <tr>
            {dateGroups.map((yearGroup) =>
              yearGroup.months.map((monthGroup) =>
                monthGroup.days.map((day) => {
                  const colIndex = headerColumnIndex++;
                  const meta = columnMeta[colIndex];
                  const workId = meta?.workId;
                  const lessonId = meta?.lessonId;
                  const columnHasWork = rows.some(
                    (row) => row.cells[colIndex]?.workId != null
                  );

                  const canDeleteLesson =
                    Boolean(onHeaderDeleteLessonClick && lessonId != null);

                  return (
                    <th
                      key={`col-${colIndex}-${lessonId ?? day.date}`}
                      className={`day-header ${columnHasWork ? 'day-header-has-work' : ''} ${onHeaderWorkButtonClick ? 'day-header-with-work' : ''} ${canDeleteLesson ? 'day-header-deletable' : ''}`}
                    >
                      <div className="day-header-inner">
                        {canDeleteLesson && (
                          <button
                            type="button"
                            className="day-header-delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onHeaderDeleteLessonClick!(lessonId!, day.date);
                            }}
                            title="Удалить урок"
                            aria-label="Удалить урок"
                          >
                            🗑
                          </button>
                        )}
                        <span className="day-header-number">{day.day}</span>
                        {onHeaderWorkButtonClick && (workHeaderMode !== 'view-only' || columnHasWork) && (
                          <button
                            type="button"
                            className={`day-header-work-button ${columnHasWork ? 'day-header-work-view' : 'day-header-work-create'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onHeaderWorkButtonClick(day.date, workId, lessonId);
                            }}
                            title={columnHasWork ? 'Перейти к работе' : 'Добавить работу'}
                            aria-label={columnHasWork ? 'Перейти к работе' : 'Добавить работу'}
                          >
                            <span className="day-header-work-button-icon" aria-hidden="true">
                              {columnHasWork ? '→' : '+'}
                            </span>
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })
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
                const hasOwnLesson = cell?.lessonId != null;
                const hasCredit = Boolean(
                  hasOwnLesson &&
                    cell?.credit &&
                    ['lab', 'practice'].includes(cell.lessonType ?? '')
                );
                const isLabOrPracticeWithoutCredit =
                  hasOwnLesson &&
                  (cell?.lessonType === 'lab' || cell?.lessonType === 'practice') &&
                  !cell?.credit;
                const hasWork = Boolean(
                  showCellWorkButton && hasOwnLesson && cell?.workId != null
                );
                const lessonTypeLabel = cell?.lessonType
                  ? lessonTypeLabels[cell.lessonType] ?? cell.lessonType
                  : undefined;
                const lessonTopic = cell?.lessonTopic?.trim();
                const cellTitle = [
                  lessonTypeLabel ? `Тип урока: ${lessonTypeLabel}` : null,
                  lessonTopic ? `Тема: ${lessonTopic}` : null,
                ]
                  .filter(Boolean)
                  .join('\n');

                return (
                  <td
                    key={`${row.name}-col-${cellIndex}-${cell?.lessonId ?? date}`}
                    className={`journal-cell ${row.isExpelled ? 'cell-expelled' : ''} ${hasCredit ? 'journal-credit-cell' : ''} ${isLabOrPracticeWithoutCredit ? 'journal-lab-practice-no-credit' : ''} ${onCellClick && !isDisabled ? 'journal-cell-clickable' : ''}`}
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
                    title={cellTitle || undefined}
                    role={onCellClick && !isDisabled ? 'button' : undefined}
                    tabIndex={onCellClick && !isDisabled ? 0 : undefined}
                  >
                    {cell && (
                      <div className="journal-cell-inner">
                        <div className="journal-cell-marks">
                          {cell.mark && <div className="journal-mark">{cell.mark}</div>}
                          {cell.absence && <div className="journal-absence">Н</div>}
                          {cell.lateMinutes != null && (
                            <div className="journal-late">{cell.lateMinutes}м</div>
                          )}
                        </div>
                        {hasWork && cell && (
                          <button
                            type="button"
                            className="journal-cell-work-button"
                            title="Перейти к работе"
                            aria-label="Перейти к работе"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCellWorkClick?.(row, cell);
                            }}
                          >
                            <span className="day-header-work-button-icon" aria-hidden="true">
                              →
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
              {summaryLabel && <td className="summary-cell">{row.summary ?? '-'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JournalTable;
