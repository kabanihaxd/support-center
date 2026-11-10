import { Component, computed, input } from '@angular/core';
import { STATUS_LABELS, TicketStatus } from '@shared/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge badge-dot" [style.background]="bg()" [style.color]="fg()">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<TicketStatus>();
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
  protected readonly bg = computed(() => `var(--status-${this.status()}-bg)`);
  protected readonly fg = computed(() => `var(--status-${this.status()}-fg)`);
}
