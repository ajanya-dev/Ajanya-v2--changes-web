import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { ValidationService } from '../../service/validation/validation.service';
import { NewPhoneInputComponent } from '../../components/new-phone-input/new-phone-input.component';
import { ControlMessageComponent } from '../../components/control-message/control-message/control-message.component';
import { UserService } from '../../service/user/user.service';
import { AlertService } from '../../service/alert/alert.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FontAwesomeModule,
    CommonButtonV35Component,
    MatDialogModule,
    NewPhoneInputComponent,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgClass
  ],
  selector: 'app-text-us',
  templateUrl: './text-us.component.html',
  styleUrls: ['./text-us.component.scss']
})
export class TextUsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<TextUsComponent>);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);

  faXmark = faXmark;

  isSendingMsg = signal<boolean>(false);
  subscriptions: Subscription[] = [];
  isCountryDropdownOpened = signal<boolean>(false);
  isPhoneNotVerified = false;

  textUsForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, ValidationService.phoneMinLength]]
  });

  ngOnInit(): void {
    this.subscriptions.push(
      this.userProfileService.getPersonalInfo().subscribe((res) => {
        if (res.data.phone) {
          this.textUsForm.patchValue({
            phone: res.data.phone
          });
        }
      })
    );
    this.isPhoneVerified();
  }

  isPhoneVerified() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.phone_verified === 0) {
          this.isPhoneNotVerified = true;
        }
      })
    );
  }

  submit() {
    if (this.textUsForm.invalid) {
      this.textUsForm.markAllAsTouched();
      return;
    }

    if (this.isPhoneNotVerified) {
      this.verifyPhoneEmail();
      return;
    }
    this.isSendingMsg.set(true);
    this.subscriptions.push(
      this.userService
        .textUs({ phone: this.textUsForm.controls.phone.value })
        .pipe(
          finalize(() => {
            this.isSendingMsg.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialogRef.close();
              this.alertService.successAlert({
                content: 'Message Sent Successfully'
              });
            }
          },
          error: (err) => {
            this.alertService.warningAlert({ content: err.errorMsg });
          }
        })
    );
  }

  /**
   * @description Opens a dialog to ask for the verification of email and phone.
   * @param res - The user verification details.
   */
  verifyPhoneEmail() {
    const ref = this.alertService.warningAlert({
      content: `Please verify your Phone Number`,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((response) => {
      if (response) {
        this.dialogRef.close();
        this.router.navigateByUrl('/manage/users/verify-email-phone');
      }
    });
  }

  /**
   * handles county dropdown event event
   */
  countryChange(event: { isOpen: boolean }) {
    if (event.isOpen === true) {
      this.isCountryDropdownOpened.set(true);
    } else {
      this.isCountryDropdownOpened.set(false);
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
