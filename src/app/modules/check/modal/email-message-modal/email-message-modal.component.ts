import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgClass } from '@angular/common';
import { TextEditorComponent } from '../../../../shared/components/text-editor/text-editor.component';

@Component({
  selector: 'app-email-message-modal',
  templateUrl: './email-message-modal.component.html',
  styleUrls: ['./email-message-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, TextEditorComponent, MatDialogActions, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailMessageModalComponent implements OnInit, OnDestroy {
  loading = signal(false);
  emailMessage = signal<string>('');
  newEmailMessage: string;
  subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _checkService: CheckService,
    public _alertService: AlertService,
    private _dialogRef: MatDialogRef<EmailMessageModalComponent>
  ) {}

  ngOnInit(): void {
    if (this.data?.checkId) {
      this.getMessage();
    }
  }

  saveMessage() {
    this.loading.set(true);
    const body = { id: this.data?.checkId, message: this.newEmailMessage };
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
