import { CommonModule } from '@angular/common';
import { Component, inject, input, Input } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';

/**
 * @description Component for back button - go back to previous page.
 */
@Component({
  standalone: true,
  imports: [CommonModule,FaIconComponent],
  selector: 'app-ocw-back-button',
  templateUrl: './ocw-back-button.component.html',
  styleUrls: ['./ocw-back-button.component.scss']
})
export class OcwBackButtonComponent {
  private router = inject(Router);
  @Input() backUrl?: string;
  @Input() btnStyle: { bg: 'light' | 'dark' } = { bg: 'dark' };
  isRounded = input(false);

  faArrowLeft = faArrowLeft;

  /**
   * @description Method to navigate to previous page.
   */
  goBack(): void {
    if (this.backUrl) {
      if (history.state?.backUrl) {
        this.router.navigate([history.state.backUrl]);
      } else {
        this.router.navigate([this.backUrl]);
      }
    }
  }
}
