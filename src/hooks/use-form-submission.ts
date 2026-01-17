import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface FormSubmissionOptions<TData> {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  data: TData;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface FormSubmissionResult {
  submit: <TData>(options: FormSubmissionOptions<TData>) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useFormSubmission(): FormSubmissionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async <TData>(options: FormSubmissionOptions<TData>) => {
    const {
      url,
      method,
      data,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const action = method === 'POST' ? 'created' : 'updated';
        const defaultSuccess = `Successfully ${action}`;
        toast.success(successMessage || defaultSuccess);

        onSuccess?.();
      } else {
        const error = await response.json();
        const defaultError = errorMessage || `Failed to ${method === 'POST' ? 'create' : 'update'}`;
        toast.error(error.error || defaultError);
        throw new Error(error.error || defaultError);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      console.error('Form submission error:', error);
      setError(error);

      if (onError) {
        onError(error);
      } else {
        toast.error(error.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}
