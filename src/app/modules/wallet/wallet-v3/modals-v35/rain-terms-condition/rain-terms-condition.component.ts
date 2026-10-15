import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-rain-terms-condition',
  templateUrl: './rain-terms-condition.component.html',
  styleUrls: ['./rain-terms-condition.component.scss'],
  standalone: true,
  imports: [FaIconComponent, MatDialogClose, NgClass,CommonButtonV35Component]
})
export class RainTermsConditionComponent {
  private dialogRef = inject(MatDialogRef<RainTermsConditionComponent>);

  hasScrolledToBottom = false;
  faArrowDown = faArrowDown;
  faXmark = faXmark;

  checkScrollPosition(event: Event): void {
    const element = event.target as HTMLInputElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const { scrollHeight } = element;
    const scrollThreshold = scrollHeight * 0.95;
    if (scrollPosition >= scrollThreshold) {
      this.hasScrolledToBottom = true;
    }
  }

  openProhibitedActivitiesList(): void {
    window.open(
      'https://support.zilmoney.com/portal/en/kb/articles/zil-money-prohibited-activities-list',
      '_blank',
      'noopener,noreferrer'
    );
  }

  agreeAndClose() {
    this.dialogRef.close(true);
  }
}
