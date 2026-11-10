import { DOCUMENT, effect, inject, Service, signal, untracked } from '@angular/core';
import { PreferencesRepository } from '@core/data/repositories';
import { UserPreferences } from '@shared/models';
import { AuthService } from './auth.service';

export type PreferencesPatch = Partial<Omit<UserPreferences, 'id'>>;

/** Настройки текущего пользователя (уведомления, плотность таблиц). Хранятся в репозитории — переедут в Firestore */
@Service()
export class PreferencesService {
  private readonly repo = inject(PreferencesRepository);
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);

  private readonly current = signal<UserPreferences | null>(null);
  readonly preferences = this.current.asReadonly();

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      untracked(() => {
        this.current.set(null);
        if (userId) void this.load(userId);
      });
    });
    // Плотность таблиц — глобальный атрибут, стили в surfaces.css
    effect(() => {
      this.document.documentElement.dataset['density'] = this.current()?.compactTables ? 'compact' : 'comfortable';
    });
  }

  private async load(userId: string): Promise<void> {
    const prefs = await this.repo.get(userId);
    if (this.auth.user()?.id === userId) this.current.set(prefs);
  }

  /** Оптимистичное обновление: при ошибке возвращаем прежнее значение */
  async update(patch: PreferencesPatch): Promise<void> {
    const previous = this.current();
    if (!previous) throw new Error('Preferences are not loaded yet.');
    const next: UserPreferences = {
      ...previous,
      ...patch,
      notifications: { ...previous.notifications, ...patch.notifications },
    };
    this.current.set(next);
    try {
      await this.repo.save(next);
    } catch (error) {
      if (this.current() === next) this.current.set(previous);
      throw error;
    }
  }
}
