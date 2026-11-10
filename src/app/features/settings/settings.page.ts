import { Component, DOCUMENT, inject } from '@angular/core';
import { DemoDataControl } from '@core/data/repositories';
import { PageHeader } from '@shared/components/page-header/page-header';
import { AppearanceSettings } from './appearance-settings';
import { DemoDataSettings } from './demo-data-settings';
import { NotificationSettings } from './notification-settings';
import { PasswordSettings } from './password-settings';
import { ProfileSettings } from './profile-settings';

/** Настройки: профиль, пароль, внешний вид, уведомления, демо-данные */
@Component({
  selector: 'app-settings-page',
  imports: [PageHeader, AppearanceSettings, DemoDataSettings, NotificationSettings, PasswordSettings, ProfileSettings],
  template: `
    <div class="page">
      <app-page-header title="Settings" subtitle="Manage your profile, security and preferences." />
      <div class="layout">
        <nav class="toc" aria-label="Settings sections">
          <ul role="list">
            @for (s of sections; track s.id) {
              <li>
                <a [href]="'#' + s.id" (click)="jump($event, s.id)">{{ s.label }}</a>
              </li>
            }
          </ul>
        </nav>
        <div class="sections">
          <app-profile-settings />
          <app-password-settings />
          <app-appearance-settings />
          <app-notification-settings />
          <app-demo-data-settings />
        </div>
      </div>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 200px minmax(0, 1fr);
      gap: var(--space-6);
      align-items: start;
    }
    .toc { position: sticky; top: calc(var(--header-height, 64px) + var(--space-4)); }
    .toc ul { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
    .toc a {
      display: block;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-weight: 500;
      text-decoration: none;
    }
    .toc a:hover { background: var(--surface-hover); color: var(--text); }
    .sections { display: grid; gap: var(--space-4); max-width: 820px; min-width: 0; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: minmax(0, 1fr); }
      .toc { position: static; }
      .toc ul { display: flex; flex-wrap: wrap; gap: var(--space-2); }
      .toc a { border: 1px solid var(--border); border-radius: var(--radius-full); padding: 4px 12px; font-size: var(--fs-sm); }
    }
  `,
})
export class SettingsPage {
  private readonly demo = inject(DemoDataControl);
  private readonly document = inject(DOCUMENT);

  protected readonly sections = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Password' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    ...(this.demo.supported ? [{ id: 'demo-data', label: 'Demo data' }] : []),
  ];

  /** Прокрутка к секции без смены URL роутера; фокус — на секцию для скринридеров */
  protected jump(event: Event, id: string): void {
    event.preventDefault();
    const target = this.document.getElementById(id);
    if (!target) return;
    target.setAttribute('tabindex', '-1');
    const reduce = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? true;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
  }
}
