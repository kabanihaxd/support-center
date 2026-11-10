import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand-logo',
  imports: [RouterLink],
  template: `
    <a routerLink="/dashboard" class="logo" aria-label="SupportCenter home">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#2563eb" />
        <path d="M9 17a7 7 0 0 1 14 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
        <rect x="7" y="16" width="4" height="7" rx="2" fill="#fff" />
        <rect x="21" y="16" width="4" height="7" rx="2" fill="#fff" />
      </svg>
      <span>Support<strong>Center</strong></span>
    </a>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--text);
      font-size: 1.05rem;
      font-weight: 500;
      letter-spacing: -0.01em;
      text-decoration: none;
    }
    .logo strong {
      font-weight: 700;
      color: var(--primary-text);
    }
    .logo:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
      border-radius: var(--radius-sm);
    }
  `,
})
export class BrandLogo {}
