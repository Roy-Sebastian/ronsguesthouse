import { useRef } from 'react';
import { validateForm } from '@/lib/validateForm';

export function useFormValidation() {
  const formRef = useRef<HTMLFormElement>(null);

  const validate = () => validateForm(formRef.current);

  return { formRef, validate };
}
