import { OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import {
  ICloudCardDetails,
  ICloudCardFullDetails,
  ICloudCardTransactions,
  ITransactionInfo
} from 'src/app/modules/outside/model/outside';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { Subscription } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgFor, NgClass, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-vcn-details',
  templateUrl: './vcn-details.component.html',
  styleUrls: ['./vcn-details.component.scss'],
  standalone: true,
  imports: [NgIf, MatTooltip, NgFor, NgClass, CurrencyPipe]
})
export class VcnDetailsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  cardDetails: ICloudCardDetails;
  cardTransactions: ICloudCardTransactions[];
  cardFullDetails: ICloudCardFullDetails;
  uuId: string;
  loading = false;
  revealingDetails = false;
  isShowFullDetails = false;
  cardTransactionDetails: ITransactionInfo;
  isCopied = false;

  currentPage = 0;
  initialCount = 1;
  pageArr: (number | '...')[] = [];
  initialPage = 0;
  selectedValue!: number;
  pseudoI!: number;
  totalPage = 0;
  mode = 1;
  cardFullNumber: string;
  limit = 10;
  isRevealed = false;

  constructor(
    private _outsideService: OutsideService,
    private _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.uuId = this._route.snapshot.params?.uuId;
    this.getCardDetails();
    this.getCardTransactions();
  }

  getCardDetails(): void {
    this.loading = true;
    this.subscriptions.push(
      this._outsideService.getCardDetails(this.uuId).subscribe((res) => {
        if (res.success) {
          this.cardDetails = res?.data;
          this.cardTransactionDetails = res?.transaction_info;
          this.removeSkelton();
        }
      })
    );
  }

  splitCardNumber(val: string) {
    const num = String(val);

    const num1 = num.substring(0, 4);
    const num2 = num.substring(4, 8);
    const num3 = num.substring(8, 12);
    const num4 = num.substring(12, 16);

    this.cardFullNumber = num1 + ' ' + num2 + ' ' + num3 + ' ' + num4;
  }

  getCardFullDetails(): void {
    this.isShowFullDetails = true;
    const hide = () => {
      setTimeout(() => {
        this.isShowFullDetails = false;
      }, 60000);
    };

    if (this.cardFullDetails) {
      hide();
      return;
    }

    this.revealingDetails = true;
    this.subscriptions.push(
      this._outsideService
        .getCardFullDetails(this.uuId)
        .pipe(finalize(() => (this.revealingDetails = false)))
        .subscribe((res) => {
          if (res.success) {
            this.isRevealed = true;
            this.cardFullDetails = res.data;
            this.splitCardNumber(this.cardFullDetails?.cardNumber);
            hide();
          }
        })
    );
  }

  getCardTransactions(page = 0): void {
    this.subscriptions.push(
      this._outsideService
        .getCardTransactions(this.uuId, page, this.limit)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.cardTransactions = res.data;
            this.totalPage = Math.ceil(res.total / this.limit);
            this.paginationArray();
            this.currentPage = page;
          }
        })
    );
  }

  removeSkelton() {
    const skeltonDiv: NodeListOf<HTMLElement> =
      document.querySelectorAll('.skelton')!;
    skeltonDiv.forEach((e) => e.classList.remove('skelton'));
  }

  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
    }

    //IF TOTAL PAGE IS LESS THAN 8
    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i++) {
        this.pageArr.push(i);
      }
    }
  }

  /** PAGINATION CONTROL */
  onPrevious() {
    if (this.initialPage > 0) {
      this.initialPage--;
      this.gotoPage(this.initialPage);
      this.getCardTransactions(this.initialPage);
    }
  }

  onNext() {
    if (this.initialPage < this.totalPage - 1) {
      this.initialPage++;
      this.gotoPage(this.initialPage);
      this.getCardTransactions(this.initialPage);
    }
  }

  gotoPage(item: number) {
    if (item >= 0) {
      this.initialPage = item;
      if (item < this.initialCount + 3) {
        this.mode = 1;
        this.paginationArray();
      } else if (item >= this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item + 1;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }
    this.getCardTransactions(item);
  }

  copy() {
    navigator.clipboard.writeText(this.cardTransactionDetails?.reference_id);
    this.isCopied = !this.isCopied;
    setTimeout(() => {
      this.isCopied = !this.isCopied;
    }, 800);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
