import { Component, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-check-process-print',
  templateUrl: './check-process-print.component.html',
  styleUrls: ['./check-process-print.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgIf]
})
export class CheckProcessPrintComponent implements OnInit {

  public data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<CheckProcessPrintComponent>);

  ismodal = false;

  ngOnInit(): void {
    if (this.data) {
      window.open(this.data.data);
      this.close();
    }
  }

  close() {
    this.data.processData.processable_data.printableChecks = [];
    this.dialogRef.close({success: true,processData:this.data.processData});
  }
}
