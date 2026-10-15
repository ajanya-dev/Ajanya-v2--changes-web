import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/**
 * @description Represents a common progress bar with steps.
 *
 * @example
 * ```
 * <app-stepper-v35 [numberOfStepperTabs]="3" [currentStepperTabIndex]="0" [stepperHeaders]="['step1','step2','step3']"></app-stepper-v35>
 * ```
 */
@Component({
  selector: 'app-stepper-v35',
  templateUrl: './stepper-v35.component.html',
  styleUrls: ['./stepper-v35.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule]
})
export class StepperV35Component {
  /**
   * Number of total steps in the progress bar.
   * @required
   */
  @Input({ required: true }) numberOfStepperTabs: number | undefined;
  /**
   * Indicate the current tab index.
   *  @required
   */
  @Input({ required: true }) currentStepperTabIndex = 0;
  /** Gap between each stepper (uses Tailwind CSS class). */
  @Input() stepperGap = 'gap-2';
  /** Stepper width (uses Tailwind CSS class). */
  @Input() stepperWidth = 'w-44';
  /** Stepper color before completion (uses Tailwind CSS class). */
  @Input() stepperColor = 'bg-tertiary-background-color';
  /** Stepper color after completion (uses Tailwind CSS class). */
  @Input() selectedStepperColor = 'bg-common-blue-color';
  /**  Indicate the heading of each step.
   *  @required
   */
  @Input({ required: true }) stepperHeaders = [];
  /** If need to show icon */
  @Input() showIcon = false;
  /** Icons to show */
  @Input() icons = [];
}
