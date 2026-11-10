import { Component, computed, inject, signal } from '@angular/core';
import { errorMessage } from '@core/errors/app-error';
import { PreferencesService } from '@core/services/preferences.service';
import { ThemeService } from '@core/services/theme.service';
import { ToastService } from '@core/services/toast.service';
import { Icon } from '@shared/components/icon/icon';
import { IconName } from '@shared/components/icon/icons';
import { ThemePreference } from '@shared/models';

const THEMES: { value: ThemePreference; label: string; icon: IconName; hint: string }[] = [
  { value: 'light', label: 'Light', icon: 'sun', hint: 'Bright and clean' },
  { value: 'dark', label: 'Dark', icon: 'moon', hint: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: 'monitor', hint: 'Follow your device' },
];

/** Тема и плотность таблиц */
@Component({
  selector: 'app-appearance-settings',
  imports: [Icon],
  template: `
    <section class="card" id="appearance" aria-labelledby="appearance-title">
      <div class="card-header">
        <div>
          <h2 id="appearance-title">Appearance</h2>
          <p class="muted sub">Theme is saved in this browser.</p>
        </div>
      </div>
      <div class="card-body">
        <fieldset class="themes">
          <legend class="option-title">Theme</legend>
          @for (t of themes; track t.value) {
            <label class="theme" [class.selected]="theme.preference() === t.value">
              <input
                type="radio"
                name="theme"
                class="sr-only"
                [value]="t.value"
                [checked]="theme.preference() === t.value"
                (change)="theme.setPreference(t.value)"
              />
              <span class="preview" [class]="'preview preview-' + t.value" aria-hidden="true">
                <span class="bar"></span>
                <span class="line"></span>
                <span class="line short"></span>
              </span>
              <span class="theme-name">
                <app-icon [name]="t.icon" [size]="16" />
                {{ t.label }}
              </span>
              <span class="option-desc">{{ t.hint }}</span>
            </label>
          }
        </fieldset>

        <div class="option">
          <span class="option-text">
            <span class="option-title" id="compact-label">Compact tables</span>
            <span class="option-desc" id="compact-desc">Reduce row height to fit more tickets on screen.</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            class="toggle"
            aria-labelledby="compact-label"
            aria-describedby="compact-desc"
            [checked]="compact()"
            [disabled]="!prefs.preferences() || saving()"
            (change)="toggleCompact()"
          />
        </div>
      </div>
    </section>
  `,
  styleUrl: './settings-section.css',
  styles: `
    .themes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-3);
      margin: 0 0 var(--space-2);
      padding: 0 0 var(--space-4);
      border: 0;
      border-bottom: 1px solid var(--border);
    }
    .themes legend { margin-bottom: var(--space-3); padding: 0; }
    .theme {
      display: grid;
      gap: var(--space-1);
      padding: var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      cursor: pointer;
    }
    .theme:hover { border-color: var(--border-strong); }
    .theme.selected { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary); }
    .theme:has(input:focus-visible) { outline: 2px solid var(--primary); outline-offset: 2px; }
    .theme-name { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; margin-top: var(--space-1); }
    .preview {
      display: grid;
      align-content: start;
      gap: 6px;
      height: 64px;
      padding: 8px;
      border-radius: var(--radius-md);
      border: 1px solid #d9dee6;
      overflow: hidden;
    }
    .preview .bar { height: 10px; width: 50%; border-radius: 3px; background: #2a78d6; }
    .preview .line { height: 6px; border-radius: 3px; }
    .preview .short { width: 60%; }
    .preview-light { background: #f5f7fa; }
    .preview-light .line { background: #c9d0da; }
    .preview-dark { background: #0d1117; border-color: #283241; }
    .preview-dark .line { background: #3a4657; }
    .preview-system { background: linear-gradient(135deg, #f5f7fa 50%, #0d1117 50%); }
    .preview-system .line { background: #8d97a6; }
    @media (max-width: 520px) {
      .themes { grid-template-columns: 1fr; }
    }
  `,
})
export class AppearanceSettings {
  protected readonly theme = inject(ThemeService);
  protected readonly prefs = inject(PreferencesService);
  private readonly toast = inject(ToastService);

  protected readonly themes = THEMES;
  protected readonly saving = signal(false);
  protected readonly compact = computed(() => this.prefs.preferences()?.compactTables ?? false);

  protected async toggleCompact(): Promise<void> {
    this.saving.set(true);
    try {
      await this.prefs.update({ compactTables: !this.compact() });
    } catch (error) {
      this.toast.error(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
