import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-check-process-print-v4',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckProcessPrintV4Component implements OnInit {
  private data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<CheckProcessPrintV4Component>);

  ngOnInit(): void {
    if (this.data) {
      window.open(this.data.data);
      this.close();
    }
  }

  close(): void {
    this.data.processData.processable_data.printableChecks = [];
    this.dialogRef.close({ success: true, processData: this.data.processData });
  }
}
