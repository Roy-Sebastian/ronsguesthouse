import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

// Helper for dot notation paths
function getNestedValue(obj: any, path: string | null) {
  if (!path || !obj) return null;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Custom hook untuk melakukan sorting client-side dengan menyimpan state di URL.
 * Ini adalah best-practice Next.js App Router agar posisi sorting persisten dan sharable.
 *
 * @param data Array objek data yang akan di-sort
 * @returns { sortedData, handleSort, sortBy, sortOrder }
 */
export function useTableSort<T extends Record<string, any>>(data: T[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('order') as 'asc' | 'desc' | null;

  const handleSort = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams);

      if (sortBy === key) {
        // Toggle: asc -> desc -> null
        if (sortOrder === 'asc') {
          params.set('order', 'desc');
        } else if (sortOrder === 'desc') {
          params.delete('sortBy');
          params.delete('order');
        } else {
          params.set('order', 'asc');
        }
      } else {
        // Kolom baru, default to asc
        params.set('sortBy', String(key));
        params.set('order', 'asc');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams, sortBy, sortOrder]
  );

  const sortedData = useMemo(() => {
    if (!sortBy || !sortOrder) return data;

    return [...data].sort((a, b) => {
      let valA = getNestedValue(a, sortBy as string);
      let valB = getNestedValue(b, sortBy as string);

      // Handle nulls/undefined
      if (valA == null) valA = '' as any;
      if (valB == null) valB = '' as any;

      // Cek apakah ini string numerik (misal tipe Decimal Prisma) atau number
      const numA = Number(valA);
      const numB = Number(valB);
      // Validasi string tidak kosong, dan keduanya adalah number valid saat di-parse
      if (
        valA !== '' && valB !== '' &&
        !Number.isNaN(numA) && !Number.isNaN(numB)
      ) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      // Tipe string (Case Insensitive)
      if (typeof valA === 'string' && typeof valB === 'string') {
        const strA = valA.toLowerCase();
        const strB = valB.toLowerCase();

        // Tipe tanggal terselubung string (ISO Date)
        if (strA.includes('t') && strA.includes('z') && !Number.isNaN(Date.parse(valA))) {
          const tA = new Date(valA).getTime();
          const tB = new Date(valB).getTime();
          return sortOrder === 'asc' ? tA - tB : tB - tA;
        }

        return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      }

      // Tipe boolean / fallback
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortOrder]);

  return {
    sortedData,
    handleSort,
    sortBy,
    sortOrder,
  };
}
