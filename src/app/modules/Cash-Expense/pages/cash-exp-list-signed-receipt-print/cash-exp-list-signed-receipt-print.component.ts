import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { Buffer } from 'buffer';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import { ICashExpenseData } from '../../model/CashExpense';

@Component({
  selector: 'app-cash-exp-list-signed-receipt-print',
  templateUrl: './cash-exp-list-signed-receipt-print.component.html',
  styleUrls: ['./cash-exp-list-signed-receipt-print.component.scss'],
  standalone: true,
  imports: [NgIf, NgOptimizedImage, NgClass]
})
export class CashExpListSignedReceiptPrintComponent
  implements OnInit, OnDestroy
{
  private activatedRoute = inject(ActivatedRoute);
  private cashExpenseService = inject(CashExpenseService);
  private localStorageService = inject(LocalStorageService);

  subscriptions: Subscription[] = [];
  cashExpenseData: ICashExpenseData;
  imgUrlData: string;
  flgPrint = false;
  isSignLoading = true;

  ngOnInit(): void {
    const main_common_module: NodeListOf<HTMLElement> =
      document.querySelectorAll(
        '.side__bar__wrapper, side_panel_overlay, .ocw__header__wrapper'
      );
    main_common_module.forEach((item) => {
      item.style.margin = '0px 0px 0px 0px';
      item.style.display = 'none';
      item.style.visibility = 'hidden';
    });
    const main_common_module2: NodeListOf<HTMLElement> =
      document.querySelectorAll('.main__body__wrapper');
    main_common_module2.forEach((item) => {
      item.style.margin = '0px 0px 0px 0px';
      item.style.padding = '0px 0px 0px 0px';
    });
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((params) => {
        const keyVal = params?.key;
        const parsedData = Buffer.from(keyVal, 'base64').toString('binary');
        const storedData = this.localStorageService.getItem(
          'getSignedReceiptPrint'
        );
        if (storedData === keyVal) {
          const parsedParams = JSON.parse(parsedData);
          this.cashExpenseData = parsedParams;
        }
        // //parse the signature url
        const searchKeyVal = 'the_img=';
        const urlIndex =
          this.cashExpenseData?.signature_url.indexOf(searchKeyVal);
        if (urlIndex >= 0) {
          const the_img = this.cashExpenseData?.signature_url.substr(
            urlIndex + searchKeyVal.length
          );
          const imgElem: HTMLImageElement = <HTMLImageElement>(
            document.getElementById('signimg')
          );
          if (imgElem !== null) {
            this.subscriptions.push(
              this.cashExpenseService
                .getSignImageUrl(the_img)
                .pipe(
                  finalize(() => {
                    this.isSignLoading = false;
                  })
                )
                .subscribe((res) => {
                  const imgUrlData = res;
                  this.imgUrlData = imgUrlData;
                })
            );
          } else {
          this.isSignLoading = false;
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
