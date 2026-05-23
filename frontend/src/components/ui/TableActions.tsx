import { Eye, Edit, Trash2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useRoleMatrix } from '@/lib/useRoleMatrix';
import { useMemo } from 'react';

interface TableActionsProps {
  viewPermission?: string;
  editPermission?: string;
  deletePermission?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  editClassName?: string;
}

export function TableActions({
  viewPermission,
  editPermission,
  deletePermission,
  onView,
  onEdit,
  onDelete,
  editClassName = 'btn btn-ghost btn-icon text-orange-600 hover:bg-orange-50 hover:text-orange-700',
}: TableActionsProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const roleMatrix = useRoleMatrix();

  const permissions = useMemo(() => {
    if (!user) return new Set<string>();
    const role = (user as any).role || 'guest';
    if (role === 'superadmin') return new Set(['*']);

    const custom = Array.isArray((user as any).permissions)
      ? ((user as any).permissions as string[])
      : [];

    let base: string[] = [];
    if (roleMatrix[role]) {
      base = Object.keys(roleMatrix[role]).filter(
        (key) => roleMatrix[role][key],
      );
    }
    return new Set([...base, ...custom]);
  }, [user, roleMatrix]);

  const hasPerm = (required?: string) => {
    if (!required) return false;
    if (permissions.has('*')) return true;
    return permissions.has(required);
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      {viewPermission && hasPerm(viewPermission) && onView && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="btn btn-ghost btn-icon text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
          className={editClassName}
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
          className="btn btn-danger btn-icon"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

