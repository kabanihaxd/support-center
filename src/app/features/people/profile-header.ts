import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Avatar } from '@shared/components/avatar/avatar';
import { AccountStatusBadge, RoleBadge } from '@shared/components/badges/user-badges';
import { Icon } from '@shared/components/icon/icon';
import { User } from '@shared/models';

/** Шапка профиля пользователя; кнопки действий передаются через <ng-content> */
@Component({
  selector: 'app-profile-header',
  imports: [DatePipe, Avatar, Icon, AccountStatusBadge, RoleBadge],
  template: `
    @let u = user();
    <div class="identity">
      <app-avatar [name]="u.name" [size]="64" />
      <div class="text">
        <div class="name-row">
          <h1>{{ u.name }}</h1>
          @if (u.role !== 'customer') {
            <app-role-badge [role]="u.role" />
          }
          <app-account-status [active]="u.active" />
        </div>
        <ul class="facts" role="list">
          <li><app-icon name="mail" [size]="14" /> <a [href]="'mailto:' + u.email">{{ u.email }}</a></li>
          @if (u.jobTitle) {
            <li><app-icon name="headset" [size]="14" /> {{ u.jobTitle }}</li>
          }
          @if (u.company) {
            <li><app-icon name="building" [size]="14" /> {{ u.company }}</li>
          }
          @if (u.phone) {
            <li><app-icon name="phone" [size]="14" /> {{ u.phone }}</li>
          }
          <li><app-icon name="calendar" [size]="14" /> Joined {{ u.createdAt | date: 'MMM d, y' }}</li>
        </ul>
      </div>
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-6);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .identity { display: flex; gap: var(--space-4); min-width: 0; }
    .text { display: grid; gap: var(--space-2); min-width: 0; }
    .name-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2) var(--space-5);
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--text-muted);
      font-size: var(--fs-md);
    }
    .facts li { display: inline-flex; align-items: center; gap: 6px; overflow-wrap: anywhere; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    @media (max-width: 560px) {
      :host { padding: var(--space-4); }
      .identity { flex-direction: column; }
    }
  `,
})
export class ProfileHeader {
  readonly user = input.required<User>();
}
