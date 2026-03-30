import { Eye, Edit, Trash2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { defaultRoleMatrix } from '@/lib/rbac';
import { useMemo } from 'react';

interface TableActionsProps {
  viewPermission?: string;
  editPermission?: string;
  deletePermission?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TableActions({
  viewPermission,
  editPermission,
  deletePermission,
  onView,
  onEdit,
  onDelete,
}: TableActionsProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const permissions = useMemo(() => {
    if (!user) return new Set<string>();
    const role = (user as any).role || 'guest';
    const custom = Array.isArray((user as any).permissions)
      ? ((user as any).permissions as string[])
      : [];

    let base: string[] = [];
    if (defaultRoleMatrix[role]) {
      base = Object.keys(defaultRoleMatrix[role]).filter(
        (key) => defaultRoleMatrix[role][key],
      );
    }
    return new Set([...base, ...custom]);
  }, [user]);

  const hasPerm = (required?: string) => {
    if (!required) return false;
    if (permissions.has('*')) return true;
    return permissions.has(required);
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      {viewPermission && hasPerm(viewPermission) && onView && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="p-1.5 min-w-[32px] min-h-[32px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center justify-center"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      )}
      {editPermission && hasPerm(editPermission) && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 min-w-[32px] min-h-[32px] text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100 flex items-center justify-center"
          title="Edit"
        >
          <Edit size={16} />
        </button>
      )}
      {deletePermission && hasPerm(deletePermission) && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 min-w-[32px] min-h-[32px] text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 flex items-center justify-center"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
