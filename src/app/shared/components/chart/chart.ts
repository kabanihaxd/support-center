import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ThemeService } from '@core/services/theme.service';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

// Регистрируем только используемое — остальное Chart.js выкинет tree-shaking
Chart.register(
  LineController,
  BarController,
  DoughnutController,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
);

/** Цвета серий — токены из tokens.css (--chart-1..5), у каждой темы свои значения */
export type ChartColor = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';

export interface ChartSeries {
  label: string;
  data: readonly (number | null)[];
  color: ChartColor;
}

/** line — динамика, bar/hbar — сравнение величин, doughnut — доли целого */
export type ChartKind = 'line' | 'bar' | 'hbar' | 'doughnut';


/**
 * Обёртка над Chart.js. Доступность: canvas с role="img" и описанием,
 * HTML-легенда (идентичность серий не только цветом) и скрытая таблица с данными.
 */
@Component({
  selector: 'app-chart',
  template: `
    <div class="canvas-wrap" [style.height.px]="height()">
      <canvas #canvas role="img" [attr.aria-label]="label()"></canvas>
    </div>

    @if (legend().length) {
      <ul class="legend" role="list" [attr.aria-label]="label() + ' legend'">
        @for (item of legend(); track item.label) {
          <li>
            <span class="swatch" [style.background]="'var(--' + item.color + ')'" aria-hidden="true"></span>
            <span class="name">{{ item.label }}</span>
            @if (item.value !== null) {
              <span class="value">{{ item.value }}</span>
            }
          </li>
        }
      </ul>
    }

    <table class="sr-only">
      <caption>{{ label() }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ categoryLabel() }}</th>
          @for (s of series(); track s.label) {
            <th scope="col">{{ s.label }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of labels(); track $index; let i = $index) {
          <tr>
            <th scope="row">{{ row }}</th>
            @for (s of series(); track s.label) {
              <td>{{ format(s.data[i]) }}</td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host { display: grid; gap: var(--space-3); min-width: 0; }
    .canvas-wrap { position: relative; min-width: 0; }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2) var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--fs-sm);
      color: var(--text-muted);
    }
    .legend li { display: inline-flex; align-items: center; gap: 6px; }
    .swatch { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .value { color: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; }
  `,
})
export class ChartView {
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly kind = input.required<ChartKind>();
  readonly labels = input.required<readonly string[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  /** Доступное имя графика (и подпись скрытой таблицы) */
  readonly label = input.required<string>();
  /** Заголовок первого столбца таблицы: «Date», «Status»… */
  readonly categoryLabel = input('Category');
  /** Для doughnut: цвет каждого сегмента */
  readonly segmentColors = input<readonly ChartColor[]>([]);
  readonly height = input(260);
  /** Единица в подсказках и таблице: «h», «%» */
  readonly unit = input('');


  /** Легенда: для doughnut — сегменты со значениями, для нескольких серий — серии; одна серия — без легенды */
  protected readonly legend = computed(() => {
    if (this.kind() === 'doughnut') {
      const data = this.series()[0]?.data ?? [];
      return this.labels().map((label, i) => ({
        label,
        color: this.segmentColors()[i] ?? 'chart-5',
        value: this.format(data[i]),
      }));
    }
    const series = this.series();
    return series.length > 1 ? series.map((s) => ({ label: s.label, color: s.color, value: null })) : [];
  });

  private chart: Chart | null = null;

  constructor() {
    afterRenderEffect(() => {
      // Тема в зависимостях: при переключении перечитываем CSS-переменные
      this.theme.resolved();
      const config = this.buildConfig();
      if (this.chart && (this.chart.config as { type?: string }).type === config.type) {
        this.chart.data = config.data;
        this.chart.options = config.options ?? {};
        this.chart.update();
      } else {
        this.chart?.destroy();
        this.chart = new Chart(this.canvas().nativeElement, config);
      }
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  protected format(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    const rounded = Math.round(value * 10) / 10;
    return `${rounded.toLocaleString('en-US')}${this.unit()}`;
  }

  private buildConfig(): ChartConfiguration {
    const styles = getComputedStyle(this.document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--${name}`).trim();
    const muted = token('text-muted');
    const grid = token('chart-grid');
    const surface = token('surface');
    const kind = this.kind();
    const reduceMotion = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const font = { family: getComputedStyle(this.document.body).fontFamily, size: 12 };

    const tooltip = {
      backgroundColor: token('text'),
      titleColor: surface,
      bodyColor: surface,
      padding: 10,
      cornerRadius: 8,
      boxPadding: 4,
      titleFont: { ...font, weight: 600 as const },
      bodyFont: font,
      callbacks: {
        label: (ctx: { dataset: { label?: string }; label: string; parsed: number | { x: number; y: number } }) => {
          const raw = typeof ctx.parsed === 'number' ? ctx.parsed : kind === 'hbar' ? ctx.parsed.x : ctx.parsed.y;
          const name = kind === 'doughnut' ? ctx.label : (ctx.dataset.label ?? '');
          return ` ${name}: ${this.format(raw)}`;
        },
      },
    };

    const base = {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? (false as const) : { duration: 400 },
      plugins: { legend: { display: false }, tooltip },
    };

    if (kind === 'doughnut') {
      const s = this.series()[0];
      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels: [...this.labels()],
          datasets: [
            {
              label: s?.label ?? '',
              data: [...(s?.data ?? [])] as number[],
              backgroundColor: this.segmentColors().map((c) => token(c)),
              // Зазор между сегментами цветом поверхности
              borderColor: surface,
              borderWidth: 2,
              hoverOffset: 4,
            },
          ],
        },
        options: { ...base, cutout: '68%' },
      };
      return config as unknown as ChartConfiguration;
    }

    const horizontal = kind === 'hbar';
    const valueAxis = {
      beginAtZero: true,
      grid: { color: grid },
      border: { display: false },
      ticks: { color: muted, font, precision: 0, maxTicksLimit: 6 },
    };
    const categoryAxis = {
      grid: { display: false },
      border: { color: grid },
      ticks: { color: muted, font, autoSkip: true, maxRotation: 0, autoSkipPadding: 12 },
    };

    const datasets = this.series().map((s) => {
      const color = token(s.color);
      return kind === 'line'
        ? {
            label: s.label,
            data: [...s.data],
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            // monotone: сглаживание без «выбросов» ниже нуля и выше пиков
            cubicInterpolationMode: 'monotone' as const,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHitRadius: 12,
            pointHoverBorderColor: surface,
            pointHoverBorderWidth: 2,
          }
        : {
            label: s.label,
            data: [...s.data],
            backgroundColor: color,
            borderRadius: 4,
            borderSkipped: 'start' as const,
            maxBarThickness: 28,
          };
    });

    return {
      type: kind === 'line' ? 'line' : 'bar',
      data: { labels: [...this.labels()], datasets: datasets as ChartConfiguration['data']['datasets'] },
      options: {
        ...base,
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: 'index', intersect: false },
        scales: horizontal ? { x: valueAxis, y: categoryAxis } : { x: categoryAxis, y: valueAxis },
      },
    } as ChartConfiguration;
  }
}
