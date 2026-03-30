import Swal from 'sweetalert2';

export async function confirmAction(
  text: string,
  title = 'Konfirmasi',
): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
  });
  return result.isConfirmed;
}

export function showError(message: string, title = 'Gagal') {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
  });
}
