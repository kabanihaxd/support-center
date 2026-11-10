import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { Icon } from '@shared/components/icon/icon';
import { IconName } from '@shared/components/icon/icons';
import { DismissDirective } from '@shared/directives/dismiss.directive';
import { AppNotification, NotificationType } from '@shared/models';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';

const TYPE_ICON: Record<NotificationType, IconName> = {
  assigned: 'user-plus',
  comment: 'message',
  status: 'activity',
};

@Component({
  selector: 'app-notification-menu',
  imports: [Icon, DismissDirective, RelativeTimePipe],
  templateUrl: './notification-menu.html',
  styleUrl: './notification-menu.css',
})
export class NotificationMenu {
  protected readonly service = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly open = signal(false);
  protected readonly icons = TYPE_ICON;
  protected readonly visible = computed(() => this.service.notifications().slice(0, 12));
  protected readonly triggerLabel = computed(() => {
    const unread = this.service.unreadCount();
    return unread ? `Notifications, ${unread} unread` : 'Notifications';
  });

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected close(returnFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) this.trigger().nativeElement.focus();
  }

  protected async openNotification(n: AppNotification): Promise<void> {
    this.open.set(false);
    void this.service.markRead(n.id);
    await this.router.navigate(['/tickets', n.ticketId]);
  }

  protected markAll(): void {
    void this.service.markAllRead();
  }
}
