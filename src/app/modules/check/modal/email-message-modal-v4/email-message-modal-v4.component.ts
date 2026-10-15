/* eslint-disable @typescript-eslint/no-explicit-any, no-underscore-dangle */
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { LucideAngularModule, X } from 'lucide-angular';
import { V4TextEditorComponent } from 'src/app/shared/components/v4/v4-text-editor/v4-text-editor.component';
import { CommonButtonV4Component } from '../../../../shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-email-message-modal-v4',
  templateUrl: './email-message-modal-v4.component.html',
  styleUrls: ['./email-message-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    V4TextEditorComponent,
    LucideAngularModule,
    CommonButtonV4Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailMessageModalV4Component implements OnInit, OnDestroy {
  loading = signal(false);
  emailMessage = signal<string>('');
  newEmailMessage: string;
  subscriptions: Subscription[] = [];
  readonly XIcon = X;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _checkService: CheckService,
    public _alertService: V4AlertService,
    private _dialogRef: MatDialogRef<EmailMessageModalV4Component>
  ) {}

  ngOnInit(): void {
    if (this.data?.checkId) {
      this.getMessage();
    }
  }

  saveMessage() {
    if (!this.newEmailMessage && !this.emailMessage()) {
      this._alertService.warningAlert({
        content: 'The message field is required.'
      });
      return;
    }
    this.loading.set(true);
    const body = { id: this.data?.checkId, message: this.newEmailMessage ?? this.emailMessage() };
    this.subscriptions.push(
      this._checkService
        .saveEmailMessage(body)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((data: any) => {
          if (data?.success) {
            this._dialogRef.close();
            this._alertService.successAlert({
              title: '',
              content: 'Email message saved',
              close: true,
              timeout: 2000
            });
          }
        })
    );
  }

  getMessage() {
    this.loading.set(true);
    this.subscriptions.push(
      this._checkService
        .getEmailMessage(this.data.checkId)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((data: any) => {
          if (data?.success) {
            this.emailMessage.set(data.message);
          }
        })
    );
  }

  setEmailMessage(e: string) {
    this.newEmailMessage = e;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
