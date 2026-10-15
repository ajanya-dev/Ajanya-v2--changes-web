import { Clipboard } from '@angular/cdk/clipboard';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faCopy } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-code-preview',
  standalone: true,
  imports: [NgClass, FaIconComponent, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-preview.component.html',
  styleUrl: './code-preview.component.scss'
})
export class CodePreviewComponent {
  private clipboard = inject(Clipboard);

  code = input.required<string>();
  cosmeticButtons = input(true);

  faCopy = faCopy;
  faCheck = faCheck;
  copied = signal(false);

  buttons = [
    'bg-common-red-color',
    'bg-common-yellow-color',
    'bg-common-green-color'
  ] as const;

  copy() {
    this.clipboard.copy(this.code());

    this.copied.set(true);

    setTimeout(() => {
      this.copied.set(false);
    }, 3000);
  }
}
