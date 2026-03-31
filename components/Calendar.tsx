import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayString, formatYMD } from '../utils/helpers';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  getBadgeCount?: (date: string) => number;
  isClosed?: (date: string) => boolean;
  isHighlighted?: (date: string) => boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  getBadgeCount,
  isClosed,
  isHighlighted,
  minDate,
  maxDate,
  className = ""
}) => {
  const [viewDate, setViewDate] = useState(() => {
    const initial = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
    return isNaN(initial.getTime()) ? new Date() : initial;
  });
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
  const [slideDirection, setSlideDirection] = useState(0);

  // Update viewDate when selectedDate changes to a valid date
  React.useEffect(() => {
    if (selectedDate) {
      const newDate = new Date(selectedDate + 'T12:00:00');
      if (!isNaN(newDate.getTime())) {
        setViewDate(newDate);
      }
    }
  }, [selectedDate]);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(' de ', ' ');
  };

  const days = useMemo(() => {
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday start
    
    const result = [];
    const prevMonthLastDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
    
    // Previous month
    for (let i = offset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, d);
      result.push({ date, type: 'prev' as const });
    }
    
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      result.push({ date, type: 'current' as const });
    }
    
    // Next month
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, d);
      result.push({ date, type: 'next' as const });
    }
    
    return result;
  }, [viewDate]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let y = 2020; y <= currentYear + 5; y++) {
      result.push(y);
    }
    return result;
  }, []);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ${className}`}>
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={() => {
            const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
            if (newDate.getFullYear() >= 2020) {
              setSlideDirection(-1);
              setViewDate(newDate);
            }
          }}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
        >
          <ChevronLeft size={20} />
        </button>

        <button 
          onClick={() => setViewMode(viewMode === 'days' ? 'years' : 'days')}
          className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors"
        >
          {formatMonthYear(viewDate)}
        </button>

        <button 
          onClick={() => {
            setSlideDirection(1);
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
          }}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'days' ? (
          <motion.div
            key={`days-${viewDate.getTime()}`}
            initial={{ opacity: 0, x: slideDirection * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slideDirection * 20 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4"
          >
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
                <div key={i} className="h-8 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map(({ date, type }, i) => {
                const dateStr = formatYMD(date);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === getTodayString();
                const count = getBadgeCount?.(dateStr) || 0;
                const closed = isClosed?.(dateStr);
                const highlighted = isHighlighted?.(dateStr);
                const isOutOfRange = (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate);

                return (
                  <button
                    key={`${type}-${dateStr}-${i}`}
                    disabled={isOutOfRange}
                    onClick={() => {
                      if (type === 'current') {
                        onSelectDate(dateStr);
                      } else {
                        setViewDate(date);
                        onSelectDate(dateStr);
                      }
                    }}
                    className={`h-10 w-full rounded-xl flex items-center justify-center text-xs font-bold transition-all relative
                      ${isSelected ? 'bg-indigo-500 text-white shadow-md scale-105 z-10' : 
                        isToday ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 
                        highlighted ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                        type !== 'current' || isOutOfRange ? 'text-slate-300 dark:text-slate-700' : 
                        closed ? 'text-red-400 dark:text-red-900/50' :
                        'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {date.getDate()}
                    {count > 0 && type === 'current' && (
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border-2
                        ${isSelected ? 'bg-white text-indigo-600 border-indigo-500' : 'bg-indigo-500 text-white border-white dark:border-slate-900'}`}>
                        {count > 9 ? '9+' : count}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="years"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-4 pb-4 grid grid-cols-3 gap-2"
          >
            {years.map(year => (
              <button
                key={year}
                onClick={() => {
                  setViewDate(new Date(year, viewDate.getMonth(), 1));
                  setViewMode('days');
                }}
                className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all
                  ${viewDate.getFullYear() === year ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
              >
                {year}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
