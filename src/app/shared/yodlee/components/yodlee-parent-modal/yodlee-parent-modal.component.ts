import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  inject
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { IBankData, IBankDropdown } from 'src/app/models/bank';
import {
  ISelectYodleeAccount,
  IYodleeParentCommonData,
  IYodleeParentData,
  yodleeAccDetails
} from 'src/app/models/yodlee';
import { MicroDepositModalComponent } from 'src/app/modules/bank/bank-v2/modals/micro-deposit-modal/micro-deposit-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AddAccountDetailsComponent } from '../add-account-details/add-account-details.component';
import { SelectAccountsComponent } from '../select-accounts/select-accounts.component';
import { ConnectYourBankComponent } from '../connect-your-bank/connect-your-bank.component';
import { NgClass } from '@angular/common';

interface ISelectedStep {
  id: number;
  label: string;
  isEnabled: boolean;
  data: unknown;
}

/**
 * @description Parent modal component for Yodlee.
 */
@Component({
  selector: 'app-yodlee-parent-modal',
  templateUrl: './yodlee-parent-modal.component.html',
  styleUrls: ['./yodlee-parent-modal.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    ConnectYourBankComponent,
    SelectAccountsComponent,
    AddAccountDetailsComponent,
    FaIconComponent,
    MatDialogClose
  ]
})
export class YodleeParentModalComponent implements OnInit, OnDestroy {
  @Optional() public dialogueData: IYodleeParentData = inject(MAT_DIALOG_DATA);
  @Optional() public dialogRef = inject(
    MatDialogRef<YodleeParentModalComponent>
  );
  private router = inject(Router);
  private appSettingService = inject(AppSettingsService);
  private gettingStartedService = inject(GettingStartedService);
  private bankAccService = inject(BankAccountsService);
  private adpService = inject(AdpService);
  private dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private headerService = inject(HeaderService);

  selectedStep: ISelectedStep;
  steps: ISelectedStep[];
  componentSpecificData: unknown;
  commonData: IYodleeParentCommonData;
  appConfig: IAppConfig | null;
  subscriptions: Subscription[] = [];
  videoSlug: string;
  isADPMarketPlaceUser: boolean;
  @Input() config: { singleSelection?: boolean };
  @Input() dialogueDataInput: { mode?: string } | boolean = false;
  @Output() outsideEvents = new EventEmitter();
  isModal: boolean;
  faXmark = faXmark;

  constructor() {
    if (this.dialogRef) {
      this.dialogRef.disableClose = true;
      this.dialogRef.backdropClick().subscribe(() => {
        if (this.selectedStep.id === 4) {
          this.dialogRef.close(true);
        } else {
          this.dialogRef.close(false);
        }
      });
    }
  }

  ngOnInit(): void {
    if (this.dialogueDataInput) {
      this.commonData = {
        dialogueInitializationData: this.dialogueDataInput,
        singleSelection: this.config?.singleSelection
      };
    } else {
      this.isModal = true;
      this.commonData = {
        dialogueInitializationData: this.dialogueData,
        isModal: this.isModal
      };
    }
    this.configSteps();

    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe((res) => {
        this.appConfig = res as IAppConfig;
      })
    );
    this.processADPUserDetails();
  }

  /**
   * @description Checks for adp marketplace user and if true, sets `this.isADPMarketPlaceUser` to true.
   */
  processADPUserDetails() {
    this.subscriptions.push(
      this.adpService.adpUserDetails.subscribe((res) => {
        if (res?.adpMarketPlaceUser === 1) {
          this.isADPMarketPlaceUser = true;
        }
      })
    );
  }

  /**
   * @description Configures different steps according to `dialogueInitializationData` mode and sets them to `this.selectedStep` and emits `this.outsideEvents` event with the selected step.
   */
  configSteps() {
    if (
      (this.commonData?.dialogueInitializationData as { mode?: string })
        ?.mode === 'connect_new_bank'
    ) {
      this.videoSlug = 'instantbankverification';
      this.steps = [
        {
          id: 1,
          label: 'Step 1: Connect Bank',
          isEnabled: false,
          data: false
        },
        {
          id: 2,
          label: 'Step 2: Select Accounts',
          isEnabled: false,
          data: false
        },
        {
          id: 3,
          label: 'Step 3: Add Account Details',
          isEnabled: false,
          data: false
        },
        {
          id: 4,
          label: 'Step 4: Finish',
          isEnabled: false,
          data: false
        }
      ];
      this.selectedStep = this.steps[0];
      this.componentSpecificData = this.steps[0].data;
      this.steps[0].isEnabled = true;
    }
    if (
      (this.commonData?.dialogueInitializationData as { mode?: string })
        ?.mode === 'connect_old_bank_accounts'
    ) {
      this.videoSlug = 'addbankinstantly';
      this.steps = [
        {
          id: 1,
          label: 'Step 1: Connect Bank',
          isEnabled: true,
          data: false
        },
        {
          id: 2,
          label: 'Step 2: Select Accounts',
          isEnabled: false,
          data: [
            ...(this.commonData.dialogueInitializationData as IYodleeParentData)
              ?.unlinkedBankAccounts
          ]
        },
        {
          id: 3,
          label: 'Step 3: Add Account Details',
          isEnabled: false,
          data: false
        },
        {
          id: 4,
          label: 'Step 4: Finish',
          isEnabled: false,
          data: false
        }
      ];
      this.selectedStep = this.steps[1];
      this.componentSpecificData = this.steps[1].data;
      this.steps[1].isEnabled = true;
    }
    if (
      (
        this.commonData?.dialogueInitializationData as {
          mode?: string;
          verifyNowAccountData: IBankData;
        }
      )?.mode === 'verify_now'
    ) {
      this.videoSlug = 'addbankfromconnectedbank';
      this.steps = [
        {
          id: 1,
          label: 'Step 1: Connect Bank',
          isEnabled: false,
          data: false
        },
        {
          id: 4,
          label: 'Step 2: Finish',
          isEnabled: false,
          data: false
        }
      ];
      this.selectedStep = this.steps[0];
      this.componentSpecificData = this.steps[0].data;
      this.steps[0].isEnabled = true;
    }
    this.outsideEvents.emit(this.selectedStep);
  }

  /**
   * @description Method invoked when the `next` event is emitted from child component.
   * Goes to next step and sets the data received from event.
   * Invokes `this.onStepClicked` method with step data.
   * @param data - event data.
   */
  next(data: yodleeAccDetails | IBankDropdown | ISelectYodleeAccount) {
    const index =
      this.steps.findIndex((step) => this.selectedStep.id === step.id) + 1;
    if (this.steps[index].id === 4) {
      this.gettingStartedService.updatedGettingStartedData = 2;
      this.gettingStartedService.updatedGettingStartedData = 3;
      this.steps.forEach((step) => {
        step.isEnabled = false;
      });
    }
    this.steps[index].isEnabled = true;
    this.steps[index].data = data;
    this.onStepClicked(this.steps[index]);
  }

  /**
   * @description Method invoked when the `prev` event is emitted from child component.
   * Goes to previous step and sets the data received from event.
   * Invokes `this.onStepClicked` method with step data.
   * @param data - event data.
   */
  prev(enableForward: boolean) {
    const index =
      this.steps.findIndex((step) => this.selectedStep.id === step.id) - 1;
    this.selectedStep.isEnabled = enableForward;
    this.steps[index].isEnabled = true;
    this.onStepClicked(this.steps[index]);
  }

  /**
   * @description Emits `outSideEvents` event and sets selected step and data.
   * @param selectedStep
   */
  onStepClicked(selectedStep: ISelectedStep) {
    if (selectedStep.isEnabled) {
      this.componentSpecificData = selectedStep.data;
      this.selectedStep = selectedStep;
    }
    this.outsideEvents.emit(this.selectedStep);
  }

  /**
   * @description Method invoked when `error` event is emitted from child component.
   * @param data
   */
  error(data: unknown) {
    const errorStep = {
      id: 0,
      label: 'error',
      isEnabled: true,
      data: data || false
    };
    this.steps.forEach((step) => {
      step.isEnabled = false;
    });
    this.onStepClicked(errorStep);
  }

  /**
   * @description Method invoked when 'Add Manually' is selected.
   * Navigates to add bank account manually.
   */
  addManually() {
    if (!this.isADPMarketPlaceUser) {
      this.router.navigate(['/manage/users/add-bank-manually']);
    }
    this.bankAccService.bancAcEvents.next({
      message: 'Add Bank Manually Clicked Yodlee'
    });
  }

  /**
   * Opens Verify Manually Modal
   */
  verifyManualy() {
    this.dialog
      .open(MicroDepositModalComponent, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false,
        data: (
          this.commonData?.dialogueInitializationData as {
            mode?: string;
            verifyNowAccountData?: IBankData;
          }
        )?.verifyNowAccountData
      })
      .afterClosed()
      .subscribe(() => {
        this.dialogRef.close({ success: true });
      });
  }

  /**
   * @description Method to check if screen width if less than 900px.
   * @returns boolean
   */
  isScreenSmall() {
    return screen.width < 900;
  }

  /**
   * @description Resets the steps.
   */
  retry(): void {
    this.configSteps();
  }

  /**
   * @description Closes the dialog and refreshes the data table.
   */
  closeModal(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.dataTableService.setRefreshStatus(true);
    if (this.selectedStep.id === 4) {
      this.dialogRef.close(true);
      this.headerService.refreshDynamicHeader.next(true);
    } else {
      this.dialogRef.close(false);
    }
  }

  onVerificationFail(isFail:boolean){
    if(isFail){
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
