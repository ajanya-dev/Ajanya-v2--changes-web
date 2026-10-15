import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IPaymyRoll } from 'src/app/modules/payroll/model/payroll';
import { PaymyrollService } from 'src/app/shared/service/payroll/payroll.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-payroll',
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class PayrollComponent implements OnInit, OnDestroy {
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
      this.payrollService.getPayrollLink().subscribe((res: IPaymyRoll) => {
        if (this.isValidUrl(res.data.url)) {
          this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
            res.data.url
          );
        }
      })
    );
  }

  /**
   * Validates whether a given string is a valid HTTP or HTTPS URL.Used to prevent security issue.
   * @param {string} url - The string to be validated as a URL.
   * @returns {boolean} - Returns `true` if the URL is valid and uses either the 'http' or 'https' protocol. Otherwise, returns `false`.
   */
  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_) {
      return false; // Invalid URL
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
