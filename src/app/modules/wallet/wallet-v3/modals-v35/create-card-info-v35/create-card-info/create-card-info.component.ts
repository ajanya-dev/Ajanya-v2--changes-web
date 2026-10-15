import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightDots, faCreditCard, faRotate, faShieldCheck, faTriangleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { ICardInfoData } from 'src/app/models/wallet';

@Component({
  selector: 'app-create-card-info',
  templateUrl: './create-card-info.component.html',
  styleUrls: ['./create-card-info.component.scss'],
  standalone:true,
  imports:[FontAwesomeModule]
})
export class CreateCardInfoComponent implements OnInit {
  private dialogRef = inject(MatDialogRef);
  private data = inject<ICardInfoData>(MAT_DIALOG_DATA);

  faXmark = faXmark;
  iconsMap = {
    faCreditCard: faCreditCard,
    faTriangleExclamation: faTriangleExclamation,
    faRotate: faRotate,
    faShieldCheck: faShieldCheck,
    faArrowUpRightDots: faArrowUpRightDots
  };

  cardInfoData: ICardInfoData; 

  constructor() { }

  ngOnInit() {
    this.cardInfoData = this.data;
  }

  closeNow() {
    this.dialogRef.close()
  }

  done() {
    this.dialogRef.close(true)
  }
}
