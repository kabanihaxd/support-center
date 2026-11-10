import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@shared/components/empty-state/empty-state';

@Component({
  selector: 'app-not-found-page',
  imports: [EmptyState, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <app-empty-state
          icon="search"
          title="Page not found"
          message="The page you are looking for doesn't exist or has been moved."
        >
          <a class="btn btn-primary" routerLink="/dashboard">Go to dashboard</a>
        </app-empty-state>
      </div>
    </div>
  `,
})
export class NotFoundPage {}
