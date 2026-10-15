import { finalize } from 'rxjs/operators';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Subscription } from 'rxjs';
import { DatePipe, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { IApplicationData } from 'src/app/modules/business-tools/plexe/model/plexe';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { RouterLink } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-plexe-document-form',
  templateUrl: './plexe-document-form.component.html',
  styleUrls: ['./plexe-document-form.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    RouterLink,
    NgIf
  ]
})
export class PlexeDocumentFormComponent implements OnInit, OnDestroy {
  @Output() nextStep = new EventEmitter<boolean>();
  @Input() applicationId: string;
  minDate: string;

  licenseForm: FormGroup;
  todayDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  subscription: Subscription[] = [];
  isLoading = false;

  constructor(
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private _plexeService: PlexeService,
    private _googleAddressService: GoogleAddressService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getMinDate();
  }

  /**
   * @description Get min date.
   *
   */
  getMinDate(): void {
    const currentDate = new Date();
    const minYear = currentDate.getFullYear() - 15;
    const minDate = new Date(minYear, 0, 1);
    this.minDate = minDate.toISOString().substring(0, 10);
  }

  /**
   * @description Initializes the form group for the license form.
   *
   */
  initForm(): void {
    this.licenseForm = this.fb.group({
      fullName: ['', [Validators.required]],
      licenseNumber: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      stateOfIssue: ['', [Validators.required]],
      expiryDate: ['', [Validators.required]]
    });
  }

  /**
   * @description Create licence form body.
   *
   */
  createFormBody(): IApplicationData {
    const data = this.licenseForm.value;
    return {
      name: data.fullName,
      address: data.address,
      city: data.city,
      dateOfBirth: data.dob,
      cardNumber: data.licenseNumber,
      issuingState: data.stateOfIssue,
      expiryDate: data.expiryDate
    };
  }

  /**
   * @description submit the license form.
   *
   */
  submit(): void {
    if (this.licenseForm.invalid) {
      this.licenseForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .addPrimaryDetails(this.applicationId, this.createFormBody())
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.nextStep.emit(true);
          }
        })
    );
  }

  /**
   * @description Loads google address api and update `licenseForm`.
   * @param address - payee address.
   */
  loadGoogleAddress(address: HTMLInputElement): void {
    this._googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.licenseForm.patchValue({
          address: res.address,
          city: res.city,
          stateOfIssue: res.state
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
