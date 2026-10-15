import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgStyle, NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-create-gusto-new-company-modal',
  templateUrl: './create-gusto-new-company-modal.component.html',
  styleUrls: ['./create-gusto-new-company-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgStyle,
    NgIf
  ]
})
export class CreateGustoNewCompanyModalComponent implements OnInit, OnDestroy {
  /**
   * Loading state flag.
   */
  loading = false;

  /**
   * UntypedFormGroup for the new company form.
   */
  newCompanyForm: UntypedFormGroup;

  /**
   * Array to store subscriptions.
   */
  subscriptions: Subscription[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private _integrationService: IntegrationService,
    private _matDiologRef: MatDialogRef<CreateGustoNewCompanyModalComponent>
  ) {}

  /**
   * Initializes the component and the form group.
   */
  ngOnInit(): void {
    this.initFormGroup();
  }

  /**
   * Initializes the form group with validation rules.
   */
  initFormGroup(): void {
    this.newCompanyForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      emailAddress: [
        '',
        [Validators.required, ValidationService.emailValidator]
      ],
      companyName: ['', Validators.required]
    });
  }

  /**
   * Handles the form submission and creates a new Gusto company.
   */
  submit(): void {
    this.newCompanyForm.markAllAsTouched();
    if (this.newCompanyForm.invalid) {
      return;
    }
    this.createGustoCompanies();
  }

  /**
   * Constructs the request body for creating a Gusto company.
   * @returns The request body containing user and company information.
   */
  createCompanyBody() {
    const data = this.newCompanyForm.value;
    return {
      user: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.emailAddress
      },
      company: {
        name: data.companyName
      }
    };
  }

  /**
   * Creates a new Gusto company using the provided data.
   */
  createGustoCompanies(): void {
    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .createGustoCompanies(this.createCompanyBody())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            this._matDiologRef.close(true);
          }
        })
    );
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
