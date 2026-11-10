import { computed, effect, inject, Service, signal, untracked } from '@angular/core';
import { NotificationRepository, PreferencesRepository } from '@core/data/repositories';
import { AppNotification, NotificationType } from '@shared/models';
import { AuthService } from './auth.service';
import { Clock } from './clock';

/** Колокольчик в шапке: уведомления текущего пользователя */
@Service()
export class NotificationService {
  private readonly repo = inject(NotificationRepository);
  private readonly preferences = inject(PreferencesRepository);
  private readonly auth = inject(AuthService);
  private readonly clock = inject(Clock);

  private readonly items = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  readonly notifications = computed(() =>
    [...this.items()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  readonly unreadCount = computed(() => this.items().filter((n) => !n.read).length);

  constructor() {
    // Перезагружаем список при смене пользователя
    effect(() => {
      const userId = this.auth.user()?.id;
      untracked(() => (userId ? void this.load(userId) : this.items.set([])));
    });
  }

  async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.repo.listByUser(userId);
      if (this.auth.user()?.id === userId) this.items.set(list);
    } finally {
      this.loading.set(false);
    }
  }

  async markRead(id: string): Promise<void> {
    const target = this.items().find((n) => n.id === id);
    if (!target || target.read) return;
    this.items.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await this.repo.update(id, { read: true });
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId || this.unreadCount() === 0) return;
    this.items.update((list) => list.map((n) => ({ ...n, read: true })));
    await this.repo.markAllRead(userId);
  }

  /** Отправить уведомление другому пользователю (вызывается из бизнес-логики тикетов) */
  async notify(userId: string, type: NotificationType, ticketId: string, message: string): Promise<void> {
    if (userId === this.auth.user()?.id) return;
    // Получатель мог отключить этот тип уведомлений в настройках
    const prefs = await this.preferences.get(userId);
    if (!prefs.notifications[type]) return;
    await this.repo.create({ userId, type, ticketId, message, createdAt: this.clock.nowIso(), read: false });
  }

  /** Убрать уведомления удалённого тикета из списка текущего пользователя */
  forgetTicket(ticketId: string): void {
    this.items.update((list) => list.filter((n) => n.ticketId !== ticketId));
  }
}
