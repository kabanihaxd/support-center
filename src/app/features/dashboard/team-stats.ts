import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '@shared/components/avatar/avatar';
import { AgentWorkload } from '@shared/models';
import { formatDuration } from '@shared/utils/dates';

/** Статистика специалистов на Dashboard: активная нагрузка, решённые, среднее время */
@Component({
  selector: 'app-team-stats',
  imports: [RouterLink, Avatar],
  template: `
    <section class="card" aria-labelledby="team-title">
      <div class="card-header">
        <h2 id="team-title">Agent stats</h2>
        @if (linkProfiles()) {
          <a routerLink="/agents" class="view-all">Manage team</a>
        }
      </div>
      @if (loading()) {
        <div class="body" aria-busy="true">
          <span class="sr-only">Loading agent stats…</span>
          @for (row of [1, 2, 3, 4]; track row) {
            <span class="skeleton" style="height: 40px"></span>
          }
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <caption class="sr-only">Active, resolved and average resolution time per agent</caption>
            <thead>
              <tr>
                <th scope="col">Agent</th>
                <th scope="col" class="num">Active</th>
                <th scope="col" class="num">Resolved</th>
                <th scope="col" class="num">Avg. time</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.agent.id) {
                <tr [class.me]="row.agent.id === currentUserId()">
                  <td>
                    <span class="who">
                      <app-avatar [name]="row.agent.name" [size]="28" />
                      @if (linkProfiles()) {
                        <a [routerLink]="['/agents', row.agent.id]">{{ row.agent.name }}</a>
                      } @else {
                        <span>{{ row.agent.name }}</span>
                      }
                      @if (row.agent.id === currentUserId()) {
                        <span class="chip">You</span>
                      }
                    </span>
                  </td>
                  <td class="num">
                    {{ row.activeCount }}
                    @if (row.overdueCount) {
                      <span class="overdue">({{ row.overdueCount }} overdue)</span>
                    }
                  </td>
                  <td class="num">{{ row.resolvedCount }}</td>
                  <td class="num">{{ duration(row.avgResolutionHours) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .card { height: 100%; }
    h2 { font-size: var(--fs-md); }
    .view-all { font-size: var(--fs-sm); font-weight: 500; }
    .body { display: grid; gap: var(--space-2); padding: var(--space-4) var(--space-5); }
    .who { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: 500; white-space: nowrap; }
    .who a { color: var(--text); }
    .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .overdue { color: var(--danger-text); font-size: var(--fs-xs); font-weight: 600; }
    tr.me td { background: var(--primary-soft); }
  `,
})
export class TeamStats {
  readonly workloads = input.required<readonly AgentWorkload[]>();
  readonly loading = input(false);
  /** Ссылки на профили — только тем, у кого есть доступ к разделу Agents */
  readonly linkProfiles = input(false);
  readonly currentUserId = input<string | null>(null);
  readonly limit = input(6);

  protected readonly rows = computed(() =>
    this.workloads()
      .filter((w) => w.agent.active)
      .sort((a, b) => b.activeCount - a.activeCount || b.resolvedCount - a.resolvedCount)
      .slice(0, this.limit()),
  );

  protected duration(hours: number | null): string {
    return formatDuration(hours);
  }
}
