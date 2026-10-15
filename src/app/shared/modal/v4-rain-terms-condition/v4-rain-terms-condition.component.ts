import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { ArrowDown, LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-rain-terms-condition',
  templateUrl: './v4-rain-terms-condition.component.html',
  styleUrls: ['./v4-rain-terms-condition.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatDialogClose, NgClass, CommonButtonV4Component]
})
export class V4RainTermsConditionComponent {
  private dialogRef = inject(MatDialogRef<V4RainTermsConditionComponent>);

  readonly XIcon = X;
  readonly ArrowDownIcon = ArrowDown;

  hasScrolledToBottom = signal(false);

  checkScrollPosition(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollThreshold = element.scrollHeight * 0.95;
    if (scrollPosition >= scrollThreshold) {
      this.hasScrolledToBottom.set(true);
    }
  }

  openProhibitedActivitiesList(): void {
    window.open(
      'https://support.zilmoney.com/portal/en/kb/articles/zil-money-prohibited-activities-list',
      '_blank',
      'noopener,noreferrer'
    );
  }

  agreeAndClose(): void {
    this.dialogRef.close(true);
  }
}
