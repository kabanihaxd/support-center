import { Component, computed, input } from '@angular/core';

const PALETTE = ['#2563eb', '#7c3aed', '#0f766e', '#b45309', '#be185d', '#0369a1', '#4d7c0f', '#9333ea'];

/** Круглый аватар с инициалами; цвет стабилен для одного имени */
@Component({
  selector: 'app-avatar',
  template: `{{ initials() }}`,
  host: {
    'aria-hidden': 'true',
    '[style.background]': 'color()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.4',
  },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
      border-radius: 50%;
      color: #fff;
      font-weight: 600;
      letter-spacing: 0.02em;
      user-select: none;
    }
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly size = input(32);

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
  );

  protected readonly color = computed(() => {
    let hash = 0;
    for (const ch of this.name()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[hash % PALETTE.length];
  });
}
