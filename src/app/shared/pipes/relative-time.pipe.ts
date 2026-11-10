import { inject, Pipe, PipeTransform } from '@angular/core';
import { Clock } from '@core/services/clock';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** «3 hours ago», «yesterday». Не pure-обновление не нужно: списки перерисовываются при загрузке */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  private readonly clock = inject(Clock);

  transform(iso: string | null | undefined): string {
    if (!iso) return '—';
    const seconds = (Date.parse(iso) - this.clock.now().getTime()) / 1000;
    for (const [unit, size] of UNITS) {
      if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }
    return 'just now';
  }
}
