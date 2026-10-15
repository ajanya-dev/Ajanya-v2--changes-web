import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

/**
 * CommonCloseButtonV35Component represents a common close button component for OCW v35.
 */
@Component({
  selector: 'app-common-close-button-v35',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <button (click)="close()"><fa-icon [icon]="faXmark"></fa-icon></button>
  `
})
export class CommonCloseButtonV35Component {
  /** Output event emitter for close button events. */
  @Output() closeEvent = new EventEmitter();
  /** Font awesome icon prop */
  faXmark = faXmark;

  /**
   * Triggers the close button event when the button is clicked.
   */
  close() {
    this.closeEvent.emit();
  }
}
