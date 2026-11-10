import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Avatar } from '@shared/components/avatar/avatar';
import { Icon } from '@shared/components/icon/icon';
import { DismissDirective } from '@shared/directives/dismiss.directive';
import { ROLE_LABELS } from '@shared/models';

@Component({
  selector: 'app-user-menu',
  imports: [Avatar, Icon, RouterLink, DismissDirective],
  template: `
    @if (auth.user(); as user) {
      <div class="wrap" appDismiss [appDismissActive]="open()" (appDismiss)="close($event === 'escape')">
        <button
          #trigger
          type="button"
          class="trigger"
          aria-haspopup="true"
          aria-controls="user-menu-panel"
          [attr.aria-expanded]="open()"
          (click)="open.set(!open())"
        >
          <app-avatar [name]="user.name" [size]="32" />
          <span class="who">
            <span class="name">{{ user.name }}</span>
            <span class="role">{{ roleLabel() }}</span>
          </span>
          <app-icon name="chevron-down" [size]="16" class="chevron" />
          <span class="sr-only">Account menu</span>
        </button>

        @if (open()) {
          <div id="user-menu-panel" class="panel card">
            <div class="profile">
              <span class="name">{{ user.name }}</span>
              <span class="email">{{ user.email }}</span>
            </div>
            <hr class="divider" />
            <ul role="list">
              <li>
                <a class="item" routerLink="/settings" (click)="open.set(false)">
                  <app-icon name="user" [size]="16" /> Profile & settings
                </a>
              </li>
              <li>
                <button type="button" class="item" (click)="logout()">
                  <app-icon name="log-out" [size]="16" /> Sign out
                </button>
              </li>
            </ul>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .wrap { position: relative; }
    .trigger {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 4px 8px 4px 4px;
      border: 0;
      border-radius: var(--radius-full);
      background: transparent;
      cursor: pointer;
      text-align: left;
    }
    .trigger:hover { background: var(--surface-2); }
    .trigger:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .who { display: grid; line-height: 1.2; }
    .name { font-weight: 600; font-size: var(--fs-md); }
    .role { font-size: var(--fs-xs); color: var(--text-muted); }
    .chevron { color: var(--text-muted); }
    .panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 50;
      width: 240px;
      padding: var(--space-2) 0;
      box-shadow: var(--shadow-lg);
    }
    .profile { display: grid; padding: var(--space-2) var(--space-4) var(--space-3); }
    .email { font-size: var(--fs-sm); color: var(--text-muted); overflow-wrap: anywhere; }
    ul { margin: 0; padding: var(--space-1) 0 0; list-style: none; }
    .item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      padding: var(--space-2) var(--space-4);
      border: 0;
      background: transparent;
      color: var(--text);
      font-size: var(--fs-md);
      text-decoration: none;
      cursor: pointer;
    }
    .item:hover { background: var(--surface-hover); text-decoration: none; }
    .item:focus-visible { outline: none; box-shadow: inset var(--focus-ring); }
    @media (max-width: 720px) {
      .who, .chevron { display: none; }
      .trigger { padding: 2px; }
    }
  `,
})
export class UserMenu {
  protected readonly auth = inject(AuthService);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly open = signal(false);
  protected readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABELS[role] : '';
  });

  protected close(returnFocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) this.trigger()?.nativeElement.focus();
  }

  protected logout(): void {
    this.open.set(false);
    void this.auth.logout();
  }
}
