import { computed, inject, Service, signal } from '@angular/core';
import { UserRepository } from '@core/data/repositories';
import { Agent, Customer, User } from '@shared/models';
import { AuthService } from './auth.service';

/** Справочник пользователей: имена в таблицах, списки специалистов и клиентов */
@Service()
export class UserDirectory {
  private readonly repo = inject(UserRepository);
  private readonly auth = inject(AuthService);

  private readonly items = signal<User[]>([]);
  private pending: Promise<void> | null = null;
  /** Для какого пользователя загружен справочник (после регистрации/смены аккаунта — перечитать) */
  private readonly loadedFor = signal<string | null>(null);
  readonly loaded = computed(() => this.loadedFor() !== null && this.loadedFor() === this.auth.user()?.id);
  readonly users = this.items.asReadonly();

  readonly byId = computed(() => new Map(this.items().map((u) => [u.id, u])));
  readonly agents = computed(() =>
    this.items()
      .filter((u): u is Agent => u.role === 'agent' || u.role === 'admin')
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  readonly activeAgents = computed(() => this.agents().filter((a) => a.active));
  readonly customers = computed(() =>
    this.items()
      .filter((u): u is Customer => u.role === 'customer')
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  /** Загружает справочник; повторные вызовы ждут ту же загрузку */
  load(force = false): Promise<void> {
    const userId = this.auth.user()?.id ?? null;
    if (!userId || (this.loaded() && !force)) return Promise.resolve();
    this.pending ??= this.repo
      .list()
      .then((users) => {
        this.items.set(users);
        this.loadedFor.set(userId);
      })
      .finally(() => (this.pending = null));
    return this.pending;
  }

  name(id: string | null | undefined, fallback = 'Unknown user'): string {
    if (!id) return 'Unassigned';
    return this.byId().get(id)?.name ?? fallback;
  }

  /** Обновить запись после создания/редактирования пользователя */
  upsert(user: User): void {
    this.items.update((list) =>
      list.some((u) => u.id === user.id) ? list.map((u) => (u.id === user.id ? user : u)) : [...list, user],
    );
  }
}
