import { Component, computed, input } from '@angular/core';

interface IStepItem {
  index: number;
  label: string;
}

@Component({
  selector: 'app-v4-multi-check-stepper',
  standalone: true,
  template: `
    <div class="w-full flex items-start gap-2 sm:gap-3">
      @for (step of steps; track step.index) {
        <div class="flex-1 flex flex-col gap-2 min-w-0">
          <div
            class="h-1 rounded-full transition-colors duration-300"
            [class.bg-v4-secondary-brand-color]="step.index <= activeStep()"
            [class.bg-v4-border-color]="step.index > activeStep()"
          ></div>
          <span
            class="text-xs sm:text-sm font-peridot truncate"
            [class.text-v4-main-text-color]="step.index === activeStep()"
            [class.font-semibold]="step.index === activeStep()"
            [class.text-v4-secondary-text-color]="step.index < activeStep()"
            [class.text-v4-subtle-text-color]="step.index > activeStep()"
          >
            {{ step.label }}
          </span>
        </div>
      }
    </div>
  `
})
export class V4MultiCheckStepperComponent {
  activeStep = input.required<number>();

  readonly steps: IStepItem[] = [
    { index: 1, label: 'Upload File' },
    { index: 2, label: 'Match Data' },
    { index: 3, label: 'Review' },
    { index: 4, label: 'Mailing Type' },
    { index: 5, label: 'Confirm' }
  ];

  readonly totalSteps = computed(() => this.steps.length);
}
