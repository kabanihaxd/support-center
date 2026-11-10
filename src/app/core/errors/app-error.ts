export type AppErrorCode =
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'storage'
  | 'unknown';

/** Ошибка приложения с понятным пользователю сообщением */
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Достаёт из любой ошибки текст, который можно показать пользователю */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AppError) return error.message;
  return fallback;
}
