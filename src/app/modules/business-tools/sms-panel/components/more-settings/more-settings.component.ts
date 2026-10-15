import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import * as countrylist from 'src/app/data/data/country-list-json/country-list-code.json';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { GroupDetailsComponent } from '../group-details/group-details.component';
import { BuyPhonenumberModalComponent } from '../../modals/buy-phonenumber-modal/buy-phonenumber-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  IBuyPhonenumberDetailsModel,
  IGroupDetails,
  IPhonenumberDetailsModel
} from 'src/app/modules/business-tools/model/business-tools-common';
import { ICountryItem } from 'src/app/models/shared';
import { IApiRes } from 'src/app/models/api';
import { IEntryMessage } from '../../model/sms-panel';
import { SearchFilterPipe } from '../../../../../pipes/search-filter.pipe';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-more-settings',
  templateUrl: './more-settings.component.html',
  styleUrls: ['./more-settings.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    NgFor,
    MatTooltip,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    SearchFilterPipe
  ]
})
export class MoreSettingsComponent implements OnInit, OnDestroy {
  USAreaCodes = [
    { stateName: 'Mississippi', codes: [228, 601, 662, 769] },
    { stateName: 'Northern Mariana Islands', codes: [670] },
    { stateName: 'Oklahoma', codes: [405, 539, 580, 918] },
    { stateName: 'Delaware', codes: [302] },
    { stateName: 'Minnesota', codes: [218, 320, 507, 612, 651, 763, 952] },
    {
      stateName: 'Illinois',
      codes: [217, 224, 309, 312, 331, 618, 630, 708, 773, 779, 815, 847, 872]
    },
    { stateName: 'Arkansas', codes: [479, 501, 870] },
    { stateName: 'New Mexico', codes: [505, 575] },
    { stateName: 'Indiana', codes: [219, 260, 317, 574, 765, 812] },
    { stateName: 'Maryland', codes: [240, 301, 410, 443, 667] },
    { stateName: 'Louisiana', codes: [225, 318, 337, 504, 985] },
    { stateName: 'Idaho', codes: [208] },
    { stateName: 'Wyoming', codes: [307] },
    { stateName: 'Tennessee', codes: [423, 615, 731, 865, 901, 931] },
    { stateName: 'Arizona', codes: [480, 520, 602, 623, 928] },
    { stateName: 'Iowa', codes: [319, 515, 563, 641, 712] },
    {
      stateName: 'Michigan',
      codes: [231, 248, 269, 313, 517, 586, 616, 734, 810, 906, 947, 989]
    },
    { stateName: 'Kansas', codes: [316, 620, 785, 913] },
    { stateName: 'Utah', codes: [385, 435, 801] },
    { stateName: 'American Samoa', codes: [684] },
    { stateName: 'Oregon', codes: [458, 503, 541, 971] },
    { stateName: 'Connecticut', codes: [203, 475, 860] },
    { stateName: 'Montana', codes: [406] },
    {
      stateName: 'California',
      codes: [
        209, 213, 310, 323, 408, 415, 424, 442, 510, 530, 559, 562, 619, 626,
        650, 657, 661, 669, 707, 714, 747, 760, 805, 818, 831, 858, 909, 916,
        925, 949, 951
      ]
    },
    {
      stateName: 'Massachusetts',
      codes: [339, 351, 413, 508, 617, 774, 781, 857, 978]
    },
    { stateName: 'Puerto Rico', codes: [787, 939] },
    { stateName: 'South Carolina', codes: [803, 843, 864] },
    { stateName: 'New Hampshire', codes: [603] },
    { stateName: 'Wisconsin', codes: [262, 414, 534, 608, 715, 920] },
    { stateName: 'Vermont', codes: [802] },
    {
      stateName: 'Georgia',
      codes: [229, 404, 470, 478, 678, 706, 762, 770, 912]
    },
    { stateName: 'North Dakota', codes: [701] },
    {
      stateName: 'Pennsylvania',
      codes: [215, 267, 272, 412, 484, 570, 610, 717, 724, 814, 878]
    },
    { stateName: 'West Virginia', codes: [304, 681] },
    {
      stateName: 'Florida',
      codes: [
        239, 305, 321, 352, 386, 407, 561, 727, 754, 772, 786, 813, 850, 863,
        904, 941, 954
      ]
    },
    { stateName: 'Hawaii', codes: [808] },
    { stateName: 'Kentucky', codes: [270, 502, 606, 859] },
    { stateName: 'Alaska', codes: [907] },
    { stateName: 'Nebraska', codes: [308, 402, 531] },
    { stateName: 'Missouri', codes: [314, 417, 573, 636, 660, 816] },
    {
      stateName: 'Ohio',
      codes: [216, 234, 330, 419, 440, 513, 567, 614, 740, 937]
    },
    { stateName: 'Alabama', codes: [205, 251, 256, 334, 938] },
    { stateName: 'Rhode Island', codes: [401] },
    { stateName: 'Washington, DC', codes: [202] },
    { stateName: 'Virgin Islands', codes: [340] },
    { stateName: 'South Dakota', codes: [605] },
    { stateName: 'Colorado', codes: [303, 719, 720, 970] },
    {
      stateName: 'New Jersey',
      codes: [201, 551, 609, 732, 848, 856, 862, 908, 973]
    },
    { stateName: 'Virginia', codes: [276, 434, 540, 571, 703, 757, 804] },
    { stateName: 'Guam', codes: [671] },
    { stateName: 'Washington', codes: [206, 253, 360, 425, 509] },
    {
      stateName: 'North Carolina',
      codes: [252, 336, 704, 828, 910, 919, 980, 984]
    },
    {
      stateName: 'New York',
      codes: [
        212, 315, 347, 516, 518, 585, 607, 631, 646, 716, 718, 845, 914, 917,
        929
      ]
    },
    {
      stateName: 'Texas',
      codes: [
        210, 214, 254, 281, 325, 346, 361, 409, 430, 432, 469, 512, 682, 713,
        737, 806, 817, 830, 832, 903, 915, 936, 940, 956, 972, 979
      ]
    },
    { stateName: 'Nevada', codes: [702, 725, 775] },
    { stateName: 'Maine', codes: [207] }
  ];

  fromNumberForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  countryList: ICountryItem[] = (countrylist as any).default;
  showDropDown: boolean;
  selectedCountry: ICountryItem;
  searchInput = '';
  isLoading: boolean;
  phnoTypes: { country: string; label: string; phoneNumberType: string }[] = [];
  isFilterChanged = true;
  phnoArray: IBuyPhonenumberDetailsModel[] = [];
  fromNumbers: IPhonenumberDetailsModel[];
  @Input() settings: { id: string };
  entrySMSForm: UntypedFormGroup;
  groups: IGroupDetails[];
  isShowGroupDetails: boolean;
  entrySettings: IEntryMessage[];

  constructor(
    private businessToolsService: BusinessToolsService,
    private matDialogue: MatDialog,
    private _alertService: AlertService,
    private headerservice: HeaderService
  ) {}

  ngOnInit(): void {
    if (!this.settings) {
      this.settings = { id: 'phonenumberlist' };
    }
    this.fromNumberForm = new UntypedFormGroup({
      areaCode: new UntypedFormControl(''),
      phoneNumberType: new UntypedFormControl()
    });
    this.fromNumberForm.valueChanges.subscribe(() => {
      this.isFilterChanged = true;
    });
    this.selectedCountry = this.countryList[0];
    this.getFromNumbers();

    this.entrySMSForm = new UntypedFormGroup({
      entryCode: new UntypedFormControl('', Validators.required),
      fromNumber: new UntypedFormControl('', Validators.required),
      group: new UntypedFormControl('', Validators.required),
      replyMessage: new UntypedFormControl(
        'Welcome to {GROUP_NAME}. Thankyou for joining us',
        Validators.required
      )
    });
    this.getGroups();
    this.getEntryMessages();
    this.getAvailablePhonenumbertypes();
  }

  /**
   * @description Get from numbers.
   */
  getFromNumbers() {
    this.subscriptions.push(
      this.businessToolsService
        .getFromNumber()
        .pipe()
        .subscribe((res) => {
          this.fromNumbers = res.data;
        })
    );
  }

  toggleDropDown() {
    this.showDropDown = !this.showDropDown;
  }

  /**
   * @description Select country.
   */
  selectContry(country: ICountryItem) {
    this.isFilterChanged = true;
    this.selectedCountry = country;
    this.showDropDown = false;
    this.getAvailablePhonenumbertypes();
  }

  /**
   * @description Get available phone number.
   */
  findPhoneNumber() {
    const sendingData = {
      countryCode: this.selectedCountry ? this.selectedCountry.code : '',
      PhoneNumberType: this.fromNumberForm.controls.phoneNumberType.value
        ? this.fromNumberForm.controls.phoneNumberType.value
        : '',
      areaCode: this.fromNumberForm.controls.areaCode.value
        ? this.fromNumberForm.controls.areaCode.value
        : ''
    };
    this.subscriptions.push(
      this.businessToolsService.getAvailablePhnos(sendingData).subscribe(
        (res) => {
          if (res.success) {
            this.phnoArray = res.data;
            this.isFilterChanged = false;
          }
        },
        () => {
          this.phnoArray = [];
        }
      )
    );
  }

  /**
   * @description Buy phone number.
   */
  onBuyClicked(phnoDetails: IBuyPhonenumberDetailsModel) {
    const dialogueData = {
      phnoDetails: phnoDetails,
      mode: 'create'
    };
    const dialogRef = this.matDialogue.open(BuyPhonenumberModalComponent, {
      maxWidth: '400px',
      width: '93%',
      minHeight: '200px',
      data: dialogueData
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const SendingData = {
          phoneNumber: phnoDetails.numbers,
          phoneNumberType: phnoDetails.phoneNumberType,
          name: result.nickName
        };
        this.subscriptions.push(
          this.businessToolsService
            .buyPhoneNumber(SendingData)
            .subscribe((res) => {
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Phone number added successfully'
                };
                this._alertService.successAlert(data);
                this.headerservice.setHeaderValueChanged(true);
                this.getFromNumbers();
              }
            })
        );
      }
    });
  }

  /**
   * @description Delete phone number.
   */
  phoneNumberDelete(phnoDetails: IPhonenumberDetailsModel) {
    const alertData = {
      content:
        'Are you sure you are deleting phone number ' +
        phnoDetails.fromNumber +
        '?'
    };
    const alert = this._alertService.confirmAlert(alertData);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.businessToolsService.deletePhoneNumber(phnoDetails.id).subscribe(
            (res) => {
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Phone number deleted successfully'
                };
                this._alertService.successAlert(data);
                this.getFromNumbers();
              }
            },
            () => {
              this.getFromNumbers();
            }
          )
        );
      }
    });
  }

  /**
   * @description Get groups.
   */
  getGroups() {
    this.subscriptions.push(
      this.businessToolsService
        .getSmsGroups()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<IGroupDetails[]>;
          this.groups = response.data;
        })
    );
  }

  /**
   * @description Get entry messages.
   */
  getEntryMessages() {
    this.subscriptions.push(
      this.businessToolsService
        .getEntryMessages()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<IEntryMessage[]>;
          this.entrySettings = response.data;
        })
    );
  }

  /**
   * @description Add entry message settings.
   */
  addEntryMessageSettings() {
    if (!this.isLoading && this.entrySMSForm.valid) {
      this.isLoading = true;
      const sendingData = {
        entryCode: this.entrySMSForm.value.entryCode,
        fromNumber: this.entrySMSForm.value.fromNumber.id,
        groupId: this.entrySMSForm.value.group.id,
        message: this.entrySMSForm.value.replyMessage
      };
      this.subscriptions.push(
        this.businessToolsService
          .addEntryMessageSettings(sendingData)
          .subscribe(
            (res) => {
              this.isLoading = false;
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Entry message added successfully'
                };
                this._alertService.successAlert(data);
                this.settings = { id: 'groupentrylist' };
                this.getEntryMessages();
              }
            },
            () => {
              this.phnoArray = [];
              this.isLoading = false;
            }
          )
      );
    } else {
      this.entrySMSForm.markAllAsTouched();
    }
  }

  /**
   * @description Add codes to message.
   */
  addCodesToMessage(textToInject: string) {
    const message = this.entrySMSForm.controls.replyMessage.value;
    try {
      const messageTextAreaElement = document?.getElementById(
        'messagetext'
      ) as HTMLInputElement;
      const cursorPositionInTextArea: number =
        messageTextAreaElement.selectionStart!;
      this.entrySMSForm.controls.replyMessage.setValue(
        [
          message.slice(0, cursorPositionInTextArea),
          textToInject,
          message.slice(cursorPositionInTextArea)
        ].join('')
      );
      setTimeout(() => {
        messageTextAreaElement.setSelectionRange(
          cursorPositionInTextArea + textToInject.length,
          cursorPositionInTextArea + textToInject.length
        ); // sets textarea cursor
      }, 0); //to skip this digest cycle in angular meanwhlie  this.smsForm.controls.message.setValue will be executed
    } catch (err) {
      this.entrySMSForm.controls.replyMessage.setValue(message + textToInject);
    }
  }

  /**
   * @description Showing group details.
   */
  showGroupDetails() {
    this.isShowGroupDetails = true;
  }

  /**
   * @description Hide group details.
   */
  hideGroupDetails() {
    this.isShowGroupDetails = false;
  }

  /**
   * @description Open Group details component.
   */
  openCreateGroup() {
    const dialogRef = this.matDialogue.open(GroupDetailsComponent, {
      maxWidth: '800px',
      width: '93%',
      minHeight: '200px',
      data: { mode: 'create' }
    });
    dialogRef.afterClosed().subscribe((isRefresh) => {
      if (isRefresh) {
        this.getGroups();
      }
    });
  }

  /**
   * @description open modal for edit group details component.
   */
  editGroup(data: IGroupDetails) {
    const dialogRef = this.matDialogue.open(GroupDetailsComponent, {
      maxWidth: '800px',
      width: '93%',
      minHeight: '200px',
      data: { mode: 'details', groupData: data },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((isRefresh) => {
      if (isRefresh) {
        this.getGroups();
      }
    });
  }

  /**
   * @description Delete group entry sms delete.
   */
  groupEntrySMSListDelete(item: IEntryMessage) {
    const alertData = {
      content: 'Are you sure you are deleting this group entry SMS?'
    };
    const alert = this._alertService.confirmAlert(alertData);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.businessToolsService
            .deleteEntryMessages(item.id)
            .subscribe((res) => {
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Group entry SMS deleted successfully'
                };
                this._alertService.successAlert(data);
                this.getEntryMessages();
              }
            })
        );
      }
    });
  }

  /**
   * @description Get available phone number types.
   */
  getAvailablePhonenumbertypes() {
    this.subscriptions.push(
      this.businessToolsService
        .getAvailablePhonenumbertypes(this.selectedCountry.code)
        .subscribe((res) => {
          if (res?.success && res?.data.length > 0) {
            this.phnoTypes = res.data;
            this.fromNumberForm.controls.phoneNumberType.setValue(
              this.phnoTypes[0].phoneNumberType
            );
          } else {
            this.fromNumberForm.controls.phoneNumberType.reset();
            this.phnoTypes = [];
            const data = {
              title: 'Service not available!',
              content: 'SMS services are not available in this country',
              isOk: true,
              doneMsg: 'OK'
            };
            this._alertService.infoAlert(data);
            this.phnoArray = [];
          }
        })
    );
  }

  /**
   * @description Edit phone number name modal.
   */
  editPhoneNumberName(phnoDetails: IPhonenumberDetailsModel) {
    const dialogueData = {
      phnoDetails: phnoDetails,
      mode: 'edit'
    };
    const dialogRef = this.matDialogue.open(BuyPhonenumberModalComponent, {
      maxWidth: '400px',
      width: '93%',
      minHeight: '200px',
      data: dialogueData
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getFromNumbers();
      }
    });
  }

  /**
   * @description Update phone number validation.
   */
  updatePhoneNumberValidity(id: string) {
    this.subscriptions.push(
      this.businessToolsService
        .updatePhoneNumberValidity(id)
        .subscribe((res) => {
          if (res?.success) {
            const data = {
              title: 'Renewed!',
              content: 'Phonenumber validity extended',
              isOk: true,
              doneMsg: 'OK'
            };
            this._alertService.successAlert(data);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
