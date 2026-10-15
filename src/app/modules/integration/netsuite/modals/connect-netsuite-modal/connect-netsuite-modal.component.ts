import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject
} from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleLeft, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { Subscription, finalize } from 'rxjs';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AlertService } from '../../../../../shared/service/alert/alert.service';
import {
  INetSuiteConnectForm,
  INetsuiteConnectionPayload,
  INetsuiteOAuthConnectPayload,
  isNetsuiteLegacyTbaCustomer
} from '../../model/netsuite';

@Component({
  selector: 'app-connect-netsuite-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FontAwesomeModule,
    MatDialogModule,
    NgOptimizedImage,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './connect-netsuite-modal.component.html',
  styleUrl: './connect-netsuite-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectNetsuiteModalComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private integrationService = inject(NetsuiteIntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);

  subscription: Subscription[] = [];
  isLoading = false;
  isFirstSection = true;

  /**
   * True when the company is still provisioned for token based authentication,
   * in which case the modal renders the pre-OAuth connect flow.
   */
  isLegacyFlow = false;

  netSuiteForm: FormGroup<INetSuiteConnectForm> = this.fb.group({
    accountId: ['', [Validators.required]],
    // OAuth flow.
    clientId: ['', [Validators.required]],
    clientSecret: ['', [Validators.required]],
    // Legacy token based authentication flow.
    consumerKey: ['', [Validators.required]],
    secret: ['', [Validators.required]],
    token: ['', [Validators.required]],
    tokenSecret: ['', [Validators.required]]
  });

  faXmark = faXmark;
  faAngleLeft = faAngleLeft;

  constructor() {
    // Read the already loaded header snapshot; no extra request on open.
    // eslint-disable-next-line no-underscore-dangle
    const headerData = this.headerService._headerData.value;
    this.isLegacyFlow = isNetsuiteLegacyTbaCustomer(
      headerData ? headerData.enabledPlugins : undefined
    );
    // Only the active flow's controls take part in validation.
    const inactiveControls = this.isLegacyFlow
      ? ['clientId', 'clientSecret']
      : ['consumerKey', 'secret', 'token', 'tokenSecret'];
    inactiveControls.forEach((name) => this.netSuiteForm.get(name)?.disable());
  }

  /**
   * @description Handles form submission for connecting to Netsuite.
   */
  onSubmit(): void {
    if (this.isFirstSection) {
      if (this.netSuiteForm.controls.accountId.invalid) {
        this.netSuiteForm.controls.accountId.markAsTouched();
        return;
      }
      this.isFirstSection = false;
    } else {
      this.netSuiteForm.markAllAsTouched();
      if (this.netSuiteForm.invalid) return;
      this.isLoading = true;
      if (this.isLegacyFlow) {
        this.connectWithTokenAuth();
      } else {
        this.connectWithOAuth();
      }
    }
  }

  /**
   * @description Connects using the legacy token based authentication
   * credentials. Kept for companies on the legacy NetSuite plugins.
   */
  private connectWithTokenAuth(): void {
    const formValue = this.netSuiteForm.value;
    const body: INetsuiteConnectionPayload = {
      accountId: formValue.accountId,
      consumerKey: formValue.consumerKey,
      consumerSecret: formValue.secret,
      token: formValue.token,
      tokenSecret: formValue.tokenSecret
    } as INetsuiteConnectionPayload;
    this.subscription.push(
      this.integrationService
        .onConnectNetSuite(body)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.changeDetector.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
            this.alertService.successAlert({
              content: 'Successfully Connected.'
            });
          }
          this.isFirstSection = true;
        })
    );
  }

  /**
   * @description Starts the OAuth connection and redirects the browser to the
   * NetSuite authorization page returned by the API.
   */
  private connectWithOAuth(): void {
    const formValue = this.netSuiteForm.value;
    const body: INetsuiteOAuthConnectPayload = {
      accountId: formValue.accountId,
      clientId: formValue.clientId,
      clientSecret: formValue.clientSecret
    } as INetsuiteOAuthConnectPayload;
    this.subscription.push(
      this.integrationService
        .connectNetSuiteOAuth(body)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.changeDetector.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res.success && res.data?.url) {
            window.location.href = res.data.url;
          }
        })
    );
  }

  /**
   * @description Show the first section of modal.
   */
  onBack() {
    this.isFirstSection = true;
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
