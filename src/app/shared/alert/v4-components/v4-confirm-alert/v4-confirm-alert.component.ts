import { Component, inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { IConfirmAlert } from 'src/app/models/alert';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  LucideAngularModule,
  CircleQuestionMark,
  CircleCheckBig,
  CircleX,
  Info,
  TriangleAlert,
  LucideIconData
} from 'lucide-angular';

@Component({
  selector: 'app-v4-confirm-alert',
  templateUrl: './v4-confirm-alert.component.html',
  styleUrls: ['./v4-confirm-alert.component.scss'],
  standalone: true,
  imports: [
    MatDialogActions,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4ConfirmAlertComponent implements OnInit {
  title = 'Confirmation';
  content = "You won't be able to revert this!";
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 6000;
  isOk = true;
  isCancel = true;
  icon: IConfirmAlert['icon'] = 'confirm';
  isShowAsHtml = false;

  private iconMap: Record<NonNullable<IConfirmAlert['icon']>, LucideIconData> =
    {
      confirm: CircleQuestionMark,
      success: CircleCheckBig,
      failure: CircleX,
      info: Info,
      warn: TriangleAlert
    };

  private iconColorMap: Record<NonNullable<IConfirmAlert['icon']>, string> = {
    confirm: 'var(--v4-badge-info-text-color)',
    success: 'var(--v4-badge-success-text-color)',
    failure: 'var(--v4-badge-error-text-color)',
    info: 'var(--v4-badge-info-text-color)',
    warn: 'var(--v4-badge-warning-text-color)'
  };

  private bgColorMap: Record<NonNullable<IConfirmAlert['icon']>, string> = {
    confirm: 'var(--v4-badge-info-bg-color)',
    success: 'var(--v4-badge-success-bg-color)',
    failure: 'var(--v4-badge-error-bg-color)',
    info: 'var(--v4-badge-info-bg-color)',
    warn: 'var(--v4-badge-warning-bg-color)'
  };

  get activeIcon(): LucideIconData {
    return this.iconMap[this.icon ?? 'confirm'];
  }

  get activeIconColor(): string {
    return this.iconColorMap[this.icon ?? 'confirm'];
  }

  get activeBgColor(): string {
    return this.bgColorMap[this.icon ?? 'confirm'];
  }

  private readonly data = inject<IConfirmAlert>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<V4ConfirmAlertComponent>);

  ngOnInit(): void {
    if (this.data) {
      this.title = this.data.title ? this.data.title : this.title;
      this.content = this.data.content ? this.data.content : this.content;
      this.doneMsg = this.data.doneMsg ? this.data.doneMsg : 'OK';
      this.cancelMsg = this.data.cancelMsg ? this.data.cancelMsg : 'Cancel';
      this.close = this.data.close ? this.data.close : false;
      this.timeout = this.data.timeout ? this.data.timeout : this.timeout;
      this.isOk = this.data.isOk !== false;
      this.isCancel = this.data.isCancel !== false;
      this.icon = this.data.icon ?? 'confirm';
      this.isShowAsHtml = this.data.isShowAsHtml ?? false;
    }

    if (this.close) {
      setTimeout(() => {
        this.dialogRef.close(true);
      }, this.timeout);
    }
  }

  done() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
