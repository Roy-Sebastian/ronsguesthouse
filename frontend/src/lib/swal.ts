import Swal from 'sweetalert2';

const swal = Swal.mixin({
  confirmButtonColor: '#991B1B',
  cancelButtonColor: '#6B7280',
  buttonsStyling: true,
  customClass: {
    popup: 'font-sans text-sm',
    title: 'text-gray-900 font-serif text-lg',
    confirmButton: 'text-sm font-bold uppercase tracking-widest',
    cancelButton: 'text-sm font-bold uppercase tracking-widest',
  },
});

export default swal;
