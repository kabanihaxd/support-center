import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { Icon } from '@shared/components/icon/icon';
import { NotificationMenu } from '../notification-menu/notification-menu';
import { UserMenu } from '../user-menu/user-menu';

@Component({
  selector: 'app-header',
  imports: [Icon, NotificationMenu, UserMenu],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  readonly menuExpanded = input(false);
  readonly menuToggle = output<void>();

  protected readonly query = signal('');
  protected readonly searchPlaceholder = computed(() =>
    this.auth.role() === 'customer' ? 'Search my tickets…' : 'Search tickets by ID, title, customer…',
  );
  protected readonly themeLabel = computed(() =>
    this.theme.resolved() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
  );

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /** Глобальный поиск ведёт в список тикетов с параметром ?q= */
  protected search(event: SubmitEvent): void {
    event.preventDefault();
    const q = this.query().trim();
    void this.router.navigate(['/tickets'], { queryParams: q ? { q } : {} });
  }
}
