import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IVirtualCardTxn } from 'src/app/data/data/virtual-card';
import { IVcnVirtualCardInfo } from 'src/app/modules/outside/model/outside';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-virtual-card-details',
  templateUrl: './virtual-card-details.component.html',
  styleUrls: ['./virtual-card-details.component.scss'],
  standalone: true,
  imports: [NgIf, MatTooltip, NgClass, NgFor, CurrencyPipe]
})
export class VirtualCardDetailsComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  uuId: string;
  isShowFullDetails = false;
  revealingDetails = false;
  loading = false;
  totalPage = 0;
  isCopied = false;
  limit = 10;
  selectedValue!: number;
  cardFullNumber: string;
  isRevealed = false;
  cardTransactions: IVirtualCardTxn[];
  cardDetails: IVcnVirtualCardInfo;
  page = 1;

  constructor(
    private _outsideService: OutsideService,
    private _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.uuId = this._route.snapshot.params?.uuId;
    this.getCardDetails();
    this.getTransaction();
  }

  getCardDetails(): void {
    this.loading = true;
    this.subscription.push(
      this._outsideService.virtualCardInfo(this.uuId).subscribe((res) => {
        this.cardDetails = res?.data;
        this.removeSkelton();
      })
    );
  }

  getTransaction(): void {
    this.loading = true;
    this.subscription.push(
      this._outsideService
        .virtualCardTransactions(this.uuId, this.page, this.limit)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.cardTransactions = res?.data;
            this.totalPage = Math.ceil(res.total / this.limit);
            this.removeSkelton();
          }
        })
    );
  }

  removeSkelton() {
    const skeltonDiv: NodeListOf<HTMLElement> =
      document.querySelectorAll('.skelton')!;
    skeltonDiv.forEach((e) => e.classList.remove('skelton'));
  }

  copy() {
    navigator.clipboard.writeText(this.uuId);
    this.isCopied = !this.isCopied;
    setTimeout(() => {
      this.isCopied = !this.isCopied;
    }, 800);
  }

  next(): void {
    if (this.totalPage >= 9) {
      this.page = this.page + 1;
      this.getTransaction();
    }
  }

  previous() {
    if (this.page > 0) {
      this.page = this.page === 1 ? 1 : this.page - 1;
      this.getTransaction();
    }
  }

  getCardFullDetails() {
    this.revealingDetails = true;
    setTimeout(() => {
      this.revealingDetails = false;
      this.isShowFullDetails = true;
    }, 2000);
  }

  formatNumber(number: number): string {
    const numberString = number?.toString();
    let formattedNumber = '';
    for (let i = 0; i < numberString?.length; i += 4) {
      formattedNumber += numberString?.slice(i, i + 4) + ' ';
    }
    return formattedNumber?.trim();
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
