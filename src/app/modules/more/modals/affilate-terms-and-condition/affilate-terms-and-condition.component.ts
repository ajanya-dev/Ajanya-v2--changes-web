import { Component } from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-affilate-terms-and-condition',
  standalone: true,
  imports: [MatDialogClose, FaIconComponent, CommonButtonV35Component],
  template: `
    <div class="font-roboto">
      <div
        class="flex justify-between p-6 border-b   border-b-input-border-color "
      >
        <div class=" p-0 rounded-[10px]">
          <span
            class="mt-18 w-full text-base  align-middle flex items-center"
          >
            <span class="pl-1  font-semibold  pb-0.5 text-lg"
              >Terms and Conditions</span
            >
          </span>
        </div>
        <div [mat-dialog-close]="false">
          <fa-icon
            class="text-secondary-text-color cursor-pointer text-xl"
            [icon]="faXmark"
          ></fa-icon>
        </div>
      </div>
      <div class="font-inter text-main-text-color font-normal text-sm py-6 px-8 mb-3 leading-relaxed">
        If the referral reward includes a credit for a yearly subscription fee,
        it will only be applied after the referred user's initial subscription
        period ends to prevent misuse due to cancellations and refunds.
      </div>
    </div>

    <!-- <div class="p-4 ml-auto">
      <app-common-button-v35
        [type]="{ style: 'filled', name: 'main' }"
        class="flex-1 mx-auto "
        (clickEvent)="closeModal()"
        text="I Understand"
        width="50%"
        backGroundInput="var(--common-blue-color)"
      >
      </app-common-button-v35>
    </div> -->
  `
})
export class AffilateTermsAndConditionComponent {
  faXmark = faXmark;
  constructor(
    private dialogRef: MatDialogRef<AffilateTermsAndConditionComponent>
  ) {}

  closeModal() {
    this.dialogRef.close();
  }
}
