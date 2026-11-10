import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { DemoDataControl } from '@core/data/repositories';
import { errorMessage } from '@core/errors/app-error';
import { ConfirmService } from '@core/services/confirm.service';
import { ToastService } from '@core/services/toast.service';
import { Icon } from '@shared/components/icon/icon';

/** Сброс демо-данных. Доступен только с mock-бэкендом (у Firebase supported = false) */
@Component({
  selector: 'app-demo-data-settings',
  imports: [Icon],
  template: `
    @if (demo.supported) {
      <section class="card" id="demo-data" aria-labelledby="demo-title">
        <div class="card-header">
          <div>
            <h2 id="demo-title">Demo data</h2>
            <p class="muted sub">All tickets, users and comments are stored only in this browser.</p>
          </div>
        </div>
        <div class="card-body">
          <div class="option">
            <span class="option-text">
              <span class="option-title">Reset demo data</span>
              <span class="option-desc">
                Restore the original tickets, customers and agents. Everything you changed will be lost.
              </span>
            </span>
            <button type="button" class="btn btn-danger" [disabled]="resetting()" (click)="reset()">
              @if (resetting()) {
                <app-icon name="loader" [size]="16" class="spin" />
                Resetting…
              } @else {
                <app-icon name="reset" [size]="16" />
                Reset data
              }
            </button>
          </div>
        </div>
      </section>
    }
  `,
  styleUrl: './settings-section.css',
})
export class DemoDataSettings {
  protected readonly demo = inject(DemoDataControl);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly document = inject(DOCUMENT);

  protected readonly resetting = signal(false);

  protected async reset(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Reset demo data?',
      message:
        'All tickets, comments, users and notifications will be restored to the original demo set. Changes you made will be lost.',
      confirmText: 'Reset data',
      tone: 'danger',
    });
    if (!confirmed) return;
    this.resetting.set(true);
    try {
      await this.demo.reset();
      // Перезагрузка — самый надёжный способ сбросить все кэши в памяти
      this.document.defaultView?.location.assign('/dashboard');
    } catch (error) {
      this.toast.error(errorMessage(error));
      this.resetting.set(false);
    }
  }
}
