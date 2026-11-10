import { Component, computed, input } from '@angular/core';
import { bucketLabel, DateRange, Granularity, volumeSeries } from '@core/domain/report-stats';
import { ChartView } from '@shared/components/chart/chart';
import { Ticket } from '@shared/models';

/** Динамика: создано и решено по дням/неделям/месяцам (линейный график) */
@Component({
  selector: 'app-volume-trend',
  imports: [ChartView],
  template: `
    <section class="card" aria-labelledby="volume-title">
      <div class="card-header">
        <div>
          <h2 id="volume-title">{{ heading() }}</h2>
          <p class="muted sub">{{ totals().created }} created · {{ totals().resolved }} resolved</p>
        </div>
      </div>
      <div class="card-body">
        @if (loading()) {
          <span class="skeleton" [style.height.px]="height()"></span>
          <span class="sr-only">Loading chart…</span>
        } @else {
          <app-chart
            kind="line"
            [label]="heading() + ': tickets created and resolved'"
            categoryLabel="Period"
            [labels]="labels()"
            [series]="series()"
            [height]="height()"
          />
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .card { height: 100%; }
    h2 { font-size: var(--fs-md); }
    .sub { font-size: var(--fs-sm); }
    .card-body { display: grid; }
  `,
})
export class VolumeTrend {
  readonly tickets = input.required<readonly Ticket[]>();
  readonly range = input.required<DateRange>();
  readonly granularity = input<Granularity>('day');
  readonly heading = input('Ticket volume');
  readonly loading = input(false);
  readonly height = input(260);

  private readonly points = computed(() => volumeSeries(this.tickets(), this.range(), this.granularity()));
  protected readonly labels = computed(() => this.points().map((p) => bucketLabel(p.start, this.granularity())));
  protected readonly series = computed(() => [
    { label: 'Created', color: 'chart-1' as const, data: this.points().map((p) => p.created) },
    { label: 'Resolved', color: 'chart-4' as const, data: this.points().map((p) => p.resolved) },
  ]);
  protected readonly totals = computed(() => ({
    created: this.points().reduce((s, p) => s + p.created, 0),
    resolved: this.points().reduce((s, p) => s + p.resolved, 0),
  }));
}
