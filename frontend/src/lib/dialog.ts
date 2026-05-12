import swal from '@/lib/swal';

export async function confirmAction(
  text: string,
  title = 'Konfirmasi',
): Promise<boolean> {
  const result = await swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Lanjutkan',
    cancelButtonText: 'Batal',
  });
  return result.isConfirmed;
}

export function showError(message: string, title = 'Gagal') {
  return swal.fire({
    title,
    text: message,
    icon: 'error',
  });
}
