import { Component, input } from '@angular/core';
import { ROLE_LABELS, UserRole } from '@shared/models';

/** Active / Inactive */
@Component({
  selector: 'app-account-status',
  template: `
    <span class="badge badge-dot" [class.on]="active()" [class.off]="!active()">
      {{ active() ? 'Active' : 'Inactive' }}
    </span>
  `,
  styles: `
    .on { background: var(--status-resolved-bg); color: var(--status-resolved-fg); }
    .off { background: var(--status-closed-bg); color: var(--status-closed-fg); }
  `,
})
export class AccountStatusBadge {
  readonly active = input.required<boolean>();
}

@Component({
  selector: 'app-role-badge',
  template: `<span class="badge" [class.admin]="role() === 'admin'">{{ labels[role()] }}</span>`,
  styles: `
    .badge { background: var(--status-open-bg); color: var(--status-open-fg); }
    .admin { background: var(--status-in_progress-bg); color: var(--status-in_progress-fg); }
  `,
})
export class RoleBadge {
  readonly role = input.required<UserRole>();
  protected readonly labels = ROLE_LABELS;
}
