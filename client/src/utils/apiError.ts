import axios from 'axios';

export function getApiErrorMessage(err: unknown, fallback = 'Произошла ошибка'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return (data.message as string[]).join(', ');
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function logApiError(context: string, err: unknown): void {
  if (axios.isAxiosError(err)) {
    console.error(`[API] ${context}`, {
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      data: err.response?.data,
    });
  } else {
    console.error(`[API] ${context}`, err);
  }
}
