import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCreditCard, faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-pay-by-cc-toast',
  standalone: true,
  imports: [FontAwesomeModule, NgClass],
  templateUrl: './pay-by-cc-toast.component.html',
  styleUrl: './pay-by-cc-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayByCcToastComponent {
  reverse = input<boolean>(false);

  onClick = output();
  onClose = output();

  faXmark = faXmark;
  faCreditCard = faCreditCard;

  click() {
    this.onClick.emit();
  }

  close() {
    this.onClose.emit();
  }
}
