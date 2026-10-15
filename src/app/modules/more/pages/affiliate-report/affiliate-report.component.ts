import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ScriptService } from 'src/app/core/services/script.service';
import { CopiedTextComponent } from 'src/app/shared/components/copied-text/copied-text.component';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  IAffiliateClickedList,
  IAffiliateGetWithdrawRequest
} from '../../model/affiliate';
import { NgFor, CurrencyPipe } from '@angular/common';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

/**
 * Angular component representing the Affiliate Report.
 * @class
 */
@Component({
  selector: 'app-affiliate-report',
  templateUrl: './affiliate-report.component.html',
  styleUrls: ['./affiliate-report.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgFor, CurrencyPipe]
})
export class AffiliateReportComponent implements OnInit, OnDestroy {

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  
  /**
   * Untyped FormGroup for handling form controls.
   * @type {UntypedFormGroup}
   */
  form: UntypedFormGroup;

  /**
   * An array of subscriptions to manage subscriptions.
   * @type {Subscription[]}
   */
  subscriptions: Subscription[] = [];

  /**
   * The balance as a string.
   * @type {string}
   */
  balance: string;

  /**
   * An array of affiliate clicked list.
   * @type {IAffiliateClickedList[]}
   */
  clickedList: IAffiliateClickedList[];

  /**
   * Duration for displaying the copied text message.
   * @type {number}
   */
  copyMsgDuration = 1;

  /**
   * An array of affiliate withdraw details.
   * @type {IAffiliateGetWithdrawRequest[]}
   */
  withdrawDetails: IAffiliateGetWithdrawRequest[];

  /**
   * Constructor to create an instance of AffiliateReportComponent.
   * @constructor
   * @param {UntypedFormBuilder} fb - The Angular FormBuilder for creating form instances.
   * @param {AffiliateProgramsService} _affiliateService - The service for affiliate programs.
   * @param {MatSnackBar} _snackBar - The Angular Material MatSnackBar for displaying snack bar messages.
   * @param {AlertService} _alertService - The service for displaying alert messages.
   * @param {Router} router - The Angular Router service for navigation.
   * @param {ScriptService} _scriptService - The service for handling scripts.
   */
  constructor(
    private fb: UntypedFormBuilder,
    private _affiliateService: AffiliateProgramsService,
    private _snackBar: MatSnackBar,
    private _alertService: AlertService,
    private router: Router,
    private _scriptService: ScriptService
  ) {}

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Initializes the form, retrieves affiliate data, and adds social scripts.
   * @method
   */
  ngOnInit(): void {
    this.addSocialScript();
    this.initForm();
    this.getReferalLink();
    this.getClickedList();
    this.getWithdrawRequest();
  }

  /**
   * Initializes the form.
   * @method
   */
  initForm() {
    this.form = this.fb.group({
      referalLink: ['']
    });
  }

  /**
   * Retrieves the affiliate referral link and balance.
   * @method
   */
  getReferalLink() {
    this.subscriptions.push(
      this._affiliateService.getReferalLink().subscribe((res) => {
        this.balance = res.data.balance;
        if (res.success) {
          this.form.patchValue({
            referalLink: res.data.ReferalLink
          });
        }
      })
    );
  }

  /**
   * Retrieves the list of clicked affiliate links.
   * @method
   */
  getClickedList() {
    this.subscriptions.push(
      this._affiliateService.getClickedList().subscribe((res) => {
        this.clickedList = res.data;
      })
    );
  }

  /**
   * Retrieves the list of affiliate withdraw requests.
   * @method
   */
  getWithdrawRequest() {
    this.subscriptions.push(
      this._affiliateService.getWithdrawRequest().subscribe((res) => {
        this.withdrawDetails = res.data;
      })
    );
  }

  /**
   * Copies the text to the clipboard and displays a copied message.
   * @method
   * @param {HTMLInputElement} element - The HTML input element to copy text from.
   */
  copyCLass = false;
  copyToClipboard(element: HTMLInputElement) {
    this._snackBar.openFromComponent(CopiedTextComponent, {
      duration: this.copyMsgDuration * 1000
    });
    element.select();
    document.execCommand('copy');

    //eslint-disable-next-line @typescript-eslint/no-empty-function
    setTimeout(() => {}, 800);
  }

  /**
   * Navigates to the view details page.
   * @method
   */
  viewDetails() {
    this.router.navigateByUrl('/manage/more/summary');
  }

  /**
   * Initiates the withdrawal process.
   * @method
   * @param {string} value - The withdrawal amount.
   */
  radeem(value: string) {
    const val = parseFloat(value);
    if (val < 20) {
      const data = {
        content: 'You need minimum of 20.00 to initiate payment'
      };
      this._alertService.infoAlert(data);
    } else {
      this.router.navigateByUrl('/manage/more/withdraw');
    }
  }

  /**
   * Navigates to the view activity page.
   * @method
   * @param {string} id - The ID of the affiliate activity.
   */
  viewActivity(id: string) {
    this.router.navigate(['manage/more/earningdetails'], {
      queryParams: { id: id }
    });
  }

  /**
   * Adds the social script to the page if not already loaded.
   * @method
   */
  addSocialScript() {
    if (!document.getElementById('addthis_social')) {
      const src =
        'https://s7.addthis.com/js/300/addthis_widget.js#pubid=ra-5b79fd595dfa1c2d';
      this._scriptService.addScript('', 'addthis_social', src);
    }
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
