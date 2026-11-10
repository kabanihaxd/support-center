import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { PageHeader } from '@shared/components/page-header/page-header';

/** Временная страница для разделов, которые появятся на следующих этапах */
@Component({
  selector: 'app-placeholder-page',
  imports: [PageHeader, EmptyState, RouterLink],
  template: `
    <div class="page">
      <app-page-header [title]="title" />
      <div class="card">
        <app-empty-state icon="sliders" title="Coming in the next stage" message="This section is part of the roadmap and will be implemented next.">
          <a class="btn btn-secondary" routerLink="/dashboard">Back to dashboard</a>
        </app-empty-state>
      </div>
    </div>
  `,
})
export class PlaceholderPage {
  protected readonly title = String(inject(ActivatedRoute).snapshot.title ?? 'Section');
}
