import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Icon } from '@shared/components/icon/icon';
import { ROLE_LABELS } from '@shared/models';
import { NAV_ITEMS } from '../nav-items';
import { BrandLogo } from '../brand-logo';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon, BrandLogo],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    '[class.open]': 'open()',
    '(keydown.escape)': 'closed.emit()',
  },
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  /** Открыт ли drawer на мобильных (на десктопе sidebar виден всегда) */
  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABELS[role] : '';
  });

  protected readonly items = computed(() => {
    const isCustomer = this.auth.role() === 'customer';
    return NAV_ITEMS.filter((item) => !item.permission || this.auth.can(item.permission)).map((item) => ({
      ...item,
      label: isCustomer && item.customerLabel ? item.customerLabel : item.label,
    }));
  });
}
