import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  input
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';

/**
 * CommonBackButtonV35Component represents a common back button component for OCW v35.
 */
@Component({
  selector: 'app-common-back-button-v35',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <button
      (click)="onBack()"
      class="text-main-text-color px-2 rounded hover:bg-secondary-background-color"
      [ngClass]="backgroundColor()"
    >
      <fa-icon class="common-back-button" [icon]="faArrowLeft"></fa-icon>
    </button>
  `
})
export class CommonBackButtonV35Component {
  /** Output event emitter for back button events. */
  @Output() backEvent = new EventEmitter();
  backgroundColor = input<string>('bg-transparent');
  /**
   * Optional type of the back button behavior.
   * default is `handleInside`
   *  if type is `handleInside` button will trigger the following action.
   * ```typescript
   * location = inject(Location);
   * location.back()
   * ```
   *  if type is `takeEvent`, You have to take the take the output Event and do the action you want.
   * Eg:-
   * ```html
   * <app-common-back-button-v35 type="takeEvent" (backEvent)="someAction()"></app-common-back-button-v35>
   * ```
   */
  @Input() type: 'handleInside' | 'takeEvent' = 'handleInside';

  /** Private instance of the Angular `Location` service for handling navigation. */
  private location = inject(Location);

  /** Font awesome icon prop */
  faArrowLeft = faArrowLeft;

  /**
   * Handles the click event of the back button
   * and triggers the appropriate behavior based on the button type.
   */
  onBack() {
    if (this.type === 'handleInside') {
      this.location.back();
    } else {
      this.backEvent.emit();
    }
  }
}
