import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PreferencesService } from '@core/services/preferences.service';
import { filter } from 'rxjs';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

/** Каркас авторизованной части: sidebar + header + контент */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header],
  template: `
    <a class="skip-link" href="#main-content" (click)="focusMain($event)">Skip to main content</a>
    <app-sidebar [open]="navOpen()" (closed)="navOpen.set(false)" />
    <div class="column">
      <app-header [menuExpanded]="navOpen()" (menuToggle)="navOpen.set(true)" />
      <main #main id="main-content" tabindex="-1">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
    .column {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      margin-left: var(--sidebar-width);
    }
    main {
      flex: 1;
      min-width: 0;
    }
    main:focus {
      outline: none;
    }
    .skip-link {
      position: fixed;
      top: var(--space-2);
      left: var(--space-2);
      z-index: 100;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--primary);
      color: #fff;
      font-weight: 600;
      transform: translateY(-200%);
    }
    .skip-link:focus {
      transform: none;
    }
    @media (max-width: 1023px) {
      .column {
        margin-left: 0;
      }
    }
  `,
})
export class Shell {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  protected readonly navOpen = signal(false);
  // Создаём сервис настроек сразу: он применяет плотность таблиц ко всему приложению
  private readonly preferences = inject(PreferencesService);

  constructor() {
    // После перехода закрываем мобильное меню
    const sub = inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.navOpen.set(false));
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  protected focusMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
