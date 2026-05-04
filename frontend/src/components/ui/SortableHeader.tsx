import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
  className?: string; // Tweak tailwind classes
}

export function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = sortBy === field;

  return (
    <th
      onClick={() => onSort(field)}
      className={`px-6 py-3.5 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap ${className}`}
      title={`Urutkan berdasarkan ${label}`}
    >
      <div className="flex items-center gap-2 group">
        <span>{label}</span>
        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
          {isActive && sortOrder === 'asc' ? (
            <ArrowUp size={13} className="text-primary" />
          ) : isActive && sortOrder === 'desc' ? (
            <ArrowDown size={13} className="text-primary" />
          ) : (
            <ArrowUpDown size={13} className="opacity-25 group-hover:opacity-80" />
          )}
        </span>
      </div>
    </th>
  );
}
