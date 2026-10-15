import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-estimated-charge-modal',
  templateUrl: './estimated-charge-modal.component.html',
  styleUrls: ['./estimated-charge-modal.component.scss'],
  standalone: true
})
export class EstimatedChargeModalComponent implements OnInit {
  errorMsg: any;

  constructor(
    public dialogRef: MatDialogRef<EstimatedChargeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.errorMsg = this.data.err;
  }

  send() {
    this.data.data.shipping_rate_warning = 1;
    this.dialogRef.close(this.data.data);
  }

  close() {
    this.dialogRef.close(false);
  }
}
