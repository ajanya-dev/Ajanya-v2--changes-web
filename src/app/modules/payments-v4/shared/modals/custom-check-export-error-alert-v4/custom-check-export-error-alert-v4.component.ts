import { Component, Inject } from '@angular/core';
import { MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IExportErrorRow {
  checkNo: string;
  note: unknown;
}

@Component({
  selector: 'app-custom-check-export-error-alert-v4',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component],
  templateUrl: './custom-check-export-error-alert-v4.component.html'
})
export class CustomCheckExportErrorAlertV4Component {
  readonly XIcon = X;
  readonly errorRows: IExportErrorRow[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public _data: { [key: string]: unknown }[]
  ) {
    this.errorRows = (this._data ?? []).flatMap((item) =>
      Object.entries(item ?? {}).map(([checkNo, note]) => ({ checkNo, note }))
    );
  }
}
