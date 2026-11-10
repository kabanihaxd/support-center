import { Component, computed, inject, signal } from '@angular/core';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { PreferencesService } from '@core/services/preferences.service';
import { ToastService } from '@core/services/toast.service';
import { NotificationType } from '@shared/models';

interface NotificationOption {
  type: NotificationType;
  title: string;
  description: string;
  staffOnly?: boolean;
}

const OPTIONS: NotificationOption[] = [
  {
    type: 'assigned',
    title: 'Assigned to me',
    description: 'When a ticket is assigned to you.',
    staffOnly: true,
  },
  {
    type: 'comment',
    title: 'New comments',
    description: 'When someone replies on a ticket you follow.',
  },
  {
    type: 'status',
    title: 'Status changes',
    description: 'When a ticket you follow is updated, resolved or reopened.',
  },
];

/** Какие события попадают в колокольчик */
@Component({
  selector: 'app-notification-settings',
  template: `
    <section class="card" id="notifications" aria-labelledby="notifications-title">
      <div class="card-header">
        <div>
          <h2 id="notifications-title">Notifications</h2>
          <p class="muted sub">Choose which events appear in the bell menu. Changes are saved automatically.</p>
        </div>
      </div>
      <div class="card-body">
        @for (o of options(); track o.type) {
          <div class="option">
            <span class="option-text">
              <span class="option-title" [id]="'notify-' + o.type">{{ o.title }}</span>
              <span class="option-desc" [id]="'notify-' + o.type + '-desc'">{{ o.description }}</span>
            </span>
            @if (prefs.preferences(); as p) {
              <input
                type="checkbox"
                role="switch"
                class="toggle"
                [attr.aria-labelledby]="'notify-' + o.type"
                [attr.aria-describedby]="'notify-' + o.type + '-desc'"
                [checked]="p.notifications[o.type]"
                [disabled]="saving() === o.type"
                (change)="toggle(o, !p.notifications[o.type])"
              />
            } @else {
              <span class="skeleton" style="width: 40px; height: 22px; border-radius: 999px"></span>
            }
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './settings-section.css',
})
export class NotificationSettings {
  private readonly auth = inject(AuthService);
  protected readonly prefs = inject(PreferencesService);
  private readonly toast = inject(ToastService);

  protected readonly saving = signal<NotificationType | null>(null);
  protected readonly options = computed(() => OPTIONS.filter((o) => !o.staffOnly || this.auth.isStaff()));

  protected async toggle(option: NotificationOption, enabled: boolean): Promise<void> {
    this.saving.set(option.type);
    try {
      await this.prefs.update({ notifications: { [option.type]: enabled } as Record<NotificationType, boolean> });
      this.toast.success(`${option.title} notifications ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      this.toast.error(errorMessage(error));
    } finally {
      this.saving.set(null);
    }
  }
}
