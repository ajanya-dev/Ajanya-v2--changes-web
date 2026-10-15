import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IShippView } from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { NgIf, DatePipe } from '@angular/common';

@Component({
  selector: 'app-view-shipping-label',
  templateUrl: './view-shipping-label.component.html',
  styleUrls: ['./view-shipping-label.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgIf, DatePipe]
})
export class ViewShippingLabelComponent implements OnInit {
  subscription: Subscription[] = [];
  viewData: IShippView;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _shippingLabelService: ShippingLabelService
  ) {}

  ngOnInit(): void {
    if (this.data.shippLabelId) {
      this.getViewData(this.data.shippLabelId);
    }
  }

  /**
   * @description Get shipping label data.
   */
  getViewData(labelId: string) {
    this.subscription.push(
      this._shippingLabelService.shippingLabelView(labelId).subscribe((res) => {
        this.viewData = res.data;
      })
    );
  }
}
