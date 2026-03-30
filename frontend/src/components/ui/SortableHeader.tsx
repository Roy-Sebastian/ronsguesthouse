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
      className={`px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`}
      title={`Urutkan berdasarkan ${label}`}
    >
      <div className="flex items-center gap-2 group">
        <span>{label}</span>
        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
          {isActive && sortOrder === 'asc' ? (
            <ArrowUp size={14} className="text-primary" />
          ) : isActive && sortOrder === 'desc' ? (
            <ArrowDown size={14} className="text-primary" />
          ) : (
            <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
}
