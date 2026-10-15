import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IPaymyRoll } from 'src/app/modules/payroll/model/payroll';
import { PaymyrollService } from 'src/app/shared/service/payroll/payroll.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-paymyroll',
  templateUrl: './paymyroll.component.html',
  styleUrls: ['./paymyroll.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class PaymyrollComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  urlSafe: SafeResourceUrl;

  constructor(
    private payrollService: PaymyrollService,
    public sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.getPayrollLink();
  }

  getPayrollLink() {
    this.subscriptions.push(
      this.payrollService.getPaymyRoll().subscribe((res: IPaymyRoll) => {
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
          res.data.url
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
