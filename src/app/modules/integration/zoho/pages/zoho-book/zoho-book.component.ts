import {
  LocationStrategy,
  NgIf,
  NgStyle,
  NgFor,
  NgClass
} from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  IConnectedCompanyList,
  IConnectedThirdPartyData
} from '../../../model/integration';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing Zoho Books integration.
 */
@Component({
  selector: 'app-zoho-book',
  templateUrl: './zoho-book.component.html',
  styleUrls: ['./zoho-book.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgStyle,
    NgFor,
    NgClass,
    MatRadioGroup,
    MatRadioButton,
    CustomerSupportComponent
  ]
})
export class ZohoBookComponent implements OnInit, OnDestroy {
  importTime = [
    { value: 1, name: '2 hours' },
    { value: 2, name: '12 hours' },
    { value: 3, name: '24 hours' },
    { value: 4, name: '3 days' },
    { value: 5, name: '7 days' },
    { value: 6, name: '14 days' },
    { value: 7, name: '30 days' }
  ];

  providerCode = 'zoho_books';
  subscriptions: Subscription[] = [];
  zoohBooksForm: UntypedFormGroup;
  zohoBookData: IConnectedThirdPartyData;
  isConnected: number;
  selectedCompanies: string[] = [];
  initialTime = true;
  utils = Utils;

  loading = {
    defaultLoading: false,
    companyLoading: false,
    importCompany: false,
    startImporting: false
  };

  constructor(
    private fb: UntypedFormBuilder,
    private _integrationService: IntegrationService,
    private router: Router,
    private route: ActivatedRoute,
    private _alertService: AlertService,
    private locationStrategy: LocationStrategy
  ) {
    // Disable browser back button
    history.pushState(null, '', location.href);
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', location.href);
    });
  }

  ngOnInit(): void {
    this.initFormGroup();
    this.getZohoBookData(false);
    this.getQueryParams();
  }

  /**
   * Initialize the form group for Zoho Books settings.
   */
  initFormGroup(): void {
    this.zoohBooksForm = this.fb.group({
      selectedCompanies: [''],
      importDataInLast: ['3'],
      importDataType: ['0']
    });
  }

  /**
   * Get query parameters from the URL.
   */
  getQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res.code && res.state && res.location) {
        this.onCallBackFromZohoBooks(res);
      }
    });
  }

  /**
   * Get Zoho Books integration data.
   * @param fromCallBack - Indicates if the function is called from a callback.
   */
  getZohoBookData(fromCallBack: boolean): void {
    this.loading.companyLoading = true;

    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .pipe(finalize(() => (this.loading.companyLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.zohoBookData = res.data;
            this.isConnected = res.data.connected;
            if (!fromCallBack) {
              this.selectedCompanies = this.zohoBookData.companies.map(
                (e: IConnectedCompanyList) => e.companyId
              );
            }
          }
        })
    );
  }

  /**
   * Handle the callback from Zoho Books after authentication.
   * @param params - Query parameters from the callback URL.
   */
  onCallBackFromZohoBooks(params: Params): void {
    this.initialTime = false;

    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }

    this.loading.companyLoading = true;
    this.subscriptions.push(
      this._integrationService
        .connectCallBack(getParams, this.providerCode)
        .subscribe(
          (res) => {
            if (res.success) {
              this.router.navigate([]);
              this.getZohoBookData(true);
              this.openSuccessAlert('Successfully connected.');
            }
          },
          (error) => {
            if (error) {
              this.router.navigate([]);
              this.loading.companyLoading = false;
            }
          }
        )
    );
  }

  /**
   * Connect to Zoho Books integration.
   */
  onConnectToZohoBooks(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .getConnectionUrl(this.providerCode)
        .pipe(finalize(() => (this.loading.defaultLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            window.open(res?.redirectUrl, '_self');
          }
        })
    );
  }

  /**
   * Disconnect from Zoho Books integration.
   */
  ondisconnectToZohoBooks() {
    const confirm = this.openConfirmAlert(
      `All your connected companies will be disconnected. Are you sure you want to continue?`
    );
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.loading.defaultLoading = true;
        this.subscriptions.push(
          this._integrationService
            .disconnect()
            .pipe(finalize(() => (this.loading.defaultLoading = false)))
            .subscribe((res) => {
              if (res.success) {
                this.openSuccessAlert('Disconnected successfully.');
                this.getZohoBookData(true);
              }
            })
        );
      }
    });
  }

  /**
   * Start importing data from Zoho Books.
   */
  onStartImporting(): void {
    this.initialTime = false;

    if (!this.selectedCompanies.length) {
      this.openWarningAlert('Please select at least one company.');
      return;
    }

    const params = {
      markAsPrintLater: this.zoohBooksForm.value.importDataType,
      importTime: this.zoohBooksForm.value.importDataInLast,
      companyId: this.selectedCompanies
    };
    this.loading.startImporting = true;
    this.subscriptions.push(
      this._integrationService
        .startImporting(this.providerCode, params)
        .pipe(finalize(() => (this.loading.startImporting = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.getZohoBookData(true);
            this.openSuccessAlert('Imported Successfully.');
            this.selectedCompanies = [];
          }
        })
    );
  }

  /**
   * Import companies from Zoho Books.
   */
  importCompany(): void {
    this.initialTime = false;

    this.loading.importCompany = true;
    this.subscriptions.push(
      this._integrationService
        .importZohoCompany(this.providerCode)
        .pipe(finalize(() => (this.loading.importCompany = false)))
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert(
              res.message ? res.message : 'Companies added successfully'
            );
            if (res.message !== 'No Company available to add') {
              this.getZohoBookData(true);
            }
            this.selectedCompanies = [];
          }
        })
    );
  }

  //----Select box start

  /**
   * Handle the selection of all companies.
   * @param element - The HTML input element.
   */
  onSelectAllCompanies(element: HTMLInputElement): void {
    const ele: NodeListOf<HTMLInputElement> =
      document.querySelectorAll('[name=sub-check]')!;

    for (let i = 0; i < ele.length; i++) {
      if (element.checked) {
        if (ele[i].type == 'checkbox') ele[i].checked = true;

        this.selectedCompanies = this.zohoBookData.companies.map(
          (e: IConnectedCompanyList) => e.companyId
        );
      } else {
        ele[i].checked = false;
        this.selectedCompanies = [];
      }
    }
  }

  /**
   * Handle the selection of individual companies.
   */
  onCompanySelect(): void {
    const selectAll = document.getElementById('selectAll') as HTMLInputElement;
    const elem: NodeListOf<HTMLInputElement> =
      document.querySelectorAll('[name=sub-check]')!;
    const allChecked = [];

    for (let i = 0; i < elem.length; i++) {
      if (elem[i].checked) allChecked.push(true);
      else allChecked.push(false);
    }

    if (!allChecked.includes(false)) selectAll.checked = true;
    else selectAll.checked = false;
  }

  //----Select box end

  /**
   * Handle the selection of a company.
   * @param companyId - The ID of the selected company.
   * @param companyCheckBox - The HTML input element representing the company checkbox.
   */
  selectedCompanyList(
    companyId: string,
    companyCheckBox: HTMLInputElement
  ): void {
    //Get id of selected company.
    if (companyCheckBox.checked) {
      this.zohoBookData?.companies?.filter((r: IConnectedCompanyList) => {
        if (
          r.companyId === companyId &&
          !this.selectedCompanies.includes(companyId)
        ) {
          this.selectedCompanies.push(r.companyId);
        }
      });
    } else {
      this.selectedCompanies = this.selectedCompanies?.filter((r: string) => {
        return r !== companyId;
      });
    }
  }

  /**
   * Handle the popstate event to disable browser back button.
   */
  @HostListener('window:popstate', ['$event']) //remove query params when go back
  onPopState() {
    this.goBack();
  }

  /**
   * Navigate back to the previous page.
   */
  goBack(): void {
    setTimeout(() => {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }, 100);
  }

  /**
   * Open a warning alert dialog.
   * @param content - The content of the warning alert.
   */
  openWarningAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.warningAlert(data);
  }

  /**
   * Open a success alert dialog.
   * @param content - The content of the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Open a confirmation alert dialog.
   * @param content - The content of the confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Navigate to the bank account mapping page.
   */
  viewBankAccounts() {
    this.router.navigate(['/manage/thirdparty_app/bank-maps']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
