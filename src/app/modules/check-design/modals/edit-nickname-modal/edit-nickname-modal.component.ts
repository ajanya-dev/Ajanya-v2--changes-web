import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { IGetExistLogo } from 'src/app/models/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-nickname-modal',
  templateUrl: './edit-nickname-modal.component.html',
  styleUrls: ['./edit-nickname-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FormsModule, MatDialogActions]
})
export class EditNicknameModalComponent implements OnInit {
  nickName: string;

  constructor(@Inject(MAT_DIALOG_DATA) public _data: IGetExistLogo) {}

  ngOnInit(): void {
    this.nickName = this._data.nickName as string;
  }
}
