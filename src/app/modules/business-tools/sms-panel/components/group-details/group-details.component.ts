import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { finalize, Subscription } from 'rxjs';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { AddContactModalComponent } from '../../modals/add-contact-modal/add-contact-modal.component';
import { UploadContacsModalComponent } from '../../modals/upload-contacs-modal/upload-contacs-modal.component';
import { IGroupDetails } from '../../../model/business-tools-common';
import { IContactRowData, ISMSPanelSelectedRow } from '../../model/sms-panel';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { NgIf, NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgIf,
    NgClass,
    V3DataTableComponent
  ]
})
export class GroupDetailsComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private businessToolsService = inject(BusinessToolsService);
  private alertService = inject(AlertService);
  private data: { mode: string; groupData: IGroupDetails } =
    inject(MAT_DIALOG_DATA);

  private v3DataTableService = inject(V3DataTableService);
  private matDialogue = inject(MatDialog);

  @ViewChild('fileIn') fileInput: ElementRef;

  subscriptions: Subscription[] = [];
  isLoading: boolean;

  files: File[];
  fileName: string;
  isGroupCreated: boolean;
  contactsArray = [];
  mode: string;
  groupId: string;
  groupForm: UntypedFormGroup;
  importFileInput: null;
  refreshGroupTable: boolean;
  sampleFileUrl: string;
  public columnDefs: (ColDef | ColGroupDef)[];
  columnFields: IDtColumnFields[];
  tableId = DTTableId.smsGroupContactList;
  isSampleFileLoading = signal(false);
  faXmark = faXmark;

  postData: { groupId: string };
  actionComponentProp = {
    editButton: true,
    deleteButton: true
  };

  frameworkComponents = {
    actionComponent: DtActionComponent
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Add Contact',
        id: 'id_add',
        isAddIcon: true,
        icon: ['fas', 'user-plus'],
        type: 'list',
        toolTip: 'Add Contacts to this group'
      },
      {
        text: 'Import Contacts',
        id: 'id_import',
        isAddIcon: true,
        icon: ['fas', 'down-to-line'],
        type: 'list',
        toolTip: 'Import contacts from .csv/.xlsx files'
      },
      {
        text: 'Download Sample File',
        id: 'id_download',
        isAddIcon: true,
        icon: ['fas', 'download'],
        type: { name: 'action', style: 'blue' },
        backGroundInput: 'transparent',
        toolTip: 'Import contacts from .csv/.xlsx files',
        disabled: this.isSampleFileLoading(),
      }
    ]
  }));

  ngOnInit(): void {
    this.initialize();
    this.getSampleFile();
  }

  /**
   * @description Initialise column fiels and header elements.
   */
  initialize() {
    // 2 modes in this component Create Group and Update Group - set  in this variable 'mode'
    this.mode = this.data.mode;
    this.groupForm = new UntypedFormGroup({
      name: new UntypedFormControl('', Validators.required),
      nickName: new UntypedFormControl(''),
      description: new UntypedFormControl()
    });

    if (this.mode === 'create') {
      this.contactsArray = [];
      this.groupId = '0';
    } else if (this.mode === 'details') {
      this.groupId = this.data.groupData.id;
      this.groupForm.controls.name.setValue(this.data.groupData.name);
      this.groupForm.controls.nickName.setValue(this.data.groupData.nick_name);
      this.groupForm.controls.description.setValue(
        this.data.groupData.description
      );
    }
    this.postData = { groupId: this.groupId };
    this.columnDefs = [
      this.colDefName,
      this.colDefPhoneNumber,
      this.colDefEmail,
      this.colDefCompany,
      this.colDefAddress1,
      this.colDefAddress2,
      this.colDefCity,
      this.colDefState,
      this.colDefZip,
      this.colDefAction
    ];
    this.columnFields = [
      {
        id: 'name',
        name: 'Name',
        isDisabled: true,
        colDef: this.colDefName,
        isChecked: true
      },
      {
        id: 'phone',
        name: 'Phone Number',
        isDisabled: false,
        colDef: this.colDefPhoneNumber,
        isChecked: true
      },
      {
        id: 'email',
        name: 'E-mail',
        isDisabled: true,
        colDef: this.colDefEmail,
        isChecked: true
      },
      {
        id: 'company',
        name: 'company',
        isDisabled: false,
        colDef: this.colDefCompany,
        isChecked: true
      },
      {
        id: 'address1',
        name: 'address1',
        isDisabled: false,
        colDef: this.colDefAddress1,
        isChecked: true
      },
      {
        id: 'address2',
        name: 'address2',
        isDisabled: false,
        colDef: this.colDefAddress2,
        isChecked: false
      },
      {
        id: 'city',
        name: 'city',
        isDisabled: false,
        colDef: this.colDefCity,
        isChecked: true
      },
      {
        id: 'state',
        name: 'state',
        isDisabled: false,
        colDef: this.colDefState,
        isChecked: true
      },
      {
        id: 'zip',
        name: 'zip',
        isDisabled: false,
        colDef: this.colDefZip,
        isChecked: false
      },
      {
        id: 'other',
        name: 'other',
        isDisabled: false,
        colDef: this.colDefOthers,
        isChecked: false
      },
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: false,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(
      this.columnFields,
      undefined,
      undefined,
      this.actionComponentProp,
      this.tableId
    );
    this.v3DataTableService.resetV3DataTablePayload();
  }

  // -----> GROUPS CRUD START<-----------
  /**
   * @description Update group.
   */
  updateGroup() {
    if (this.groupForm.valid) {
      const sendingData = {
        name: this.groupForm.controls.name.value,
        nickname: this.groupForm.controls.nickName.value
          ? this.groupForm.controls.nickName.value
          : '--',
        description: this.groupForm.controls.description.value
          ? this.groupForm.controls.description.value
          : '--'
      };
      this.isLoading = true;
      this.subscriptions.push(
        this.businessToolsService
          .updateGroup2(this.groupId, sendingData)
          .subscribe(
            (res) => {
              this.isLoading = false;
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Group Name Updated Successfully'
                };
                this.alertService.successAlert(data);
                this.refreshGroupTable = true;
              }
            },
            () => {
              this.isLoading = false;
            }
          )
      );
    } else {
      this.groupForm.markAllAsTouched();
    }
  }

  /**
   * @description create group.
   */
  createGroup() {
    if (this.groupForm.valid) {
      const sendingData = new FormData();
      sendingData.append('name', this.groupForm.controls.name.value);
      sendingData.append(
        'nickname',
        this.groupForm.controls.nickName.value
          ? this.groupForm.controls.nickName.value
          : ''
      );
      sendingData.append(
        'description',
        this.groupForm.controls.description.value
          ? this.groupForm.controls.description.value
          : ''
      );
      this.isLoading = true;
      this.subscriptions.push(
        this.businessToolsService.createSMSGroup(sendingData).subscribe(
          (res) => {
            this.isLoading = false;
            if (res.success) {
              this.isGroupCreated = true;
              this.groupId = res.data;
              const data = {
                close: true,
                timeout: 3000,
                title: 'Group Created!',
                content: 'Now you can add or import contacts.'
              };
              this.alertService.successAlert(data);
              this.refreshGroupTable = true;
              this.postData = { groupId: this.groupId };
              this.getContactsByGroup();
            }
          },
          () => {
            this.isLoading = false;
          }
        )
      );
    } else {
      this.groupForm.markAllAsTouched();
    }
  }
  // -----GROUPS CRUD  END-----------

  // ----->CONTACTS CRUD  START<-----------

  /**
   * @description Get contacts.
   */
  getContactsByGroup() {
    this.dataTableService.setRefreshStatus(true, this.tableId);
  }

  /**
   * @description Get sample file.
   */
  getSampleFile() {
    this.isSampleFileLoading.set(true);
    this.subscriptions.push(
      this.businessToolsService.getSampleFile()
      .pipe(finalize(() => this.isSampleFileLoading.set(false)))
      .subscribe((res) => {
        if (res.success) {
          this.sampleFileUrl = res.data;
        }
      })
    );
  }

  /**
   * @description Delete contact.
   */
  contactDelete(contact: IContactRowData) {
    const alertData = {
      content: 'Are you sure you want to delete this contact?'
    };
    const alert = this.alertService.confirmAlert(alertData);
    alert.afterClosed().subscribe((result) => {
      if (result)
        this.subscriptions.push(
          this.businessToolsService
            .deleteContact(contact.id)
            .subscribe((res) => {
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Deleted Successfully'
                };
                this.alertService.successAlert(data);
                this.getContactsByGroup();
                this.refreshGroupTable = true;
              }
            })
        );
    });
  }

  /**
   * @description Add contact.
   */
  contactAdd() {
    if (!(this.mode === 'create' && !this.isGroupCreated)) {
      const dialogueData = {
        mode: 'create',
        groupId: this.groupId
      };
      const dialogref = this.matDialogue.open(AddContactModalComponent, {
        maxWidth: '550px',
        width: '93%',
        minHeight: '200px',
        data: dialogueData
      });
      dialogref.afterClosed().subscribe((res) => {
        if (res) {
          this.refreshGroupTable = true;
          this.getContactsByGroup();
        }
      });
    } else {
      this.showNoGroupWarningMessage();
    }
  }

  /**
   * @description Import Contacts.
   */
  contactImport(files: File[]): void {
    this.files = [];
    this.fileName = 'UploadContactts';
    if (files) {
      this.fileName = files[0]?.name;
      this.files = files;
      const dialogueData = {
        files: this.files,
        groupId: this.groupId
      };
      const dialogref = this.matDialogue.open(UploadContacsModalComponent, {
        maxWidth: '800px',
        width: '93%',
        minHeight: '200px',
        data: dialogueData
      });
      dialogref.afterClosed().subscribe(() => {
        this.refreshGroupTable = true;
        this.getContactsByGroup();
        this.importFileInput = null;
      });
    }
  }

  /**
   * @description Edit contact.
   */
  contactEdit(contact: IContactRowData) {
    const dialogueData = {
      mode: 'edit',
      details: contact
    };
    const dialogref = this.matDialogue.open(AddContactModalComponent, {
      maxWidth: '650px',
      width: '93%',
      minHeight: '200px',
      data: dialogueData
    });
    dialogref.afterClosed().subscribe((res) => {
      if (res) {
        this.getContactsByGroup();
      }
    });
  }

  // -----CONTACTS CRUD  END-----------
  showWarning() {
    this.showNoGroupWarningMessage();
  }

  /**
   * @description Warning message.
   */
  showNoGroupWarningMessage() {
    this.alertService.warningAlert({
      content:
        'Create group before you add contacts. Fill the group details and click on create button to create a group.'
    });
  }

  /**
   * @description click delete action button.
   */
  onCellDeleteActionbtn(event: ISMSPanelSelectedRow<IContactRowData>) {
    if (event.id === 'id_delete_button') {
      this.contactDelete(event.selectedRow);
    } else if (event.id === 'id_edit_button') {
      this.contactEdit(event.selectedRow);
    }
  }

  downloadSampleFile() {
    window.location.href = this.sampleFileUrl;
  }

  importContact() {
    if (this.isLoading || (this.mode === 'create' && !this.isGroupCreated)) {
      this.showWarning();
    } else {
      this.fileInput.nativeElement.click();
    }
  }

  onHeaderBtn(event: { id: string }) {
    switch (event.id) {
      case 'id_add':
        this.contactAdd();
        break;
      case 'id_import':
        this.importContact();
        break;
      case 'id_download':
        this.downloadSampleFile();
        break;
      default:
        break;
    }
  }

  colDefName = {
    headerName: 'Name',
    minWidth: 200,
    maxWidth: 200,
    field: 'name',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefPhoneNumber = {
    headerName: 'Phone Number',
    minWidth: 200,
    maxWidth: 200,
    field: 'phone',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefEmail = {
    headerName: 'E-Mail',
    minWidth: 200,
    maxWidth: 200,
    field: 'email',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefCompany = {
    headerName: 'Company',
    minWidth: 200,
    maxWidth: 200,
    field: 'company',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefAddress1 = {
    headerName: 'Address 1',
    minWidth: 200,
    maxWidth: 200,
    field: 'address1',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefAddress2 = {
    headerName: 'Address 2',
    minWidth: 200,
    maxWidth: 200,
    field: 'address2',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefCity = {
    headerName: 'City',
    minWidth: 200,
    maxWidth: 200,
    field: 'city',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefState = {
    headerName: 'State',
    minWidth: 200,
    maxWidth: 200,
    field: 'state',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefZip = {
    headerName: 'Zip',
    minWidth: 50,
    maxWidth: 200,
    field: 'zip',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  colDefOthers = {
    headerName: 'Other Info',
    minWidth: 200,
    maxWidth: 200,
    field: 'other',
    filter: 'agTextColumnFilter',
    floatingFilter: true
  };

  pinnedright: boolean | 'left' | 'right' | null | undefined = 'right';
  colDefAction = {
    maxWidth: 100,
    minWidth: 100,
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    pinned: this.pinnedright,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    tableId: this.tableId
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
