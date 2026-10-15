import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog, MatDialogActions } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { AchEmailModalComponent } from '../../modals/ach-email-modal/ach-email-modal.component';
import { AchPreviewModalComponent } from '../../modals/ach-preview-modal/ach-preview-modal.component';
import { IApiRes } from 'src/app/models/api';
import { IBankDropdown } from 'src/app/models/bank';
import { NgIf } from '@angular/common';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

/**
 * @description Component for ACH authorization form.
 */
@Component({
  selector: 'app-ach-authorization',
  templateUrl: './ach-authorization.component.html',
  styleUrls: ['./ach-authorization.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    OcwPreventMultiClickDirective,
    NgIf
  ]
})
export class AchAuthorizationComponent implements OnInit, OnDestroy {
  achForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  loading = false;
  disableSaveAndPreviewBtn = false;
  disableSaveAndEmailBtn = false;
  id: string;
  abc: string;
  digitalSign: string;

  constructor(
    public activatedRoute: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private achService: AchService,
    private __dialog: MatDialog,
    private _sharedService: SharedService
  ) {
    // this.id=this.router.getCurrentNavigation()?.extras.state?.data;
    this.activatedRoute.queryParams.subscribe((data) => {
      this.id = data.ba;
    });
  }

  ngOnInit(): void {
    this.initForm();
    if (this.id !== null) {
      this._sharedService.setNewBankCreatedData({ bankAccountId: this.id });
      this.achForm.controls.bankAccount.setValue(this.id);
    }
  }

  /**
   * @description Initializes the ach form.
   */
  initForm() {
    this.achForm = this.fb.group({
      bankAccount: ['', [Validators.required]],
      to: ['', [Validators.required, ValidationService.noWhitespaceValidator]],
      fullName: ['', [Validators.required, ValidationService.noWhitespaceValidator]],
      title: ['', [Validators.required, ValidationService.noWhitespaceValidator]],
      digitalSign: ['', [Validators.required, ValidationService.noWhitespaceValidator]]
    });
  }

  /**
   * @description Creates the ach form body object and returns it.
   * @returns ach form body object.
   */
  achFormBody() {
    const data = this.achForm.value;
    return {
      bankaccount_id: data.bankAccount,
      authorize_name: data.to,
      fullname: data.fullName,
      title: data.title,
      digital_signature: data.digitalSign
    };
  }

  /**
   * @description Posts the ach form data the `sendAchForm` method of ach service and previews the pdf generated.
   */
  saveAndPreview() {
    this.achForm.markAllAsTouched();

    if (this.achForm.invalid) {
      return;
    }
    this.disableSaveAndEmailBtn = true;
    const processedData = this.achFormBody();

    this.subscriptions.push(
      this.achService
        .sendAchForm(processedData)
        .pipe(
          finalize(() => {
            this.disableSaveAndPreviewBtn = false;
          }),
          catchError((error) => {
            if (error) {
              this.disableSaveAndEmailBtn = false;
            }
            return of(false);
          })
        )
        .subscribe((response) => {
          const res = response as IApiRes<{ form_id: string }>;
          this.abc = res.data.form_id;
          if (res.success) {
            this.subscriptions.push(
              this.achService
                .previewAchForm(res.data.form_id)
                .pipe(
                  finalize(() => {
                    this.disableSaveAndEmailBtn = false;
                  })
                )
                .subscribe((res) => {
                  this.__dialog.open(AchPreviewModalComponent, {
                    maxWidth: '800px',
                    width: '100%',
                    height: '100%',
                    disableClose: false,
                    autoFocus: false,
                    data: res.data.url
                  });
                  this.achForm.controls.to.reset('');
                  this.achForm.controls.fullName.reset('');
                  this.achForm.controls.title.reset('');
                  this.achForm.controls.digitalSign.reset('');
                  this.digitalSign = '';
                })
            );
          }
        })
    );
  }

  /**
   * @description Posts the ach form body data to the `sendAchForm` method of ach service and opens email dialog.
   */
  saveAndEmail() {
    this.achForm.markAllAsTouched();

    if (this.achForm.invalid) {
      return;
    }
    this.disableSaveAndPreviewBtn = true;
    const processedData = this.achFormBody();

    this.subscriptions.push(
      this.achService
        .sendAchForm(processedData)
        .pipe(
          finalize(() => {
            this.disableSaveAndPreviewBtn = false;
            this.disableSaveAndEmailBtn = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const dialogRef = this.__dialog.open(AchEmailModalComponent, {
              //open modal
              maxWidth: '400px',
              width: '100%',
              disableClose: true,
              autoFocus: false,
              data: res.data.form_id
            });

            dialogRef.afterClosed().subscribe((modalResponse) => {
              if (modalResponse !== false) {
                this.achForm.controls.to.reset('');
                this.achForm.controls.fullName.reset('');
                this.achForm.controls.title.reset('');
                this.achForm.controls.digitalSign.reset('');
                this.digitalSign = '';
              }
              if (this.id == undefined) {
                this._sharedService.setNewBankCreatedData();
              }
            });
          }
        })
    );
  }

  /**
   * Sets the bank account from drop down selection.
   * @param event - bank drop down selection event.
   */
  onSelect(event: IBankDropdown) {
    this.achForm.controls.bankAccount.markAsTouched();
    this.achForm.controls.bankAccount.setValue(event?.id);
  }

  /**
   * @description Creates the digital sign from the input.
   * @param event - keyup event.
   */
  onKeyUp(event: Event) {
    this.digitalSign = (event.target as HTMLInputElement).value;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
