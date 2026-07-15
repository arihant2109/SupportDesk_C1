export function logError(message: string, error: unknown): void {
  const detail =
    error instanceof Error
      ? { errorName: error.name, errorMessage: error.message }
      : { errorMessage: String(error) };

  console.error(JSON.stringify({ level: 'error', message, ...detail }));
}
