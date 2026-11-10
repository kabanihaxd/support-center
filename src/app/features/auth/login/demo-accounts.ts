import { Component, input, output } from '@angular/core';
import { DEMO_PASSWORD, DemoAccount } from '@core/data/demo-accounts';
import { Icon } from '@shared/components/icon/icon';
import { IconName } from '@shared/components/icon/icons';
import { ROLE_LABELS } from '@shared/models';

const ROLE_ICON: Record<DemoAccount['role'], IconName> = {
  admin: 'shield',
  agent: 'headset',
  customer: 'user',
};

/** Карточки быстрого входа под демо-ролями */
@Component({
  selector: 'app-demo-accounts',
  imports: [Icon],
  template: `
    <section class="demo" aria-labelledby="demo-title">
      <h2 id="demo-title" class="title">Try a demo account</h2>
      <ul role="list">
        @for (account of accounts(); track account.email) {
          <li>
            <button
              type="button"
              class="account"
              [disabled]="busyEmail() !== null"
              [attr.aria-busy]="busyEmail() === account.email"
              (click)="pick.emit(account)"
            >
              <span class="icon">
                <app-icon [name]="busyEmail() === account.email ? 'loader' : icons[account.role]" [size]="18" [class.spin]="busyEmail() === account.email" />
              </span>
              <span class="text">
                <span class="role">Sign in as {{ roleLabels[account.role] }}</span>
                <span class="desc">{{ account.description }}</span>
              </span>
              <app-icon name="chevron-right" [size]="16" class="chev" />
            </button>
          </li>
        }
      </ul>
      <p class="hint">
        Demo password for all accounts: <code>{{ password }}</code>
      </p>
    </section>
  `,
  styles: `
    .demo { display: grid; gap: var(--space-3); }
    .title { font-size: var(--fs-sm); color: var(--text-muted); font-weight: 600; }
    ul { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
    .account {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .account:hover:not(:disabled) { border-color: var(--primary); background: var(--primary-soft); }
    .account:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .account:disabled { cursor: wait; opacity: 0.7; }
    .icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--primary-soft);
      color: var(--primary-text);
    }
    .text { display: grid; flex: 1; }
    .role { font-weight: 600; }
    .desc { font-size: var(--fs-sm); color: var(--text-muted); }
    .chev { color: var(--text-subtle); }
    .hint { font-size: var(--fs-sm); color: var(--text-muted); }
    code {
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      background: var(--surface-2);
      color: var(--text);
      font-family: var(--font-mono);
    }
  `,
})
export class DemoAccounts {
  readonly accounts = input.required<readonly DemoAccount[]>();
  readonly busyEmail = input<string | null>(null);
  readonly pick = output<DemoAccount>();

  protected readonly icons = ROLE_ICON;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly password = DEMO_PASSWORD;
}
