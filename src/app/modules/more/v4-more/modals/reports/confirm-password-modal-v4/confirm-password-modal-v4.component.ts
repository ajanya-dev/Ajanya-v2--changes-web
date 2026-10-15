import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { ColseAccountService } from 'src/app/shared/service/close-account/colse-account.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

@Component({
  selector: 'app-confirm-password-modal-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  template: `
    <div>
      <!-- Header -->
      <div
        class="flex justify-between items-center px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex items-center gap-2">
          @if (injectData?.enableBack) {
            <div
              role="button"
              tabindex="0"
              (click)="dialogRef.close(false)"
              (keydown.enter)="dialogRef.close(false)"
              (keydown.space)="dialogRef.close(false); $event.preventDefault()"
              class="w-8 h-8 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
            >
              <lucide-icon
                name="arrow-left"
                [size]="18"
                class="text-v4-main-text-color"
              />
            </div>
          }
          <h1 class="text-xl font-semibold text-v4-main-text-color font-funnel">
            Confirm Password
          </h1>
        </div>
        <div
          role="button"
          tabindex="0"
          (click)="dialogRef.close(false)"
          (keydown.enter)="dialogRef.close(false)"
          (keydown.space)="dialogRef.close(false); $event.preventDefault()"
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon name="x" [size]="20" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <!-- Body -->
      <div class="p-6 bg-v4-tertiary-background-color">
        <div class="flex flex-col gap-2 pb-4">
          <span class="text-sm text-v4-main-text-color font-peridot">
            Please enter the password to confirm
          </span>
          <span
            class="text-sm text-v4-secondary-text-color font-medium font-peridot"
          >
            {{ email }}
          </span>
        </div>
        <div [formGroup]="confirmAccount">
          <div class="relative">
            <!-- No [control]: the input would print its own required message,
                 duplicating the app-control-message-v4 below. -->
            <app-common-input-v4
              [fieldLabel]="'Password'"
              [placeholder]="'Password'"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
            />
            <button
              type="button"
              class="absolute right-3 top-[38px] text-v4-subtle-text-color hover:text-v4-main-text-color cursor-pointer"
              (click)="showPassword.set(!showPassword())"
            >
              <lucide-icon
                [name]="showPassword() ? 'eye-off' : 'eye'"
                [size]="18"
              />
            </button>
          </div>
          <app-control-message-v4
            [control]="confirmAccount.controls.password"
          />
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex justify-end gap-3 px-6 py-4 bg-v4-secondary-background-color border-t border-v4-border-color"
      >
        @if (injectData?.enableBack) {
          <app-common-button-v4
            width="100px"
            [type]="{ style: 'outline', name: 'main' }"
            text="Back"
            (clickEvent)="dialogRef.close(false)"
          />
        }
        <app-common-button-v4
          width="125px"
          [type]="{ style: 'primary', name: 'main' }"
          text="Continue"
          [loading]="isSubmit()"
          [disabled]="isSubmit()"
          (clickEvent)="submit()"
        />
      </div>
    </div>
  `,
  styles: [``]
})
export class ConfirmPasswordModalV4Component implements OnInit {
  private localStorageService = inject(LocalStorageService);
  private closeAccService = inject(ColseAccountService);
  public dialogRef = inject(MatDialogRef<ConfirmPasswordModalV4Component>);
  public injectData = inject<{ type?: string; enableBack: boolean }>(
    MAT_DIALOG_DATA
  );

  private destroyRef = inject(DestroyRef);

  isSubmit = signal(false);
  showPassword = signal(false);
  email = '';

  confirmAccount = new FormGroup({
    password: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.email = this.localStorageService.getItem('email') as string;
  }

  submit(): void {
    this.confirmAccount.markAllAsTouched();
    if (this.confirmAccount.invalid) {
      return;
    }
    this.isSubmit.set(true);

    const data = this.confirmAccount.value;
    const processedData = {
      password: data.password as string,
      username: this.email
    };

    this.closeAccService
      .confirmPassword(processedData)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(processedData);
        }
      });
  }
}
