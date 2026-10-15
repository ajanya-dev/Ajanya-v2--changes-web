import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatDialogClose, MatDialogActions } from '@angular/material/dialog';

@Component({
  selector: 'app-update-all-payee-from-address',
  templateUrl: './update-all-payee-from-address.component.html',
  styleUrls: ['./update-all-payee-from-address.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, MatDialogActions]
})
export class UpdateAllPayeeFromAddressComponent {
  allPayeeFromAddress: any[] = [];
}
