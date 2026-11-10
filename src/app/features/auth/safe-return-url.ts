/** Разрешаем возврат только на внутренние пути (защита от open redirect) */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/dashboard';
  }
  return value;
}
