import { ref, type Ref } from 'vue';

export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
}

export interface UseForm<T> {
  values: Ref<T>;
  errors: Ref<Partial<Record<keyof T, string>>>;
  isSubmitting: Ref<boolean>;
  isDirty: Ref<boolean>;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string) => void;
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseForm<T> {
  const values = ref<T>({ ...options.initialValues }) as Ref<T>;
  const errors = ref<Partial<Record<keyof T, string>>>({}) as Ref<Partial<Record<keyof T, string>>>;
  const isSubmitting = ref(false);
  const isDirty = ref(false);

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]): void => {
    values.value[field] = value;
    isDirty.value = true;
    if (errors.value[field]) {
      delete errors.value[field];
    }
  };

  const setFieldError = <K extends keyof T>(field: K, error: string): void => {
    errors.value[field] = error;
  };

  const reset = (): void => {
    values.value = { ...options.initialValues };
    errors.value = {};
    isDirty.value = false;
  };

  const handleSubmit = async (): Promise<void> => {
    isSubmitting.value = true;
    errors.value = {};

    try {
      await options.onSubmit(values.value);
      isDirty.value = false;
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  };
}
