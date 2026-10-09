import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/** Dark monospace block with a Copy action, for webhook/API log payloads. */
@Component({
  selector: 'app-log-code-block-v4',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="overflow-hidden rounded-xl border border-v4-border-color bg-[#000]"
    >
      <div class="flex items-center justify-end px-4 pb-1 pt-3">
        <button
          type="button"
          class="flex items-center gap-1.5 border-none bg-transparent text-[12px] font-medium transition-colors"
          [class]="
            copied()
              ? 'text-v4-common-green-color'
              : 'text-v4-subtle-text-color hover:text-v4-tertiary-background-color'
          "
          (click)="copy()"
        >
          <lucide-icon [name]="copied() ? 'check' : 'copy'" [size]="13" />
          {{ copied() ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div class="max-h-96 overflow-auto px-4 pb-4">
        <pre
          class="m-0 whitespace-pre-wrap break-all font-mono text-xs leading-5 text-v4-badge-neutral-bg-color"
          >{{ content() || '—' }}</pre
        >
      </div>
    </div>
  `
})
export class LogCodeBlockV4Component {
  content = input('');

  copied = signal(false);

  copy(): void {
    navigator.clipboard?.writeText(this.content());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 800);
  }
}
