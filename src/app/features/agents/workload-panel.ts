import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { loadLevel, WORKLOAD_THRESHOLDS } from '@core/domain/user-stats';
import { Avatar } from '@shared/components/avatar/avatar';
import { AgentWorkload } from '@shared/models';

/** Нагрузка специалистов: горизонтальные полосы по числу активных тикетов */
@Component({
  selector: 'app-workload-panel',
  imports: [RouterLink, Avatar],
  template: `
    <section class="card" aria-labelledby="workload-title">
      <div class="card-header">
        <div>
          <h2 id="workload-title">Team workload</h2>
          <p class="muted sub">Active tickets per specialist (open, in progress, pending)</p>
        </div>
        <ul class="legend" role="list" aria-label="Load levels">
          <li><span class="swatch low"></span>Light (&lt; {{ thresholds.normal }})</li>
          <li><span class="swatch normal"></span>Balanced</li>
          <li><span class="swatch high"></span>Heavy ({{ thresholds.high }}+)</li>
        </ul>
      </div>
      <ul class="rows card-body" role="list">
        @for (row of rows(); track row.agent.id) {
          <li class="row">
            <a class="who" [routerLink]="['/agents', row.agent.id]">
              <app-avatar [name]="row.agent.name" [size]="28" />
              <span class="name">{{ row.agent.name }}</span>
            </a>
            <span class="track" aria-hidden="true">
              <span class="bar" [class]="'bar ' + row.level" [style.width.%]="row.percent"></span>
            </span>
            <span class="numbers">
              <strong>{{ row.activeCount }}</strong> active
              @if (row.overdueCount) {
                <span class="overdue">· {{ row.overdueCount }} overdue</span>
              }
              <span class="sr-only">, load {{ row.level === 'high' ? 'heavy' : row.level === 'normal' ? 'balanced' : 'light' }}</span>
            </span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    h2 { font-size: var(--fs-md); }
    .sub { font-size: var(--fs-sm); }
    .legend { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: 0; padding: 0; list-style: none; font-size: var(--fs-xs); color: var(--text-muted); }
    .legend li { display: inline-flex; align-items: center; gap: 6px; }
    .swatch { width: 10px; height: 10px; border-radius: 3px; }
    .rows { display: grid; gap: var(--space-3); margin: 0; list-style: none; }
    .row {
      display: grid;
      grid-template-columns: minmax(150px, 220px) 1fr 150px;
      align-items: center;
      gap: var(--space-4);
    }
    .who { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--text); min-width: 0; }
    .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
    .track { height: 10px; border-radius: var(--radius-full); background: var(--surface-2); overflow: hidden; }
    .bar { display: block; height: 100%; border-radius: inherit; min-width: 4px; transition: width 0.3s ease; }
    .low, .swatch.low { background: var(--chart-4); }
    .normal, .swatch.normal { background: var(--chart-1); }
    .high, .swatch.high { background: var(--danger); }
    .numbers { font-size: var(--fs-sm); color: var(--text-muted); white-space: nowrap; }
    .numbers strong { color: var(--text); }
    .overdue { color: var(--danger-text); font-weight: 600; }
    @media (max-width: 640px) {
      .row { grid-template-columns: 1fr auto; }
      .track { grid-column: 1 / -1; grid-row: 2; }
    }
  `,
})
export class WorkloadPanel {
  readonly workloads = input.required<readonly AgentWorkload[]>();
  protected readonly thresholds = WORKLOAD_THRESHOLDS;

  protected readonly rows = computed(() => {
    const active = this.workloads().filter((w) => w.agent.active);
    // Шкала: максимум из нагрузки и порога «тяжёлой» нагрузки, чтобы полосы не были всегда на 100%
    const max = Math.max(WORKLOAD_THRESHOLDS.high + 2, ...active.map((w) => w.activeCount));
    return [...active]
      .sort((a, b) => b.activeCount - a.activeCount || a.agent.name.localeCompare(b.agent.name))
      .map((w) => ({ ...w, level: loadLevel(w.activeCount), percent: (w.activeCount / max) * 100 }));
  });
}
