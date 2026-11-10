import { Component, computed, input } from '@angular/core';
import { ICONS, IconName } from './icons';

type Attrs = Record<string, string | number | undefined>;

/** SVG-иконка. Декоративная (aria-hidden) — подпись даёт кнопка/ссылка-родитель */
@Component({
  selector: 'app-icon',
  host: { 'aria-hidden': 'true', class: 'app-icon' },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.stroke-width]="strokeWidth()"
    >
      @for (node of nodes(); track $index) {
        @switch (node[0]) {
          @case ('path') {
            <svg:path [attr.d]="a(node[1], 'd')" />
          }
          @case ('circle') {
            <svg:circle [attr.cx]="a(node[1], 'cx')" [attr.cy]="a(node[1], 'cy')" [attr.r]="a(node[1], 'r')" />
          }
          @case ('rect') {
            <svg:rect
              [attr.x]="a(node[1], 'x')"
              [attr.y]="a(node[1], 'y')"
              [attr.width]="a(node[1], 'width')"
              [attr.height]="a(node[1], 'height')"
              [attr.rx]="a(node[1], 'rx')"
              [attr.ry]="a(node[1], 'ry')"
            />
          }
          @case ('line') {
            <svg:line
              [attr.x1]="a(node[1], 'x1')"
              [attr.y1]="a(node[1], 'y1')"
              [attr.x2]="a(node[1], 'x2')"
              [attr.y2]="a(node[1], 'y2')"
            />
          }
          @case ('polyline') {
            <svg:polyline [attr.points]="a(node[1], 'points')" />
          }
          @case ('polygon') {
            <svg:polygon [attr.points]="a(node[1], 'points')" />
          }
          @case ('ellipse') {
            <svg:ellipse
              [attr.cx]="a(node[1], 'cx')"
              [attr.cy]="a(node[1], 'cy')"
              [attr.rx]="a(node[1], 'rx')"
              [attr.ry]="a(node[1], 'ry')"
            />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  readonly strokeWidth = input(2);

  protected readonly nodes = computed(() => ICONS[this.name()] as unknown as [string, Attrs][]);

  protected a(attrs: Attrs, key: string): string | number | null {
    return attrs[key] ?? null;
  }
}
