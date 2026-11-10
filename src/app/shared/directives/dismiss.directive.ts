import { Directive, ElementRef, inject, input, output } from '@angular/core';

/** Сообщает о клике вне элемента или нажатии Escape — для выпадающих меню */
@Directive({
  selector: '[appDismiss]',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class DismissDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Слушаем только когда меню открыто */
  readonly appDismissActive = input(false);
  readonly appDismiss = output<'outside' | 'escape'>();

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.appDismissActive()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.appDismiss.emit('outside');
  }

  protected onEscape(): void {
    if (this.appDismissActive()) this.appDismiss.emit('escape');
  }
}
