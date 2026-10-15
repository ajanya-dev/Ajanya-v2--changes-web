import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IDefaultMessageDetails } from 'src/app/modules/business-tools/model/business-tools-common';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { IApiResMesssage } from 'src/app/models/api';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { SMSPanelDtviewDetailsComponent } from '../sms-panel-dtview-details/sms-panel-dtview-details.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-default-sms-details',
  templateUrl: './default-sms-details.component.html',
  styleUrls: ['./default-sms-details.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    V3DataTableComponent
  ]
})
export class DefaultSmsDetailsComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private businessToolsService = inject(BusinessToolsService);
  private alertService = inject(AlertService);
  private dialogueRef = inject(MatDialogRef<DefaultSmsDetailsComponent>);
  private data: { mode: string; details: IDefaultMessageDetails } =
    inject(MAT_DIALOG_DATA);

  private v3DataTableService = inject(V3DataTableService);

  subscriptions: Subscription[] = [];
  isLoading: boolean;
  files: File[];
  fileName: string;
  isGroupCreated: boolean;
  logsArray = [];
  defaultSMSDetails: IDefaultMessageDetails;
  message: UntypedFormControl = new UntypedFormControl('', Validators.required);
  faXmark = faXmark;

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public tableId = DTTableId.groupSmsDefaultMessage;
  frameworkComponents = {
    dtviewDetailsComponent: SMSPanelDtviewDetailsComponent
  };

  ngOnInit(): void {
    this.initialize();
  }

  /**
   * @description Initialise column fiels and header elements.
   */
  initialize() {
    this.defaultSMSDetails = this.data?.details;
    this.message.setValue(this.defaultSMSDetails.message);

    this.frameworkComponents = {
      dtviewDetailsComponent: SMSPanelDtviewDetailsComponent
    };
    this.columnDefs = [
      this.colDefPhoneNumber,
      this.colDefStatus,
      this.colDefSMSCharge,
      this.colDefMoreDetails
    ];
    this.columnFields = [
      {
        id: 'from_number',
        name: 'Phone Number',
        isDisabled: false,
        colDef: this.colDefPhoneNumber,
        isChecked: true
      },
      {
        id: 'status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'groupName',
        name: 'SMS Charge',
        isDisabled: false,
        colDef: this.colDefSMSCharge,
        isChecked: true
      },
      {
        id: 'not_delivery_reason',
        name: 'More Details',
        isDisabled: false,
        colDef: this.colDefMoreDetails,
        isChecked: true
      }
    ];

    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      undefined,
      undefined,
      undefined,
      this.tableId
    );
  }

  /**
   * @description close modal.
   */
  close() {
    this.dialogueRef.close(true);
  }

  /**
   * @description Update message.
   */
  updateMessage() {
    if (!this.isLoading && this.message.valid) {
      const sendingData = {
        message: this.message.value
      };
      this.subscriptions.push(
        this.businessToolsService
          .updateDefaultMesssageService(
            this.defaultSMSDetails.id as string,
            sendingData
          )
          .pipe(catchError(() => of(false)))
          .subscribe((res) => {
            const response = res as IApiResMesssage;
            if (response.success) {
              const data = {
                close: true,
                timeout: 3000,
                title: 'Success!',
                content: 'Default SMS updated successfully!'
              };
              this.alertService.successAlert(data);
            }
          })
      );
    }
  }

  colDefPhoneNumber = {
    headerName: 'Phone Number',
    minWidth: 50,
    maxWidth: 200,
    field: 'from_number',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 50,
    maxWidth: 200,
    field: 'status',
    filter: '',
    cellRenderer: 'dtviewDetailsComponent',
    floatingFilter: true
  };

  colDefSMSCharge = {
    headerName: 'SMS Charge',
    minWidth: 50,
    maxWidth: 200,
    field: 'sms_charge',
    floatingFilter: true
  };

  colDefMoreDetails = {
    headerName: 'More Details',
    field: 'not_delivery_reason',
    minWidth: 100,
    floatingFilter: true,
    cellStyle: () => ({ width: '100%' })
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
