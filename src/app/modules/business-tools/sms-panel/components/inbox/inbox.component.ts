import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { DatePipe, NgClass } from '@angular/common';
import { IMessageItem } from 'src/app/modules/business-tools/model/business-tools-common';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { faUser } from '@fortawesome/pro-solid-svg-icons';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { SMSPanelDtviewDetailsComponent } from '../sms-panel-dtview-details/sms-panel-dtview-details.component';
import { IInboxTableRowData } from '../../model/sms-panel';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent, FaIconComponent, NgClass, FormsModule]
})
export class InboxComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private businessToolsService = inject(BusinessToolsService);
  private v3DataTableService = inject(V3DataTableService);

  subscriptions: Subscription[] = [];
  isLoading: boolean;
  message = '';
  openedChatDetails = {
    ownerFromNumber: '',
    customerNumber: ''
  };

  datepipe1 = new DatePipe('en-US');
  messages: IMessageItem[] = [];
  faUser = faUser;

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public tableId = DTTableId.groupSmsReceivedMessage;
  frameworkComponents = {
    dtviewDetailsComponent: SMSPanelDtviewDetailsComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent
  };

  floatingFilterComponent = {};

  ngOnInit(): void {
    this.initialize();
  }

  /**
   * @description Initilialise header and column fields.
   */
  initialize() {
    this.columnDefs = [
      this.colDefPhoneNumber,
      this.colDefRecievedPhoneNumber,
      this.colDefMessage,
      this.colDefDateTime
    ];

    this.columnFields = [
      {
        id: 'fromNumber',
        name: 'Phone Number',
        colDef: this.colDefPhoneNumber,
        isDisabled: false,
        isChecked: true
      },
      {
        id: 'toNumber',
        name: 'Phone Number',
        colDef: this.colDefRecievedPhoneNumber,
        isDisabled: false,
        isChecked: true
      },
      {
        id: 'message',
        name: 'Message',
        colDef: this.colDefMessage,
        isDisabled: false,
        isChecked: true
      },
      {
        id: 'created_at',
        name: 'Date',
        colDef: this.colDefDateTime,
        isDisabled: false,
        isChecked: true
      }
    ];
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(this.columnFields, undefined);
  }

  /**
   * @description Send message.
   */
  sendMessage() {
    if (!this.isLoading && this.message) {
      this.isLoading = true;
      const messageItem: IMessageItem = {
        message: this.message,
        status: 'inProcess',
        fromNumber: this.openedChatDetails.ownerFromNumber,
        dateTime: this.datepipe1
          .transform(Date.now(), 'MM-dd-yyyy H:mm:ss')
          ?.toString()
      };

      this.messages.push(messageItem);
      const sendingData = {
        fromNumber: this.openedChatDetails.ownerFromNumber.replace(
          /[()\- ]/g,
          ''
        ),
        toNumber: this.openedChatDetails.customerNumber.replace(/[()\- ]/g, ''),
        message: this.message
      };
      setTimeout(() => {
        const messageContainer = document.getElementById('messageContainer1');
        if (messageContainer === null) return;
        messageContainer.scrollTop = messageContainer.scrollHeight + 100;
      }, 0);

      this.subscriptions.push(
        this.businessToolsService.sendMessageSingle(sendingData).subscribe(
          (res) => {
            this.isLoading = false;
            if (res.success) {
              messageItem.status = 'sent';
              this.message = '';
            }
          },
          () => {
            this.isLoading = false;
          }
        )
      );
    }
  }

  /**
   * @description Get message history.
   */
  getMessageHistory() {
    const sendingData = {
      fromNumber: this.openedChatDetails.ownerFromNumber,
      toNumber: this.openedChatDetails.customerNumber
    };

    this.subscriptions.push(
      this.businessToolsService.getMessageHistory(sendingData).subscribe(
        () => {
          this.isLoading = false;
        },
        () => {
          this.isLoading = false;
        }
      )
    );
  }

  /**
   * @description row click action.
   */
  rowClicked(event: IInboxTableRowData) {
    this.message = '';
    this.messages = [];
    this.openedChatDetails.customerNumber = event.fromNumber;
    this.openedChatDetails.ownerFromNumber = event.toNumber;
    this.messages.push({
      message: event?.message,
      status: 'sent',
      fromNumber: event.fromNumber,
      dateTime: event.created_at
    });
    this.getMessageHistory();
  }

  colDefPhoneNumber = {
    headerName: 'From (customer phonenumber)',
    minWidth: 50,
    maxWidth: 200,
    field: 'fromNumber'
  };

  colDefRecievedPhoneNumber = {
    headerName: 'Recieved (You)',
    minWidth: 50,
    maxWidth: 200,
    field: 'toNumber'
  };

  colDefMessage = {
    headerName: 'Message',
    minWidth: 300,
    field: 'message'
  };

  colDefDateTime = {
    headerName: 'Date',
    minWidth: 50,
    maxWidth: 200,
    field: 'created_at'
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
