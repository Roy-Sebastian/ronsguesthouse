import swal from '@/lib/swal';

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export async function validateForm(form: HTMLFormElement | null): Promise<boolean> {
  if (!form) return true;

  // Clear previous invalid state
  form.querySelectorAll<FormField>('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

  const required = Array.from(
    form.querySelectorAll<FormField>('input[required], select[required], textarea[required]')
  );

  const invalid = required.filter((el) => !el.value.trim());

  if (invalid.length === 0) return true;

  invalid.forEach((el) => el.classList.add('is-invalid'));

  await swal.fire({
    icon: 'error',
    title: 'Input Diperlukan',
    text: 'Mohon isi semua bidang yang wajib diisi.',
  });

  invalid[0].focus();
  return false;
}
