import { computed, DestroyRef, DOCUMENT, effect, inject, Service, signal } from '@angular/core';
import { LocalStore } from '@core/data/local/local-store';
import { STORAGE_KEYS } from '@core/data/local/storage-keys';
import { ThemePreference } from '@shared/models';

/** Светлая/тёмная тема. Настройка хранится локально в браузере (это UI-предпочтение) */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(LocalStore);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;

  private readonly systemDark = signal(this.media?.matches ?? false);
  readonly preference = signal<ThemePreference>(this.store.read<ThemePreference>(STORAGE_KEYS.theme, 'light'));
  readonly resolved = computed<'light' | 'dark'>(() => {
    const pref = this.preference();
    if (pref === 'system') return this.systemDark() ? 'dark' : 'light';
    return pref;
  });

  constructor() {
    const listener = (e: MediaQueryListEvent) => this.systemDark.set(e.matches);
    this.media?.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', listener));

    effect(() => {
      this.document.documentElement.dataset['theme'] = this.resolved();
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.store.write(STORAGE_KEYS.theme, preference);
  }

  toggle(): void {
    this.setPreference(this.resolved() === 'dark' ? 'light' : 'dark');
  }
}
