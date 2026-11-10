import { Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Пагинация: «1–10 of 84», размер страницы, номера страниц с пропусками */
@Component({
  selector: 'app-pagination',
  imports: [Icon],
  template: `
    <p class="summary" aria-live="polite">
      @if (total()) {
        Showing <strong>{{ from() }}–{{ to() }}</strong> of <strong>{{ total() }}</strong>
      } @else {
        No results
      }
    </p>

    <div class="controls">
      <label class="size">
        <span>Rows per page</span>
        <select class="select select-sm" [value]="pageSize()" (change)="onSize($event)">
          @for (size of pageSizes(); track size) {
            <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
          }
        </select>
      </label>

      <nav aria-label="Pagination">
        <ul role="list">
          <li>
            <button type="button" class="icon-btn" aria-label="Previous page" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">
              <app-icon name="chevron-left" [size]="16" />
            </button>
          </li>
          @for (item of pages(); track $index) {
            <li>
              @if (item === null) {
                <span class="gap" aria-hidden="true">…</span>
              } @else {
                <button
                  type="button"
                  class="page-btn"
                  [class.current]="item === page()"
                  [attr.aria-current]="item === page() ? 'page' : null"
                  [attr.aria-label]="'Page ' + item"
                  (click)="pageChange.emit(item)"
                >
                  {{ item }}
                </button>
              }
            </li>
          }
          <li>
            <button type="button" class="icon-btn" aria-label="Next page" [disabled]="page() >= pageCount()" (click)="pageChange.emit(page() + 1)">
              <app-icon name="chevron-right" [size]="16" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-5);
      border-top: 1px solid var(--border);
      font-size: var(--fs-sm);
      color: var(--text-muted);
    }
    strong { color: var(--text); font-weight: 600; }
    .controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4); }
    .size { display: flex; align-items: center; gap: var(--space-2); }
    .select-sm { width: auto; min-height: 32px; padding-top: 4px; padding-bottom: 4px; font-size: var(--fs-sm); }
    ul { display: flex; align-items: center; gap: 2px; margin: 0; padding: 0; list-style: none; }
    .icon-btn { width: 32px; height: 32px; }
    .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn {
      display: inline-grid;
      place-items: center;
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      border: 0;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-muted);
      font-size: var(--fs-sm);
      font-weight: 500;
      cursor: pointer;
    }
    .page-btn:hover { background: var(--surface-2); color: var(--text); }
    .page-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .page-btn.current { background: var(--primary); color: var(--on-primary); }
    .gap { padding: 0 4px; }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSizes = input<readonly number[]>([10, 25, 50]);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly from = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min(this.total(), this.page() * this.pageSize()));

  /** Номера страниц: первая, последняя и соседи текущей; null — пропуск «…» */
  protected readonly pages = computed<(number | null)[]>(() => {
    const count = this.pageCount();
    const current = this.page();
    const wanted = new Set([1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count));
    const sorted = [...wanted].sort((a, b) => a - b);
    const result: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push(null);
      result.push(p);
    });
    return result;
  });

  protected onSize(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
