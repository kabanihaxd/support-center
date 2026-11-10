import { Component, computed, input } from '@angular/core';
import { countBy } from '@core/domain/report-stats';
import { ChartView } from '@shared/components/chart/chart';
import { STATUS_CHART_COLORS } from '@shared/components/chart/chart-colors';
import { STATUS_LABELS, Ticket, TICKET_STATUSES } from '@shared/models';

/** Распределение тикетов по статусам (doughnut) */
@Component({
  selector: 'app-status-breakdown',
  imports: [ChartView],
  template: `
    <section class="card" aria-labelledby="status-title">
      <div class="card-header">
        <h2 id="status-title">{{ heading() }}</h2>
        <span class="muted total">{{ tickets().length }} total</span>
      </div>
      <div class="card-body">
        @if (loading()) {
          <span class="skeleton" style="height: 220px"></span>
          <span class="sr-only">Loading chart…</span>
        } @else if (!tickets().length) {
          <p class="muted empty">No tickets to show yet.</p>
        } @else {
          <app-chart
            kind="doughnut"
            [label]="heading()"
            categoryLabel="Status"
            [labels]="labels"
            [series]="series()"
            [segmentColors]="colors"
            [height]="200"
          />
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .card { height: 100%; }
    h2 { font-size: var(--fs-md); }
    .total { font-size: var(--fs-sm); }
    .card-body { display: grid; }
    .empty { padding: var(--space-6) 0; text-align: center; }
  `,
})
export class StatusBreakdown {
  readonly tickets = input.required<readonly Ticket[]>();
  readonly loading = input(false);
  readonly heading = input('Tickets by status');

  protected readonly labels = TICKET_STATUSES.map((s) => STATUS_LABELS[s]);
  protected readonly colors = TICKET_STATUSES.map((s) => STATUS_CHART_COLORS[s]);
  protected readonly series = computed(() => {
    const counts = countBy(this.tickets(), TICKET_STATUSES, (t) => t.status);
    return [{ label: 'Tickets', color: 'chart-1' as const, data: TICKET_STATUSES.map((s) => counts[s]) }];
  });
}
