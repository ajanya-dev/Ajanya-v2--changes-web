import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import {
  IContactDetails2,
  IGroupDetails,
  IPhonenumberDetailsModel
} from 'src/app/modules/business-tools/model/business-tools-common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgFor, NgIf } from '@angular/common';
@Component({
  selector: 'app-quicksms',
  templateUrl: './quicksms.component.html',
  styleUrls: ['./quicksms.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    ControlMessageComponent,
    NgxMaskDirective,
    NgIf
  ]
})
export class QuicksmsComponent implements OnInit, OnDestroy {
  smsForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  groups: IGroupDetails[] = [];
  fromNumbers: IPhonenumberDetailsModel[] = [];
  isLoading: boolean;
  isShowGroupDetails: boolean;
  showDropDown: boolean;
  searchSubject = new Subject();
  contactList: IContactDetails2[];

  @HostListener('document:click')
  onOuterContainerClicked() {
    this.showDropDown = false;
  }

  constructor(
    private businessToolsService: BusinessToolsService,
    private _alertService: AlertService,
    private headerservice: HeaderService
  ) {}

  ngOnInit(): void {
    this.smsForm = new UntypedFormGroup({
      toNumber: new UntypedFormControl('', [
        Validators.required,
        ValidationService.phoneNumberValidator
      ]),
      fromNumber: new UntypedFormControl('', [Validators.required]),
      message: new UntypedFormControl('', [Validators.required])
    });
    this.getFromNumbers();
    this.initiateSearchDebounce();
  }

  /**
   * @description Initialise the search function.
   */
  initiateSearchDebounce() {
    this.searchSubject
      .pipe(debounceTime(1500))
      .subscribe((searchText: unknown) => {
        this.searchContacts(searchText as string);
      });
  }

  /**
   * @description Get from number.
   */
  getFromNumbers() {
    this.subscriptions.push(
      this.businessToolsService
        .getFromNumber()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<IPhonenumberDetailsModel[]>;
          this.fromNumbers = response.data;
        })
    );
  }

  /**
   * @description search event for contact search.
   */
  openContactSearch(event: PointerEvent) {
    event.stopPropagation();
    this.showDropDown = true;
    this.searchContacts('');
  }

  /**
   * @description Select contact.
   */
  selectDropDownItem(contact: IContactDetails2) {
    this.smsForm.controls.toNumber.setValue(contact.phone);
    this.showDropDown = false;
  }

  /**
   * @description Click to drop down.
   */
  onDropdownClicked(event: PointerEvent) {
    event.stopPropagation();
  }

  /**
   * @description Search by phone number or name.
   */
  onSearchInput(event: InputEvent) {
    if (event.target === null) return;
    const searchText = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchText);
  }

  /**
   * @description Search contacts function.
   */
  searchContacts(searchText: string) {
    const sendingData = {
      term: searchText,
      take: 20
    };
    this.subscriptions.push(
      this.businessToolsService
        .searchContacts(sendingData)
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<IContactDetails2[]>;
          this.contactList = response.data;
        })
    );
  }

  /**
   * @description Send message function.
   */
  sendMessage() {
    if (!this.isLoading && this.smsForm.valid) {
      this.isLoading = true;
      const sendingData = {
        fromNumber: this.smsForm.controls.fromNumber.value.fromNumber,
        toNumber: this.smsForm.controls.toNumber.value,
        message: this.smsForm.controls.message.value
      };
      this.subscriptions.push(
        this.businessToolsService.sendMessageSingle(sendingData).subscribe(
          (res) => {
            this.isLoading = false;
            if (res.success) {
              const alertData = {
                content: 'Message Sent Successfully',
                close: true,
                timeout: 1500
              };
              this._alertService.successAlert(alertData);
              this.smsForm.reset();
              this.headerservice.setHeaderValueChanged(true);
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
   * @description Get the remaining characters.
   */
  getMessageCoutText() {
    const charactersLeft = 160 - this.smsForm.controls.message.value.length;
    return charactersLeft + ' characters remaining';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
