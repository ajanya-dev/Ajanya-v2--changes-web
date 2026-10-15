import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { CashExpAttachmentComponent } from '../../components/cash-exp-attachment/cash-exp-attachment.component';
import { CashExpCommentsComponent } from '../../components/cash-exp-comments/cash-exp-comments.component';
import { CashExpActivityLogComponent } from '../../components/cash-exp-activity-log/cash-exp-activity-log.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-audit-trail-modal',
  templateUrl: './audit-trail-modal.component.html',
  styleUrls: ['./audit-trail-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    CashExpActivityLogComponent,
    CashExpCommentsComponent,
    CashExpAttachmentComponent,
    MatDialogActions
  ]
})
export class AuditTrailModalComponent implements OnInit {
  listActivityLog: any;
  cashExpenseId: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public cashExpensedata1: any, //Get Data From Modal
    @Inject(MAT_DIALOG_DATA) public fromModal1: any
  ) {}

  ngOnInit(): void {
    this.getCashExpenseData();
  }
  getCashExpenseData() {
    this.cashExpenseId = this.cashExpensedata1.cashExpenseData.id;
  }
}
