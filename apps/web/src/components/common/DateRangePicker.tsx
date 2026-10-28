import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const formatIso = (year: number, monthIndex: number, day: number): string => {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (isoStr: string): string => {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length !== 3) return isoStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  placeholder = "Pilih rentang tanggal...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view from startDate or today
  const initialDate = useMemo(() => {
    if (startDate) {
      const [y, m] = startDate.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m - 1 };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [startDate]);

  const [viewYear, setViewYear] = useState<number>(initialDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.month);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState<string | null>(startDate || null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Sync tempStart with startDate prop when opening or changed outside
  useEffect(() => {
    setTempStart(startDate || null);
  }, [startDate, isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowMonthDropdown(false);
        setHoverDate(null);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Today in ISO
  const todayIso = useMemo(() => {
    const t = new Date();
    return formatIso(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  // Compute 42 calendar grid cells (6 rows x 7 days, Monday to Sunday)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    // getDay() gives 0 for Sunday -> Monday should be index 0
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      day: number;
      monthOffset: -1 | 0 | 1;
      iso: string;
      isCurrentMonth: boolean;
    }> = [];

    // Prev month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, d);
      cells.push({
        day: d,
        monthOffset: -1,
        iso: formatIso(prevDate.getFullYear(), prevDate.getMonth(), d),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        day: d,
        monthOffset: 0,
        iso: formatIso(viewYear, viewMonth, d),
        isCurrentMonth: true,
      });
    }

    // Next month leading days (fill to 42 cells)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      cells.push({
        day: d,
        monthOffset: 1,
        iso: formatIso(nextDate.getFullYear(), nextDate.getMonth(), d),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
    setShowMonthDropdown(false);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
    setShowMonthDropdown(false);
  };

  const handleCellClick = (cellIso: string) => {
    if (!tempStart || (tempStart && endDate)) {
      // Step 1: select start date
      setTempStart(cellIso);
      onChange(cellIso, "");
    } else {
      // Step 2: select end date
      if (cellIso < tempStart) {
        // Clicked date is earlier than start: restart with this date
        setTempStart(cellIso);
        onChange(cellIso, "");
      } else {
        // Complete the range
        onChange(tempStart, cellIso);
        setTempStart(null);
        setHoverDate(null);
        setIsOpen(false);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setTempStart(null);
    setHoverDate(null);
  };

  // Determine current active range for styling
  const activeStart = tempStart || startDate;
  const activeEnd = tempStart && !endDate && hoverDate && hoverDate >= tempStart ? hoverDate : endDate;

  // Display text in input
  const displayText = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    }
    if (startDate) {
      return `${formatDisplayDate(startDate)} - ...`;
    }
    return "";
  }, [startDate, endDate]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button / Input Bar */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setShowMonthDropdown(false);
        }}
        className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition select-none shadow-2xs min-w-[210px]"
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <span className={displayText ? "text-slate-800 dark:text-slate-100" : "text-slate-400"}>
            {displayText || placeholder}
          </span>
        </div>

        {startDate ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Hapus rentang tanggal"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 w-[310px] select-none animate-in fade-in zoom-in-95 duration-100">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Month & Year Title */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 transition"
              >
                <span>{MONTH_NAMES[viewMonth]}</span>
                <ChevronDown size={14} className="text-slate-400" />
                <span>{viewYear}</span>
              </button>

              {/* Month Quick Picker Dropdown */}
              {showMonthDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 grid grid-cols-3 gap-1 z-60 w-56">
                  {MONTH_NAMES.map((name, idx) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx);
                        setShowMonthDropdown(false);
                      }}
                      className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition ${
                        viewMonth === idx
                          ? "bg-emerald-600 text-white"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days of week header (Sen - Min) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d) => (
              <span
                key={d}
                className="text-[11px] font-bold text-slate-600 dark:text-slate-400 py-1"
              >
                {d}
              </span>
            ))}
          </div>

          {/* 42 Date Cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarCells.map((cell) => {
              const isStart = activeStart === cell.iso;
              const isEnd = activeEnd === cell.iso;
              const isSingleSelected = isStart && isEnd;
              const isInRange =
                activeStart &&
                activeEnd &&
                cell.iso > activeStart &&
                cell.iso < activeEnd;
              const isToday = cell.iso === todayIso;

              // Cell container background for continuous range strip
              let containerBg = "";
              if (isInRange) {
                containerBg = "bg-blue-100 dark:bg-blue-950/60";
              } else if (isStart && activeEnd && !isSingleSelected) {
                containerBg = "bg-gradient-to-r from-transparent 50% to-blue-100 dark:to-blue-950/60 50%";
              } else if (isEnd && activeStart && !isSingleSelected) {
                containerBg = "bg-gradient-to-l from-transparent 50% to-blue-100 dark:to-blue-950/60 50%";
              }

              // Pill / Circle Button Styles
              let buttonStyle = "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
              if (!cell.isCurrentMonth) {
                buttonStyle = "text-slate-300 dark:text-slate-600 font-normal";
              }

              if (isStart || isEnd) {
                buttonStyle = "bg-blue-600 text-white font-bold shadow-xs";
              } else if (isInRange) {
                buttonStyle = "text-blue-700 dark:text-blue-300 font-semibold";
              }

              const pillShape = isSingleSelected
                ? "rounded-full"
                : isStart
                ? "rounded-l-full rounded-r-none"
                : isEnd
                ? "rounded-r-full rounded-l-none"
                : "rounded-none";

              return (
                <div
                  key={cell.iso}
                  className={`relative flex items-center justify-center p-0.5 ${containerBg}`}
                >
                  <button
                    type="button"
                    onClick={() => handleCellClick(cell.iso)}
                    onMouseEnter={() => {
                      if (tempStart && !endDate) {
                        setHoverDate(cell.iso);
                      }
                    }}
                    className={`w-8 h-8 flex items-center justify-center text-xs transition relative z-10 ${
                      isStart || isEnd ? pillShape : "rounded-full"
                    } ${buttonStyle} ${
                      isToday && !isStart && !isEnd
                        ? "border-2 border-blue-600 text-blue-700 dark:text-blue-400 font-bold"
                        : ""
                    }`}
                  >
                    {cell.day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
