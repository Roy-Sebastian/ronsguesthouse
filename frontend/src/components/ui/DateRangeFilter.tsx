import React from 'react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  className?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '',
}: DateRangeFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest hidden sm:block">
        Filter Tanggal:
      </span>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="form-input text-xs py-1.5 px-3 h-auto min-w-[130px] !bg-transparent border-gray-200"
        title="Start Date"
      />
      <span className="text-gray-400 text-sm">-</span>
      <input
        type="date"
        value={endDate}
        min={startDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="form-input text-xs py-1.5 px-3 h-auto min-w-[130px] !bg-transparent border-gray-200"
        title="End Date"
      />
      {(startDate || endDate) && (
        <button
          onClick={() => {
            onStartDateChange('');
            onEndDateChange('');
          }}
          className="text-xs text-red-500 hover:text-red-600 font-medium ml-1"
          title="Reset rentang tanggal"
        >
          Reset
        </button>
      )}
    </div>
  );
}
