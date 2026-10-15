import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';

export interface IPdMetaPart {
  label: string;
  value: string;
}

/** Builds one meta line, dropping parts that have no value. */
export const pdMetaLine = (
  parts: { label: string; value?: string | number | null }[]
): IPdMetaPart[] =>
  parts
    .filter((p) => !!p.value)
    .map((p) => ({ label: p.label, value: String(p.value) }));

/**
 * Header meta under a v4 detail panel's title, for the shell's `subtitleTemplate`:
 * stacked lines while collapsed, one dotted line once the panel is expanded.
 */
@Component({
  standalone: true,
  selector: 'app-pd-meta-lines',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (expanded()) {
      <div class="mt-1 flex min-w-0 items-center gap-2 whitespace-nowrap">
        @for (part of flat(); track part.label; let first = $first) {
          @if (!first) {
            <span
              class="h-1 w-1 shrink-0 rounded-full bg-v4-secondary-text-color"
            ></span>
          }
          <span class="shrink-0">
            {{ part.label }}
            <span class="font-semibold text-v4-main-text-color">{{
              part.value
            }}</span>
          </span>
        }
      </div>
    } @else {
      <div class="mt-1 flex min-w-0 flex-col gap-1">
        @for (line of lines(); track $index) {
          <p class="m-0 min-w-0 truncate">
            @for (part of line; track part.label; let first = $first) {
              @if (!first) {
                &middot;
              }
              {{ part.label }}
              <span class="font-semibold text-v4-main-text-color">{{
                part.value
              }}</span>
            }
          </p>
        }
      </div>
    }
  `
})
export class PdMetaLinesComponent {
  lines = input.required<IPdMetaPart[][]>();
  expanded = input(false);

  flat = computed(() => this.lines().flat());
}
