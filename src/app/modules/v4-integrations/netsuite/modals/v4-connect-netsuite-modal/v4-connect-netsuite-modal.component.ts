import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule, ArrowLeft, X } from 'lucide-angular';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import {
  INetSuiteConnectForm,
  INetsuiteConnectionPayload,
  INetsuiteOAuthConnectPayload,
  isNetsuiteLegacyTbaCustomer
} from 'src/app/modules/integration/netsuite/model/netsuite';

@Component({
  selector: 'app-v4-connect-netsuite-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-connect-netsuite-modal.component.html',
  styleUrl: './v4-connect-netsuite-modal.component.scss'
})
export class V4ConnectNetsuiteModalComponent {
  private fb = inject(FormBuilder);
  private integrationService = inject(NetsuiteIntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<V4ConnectNetsuiteModalComponent>);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);

  readonly XIcon = X;
  readonly ArrowLeftIcon = ArrowLeft;

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

  onSubmit(): void {
    if (this.isFirstSection) {
      if (this.netSuiteForm.controls.accountId.invalid) {
        this.netSuiteForm.controls.accountId.markAsTouched();
        this.changeDetector.markForCheck();
        return;
      }
      this.isFirstSection = false;
      this.changeDetector.markForCheck();
      return;
    }

    this.netSuiteForm.markAllAsTouched();
    if (this.netSuiteForm.invalid) {
      this.changeDetector.markForCheck();
      return;
    }

    this.isLoading = true;
    if (this.isLegacyFlow) {
      this.connectWithTokenAuth();
    } else {
      this.connectWithOAuth();
    }
  }

  /**
   * @description Connects using the legacy token based authentication
   * credentials. Kept for companies on the legacy NetSuite plugins.
   */
  private connectWithTokenAuth(): void {
    const formValue = this.netSuiteForm.getRawValue();
    const body: INetsuiteConnectionPayload = {
      accountId: formValue.accountId ?? '',
      consumerKey: formValue.consumerKey ?? '',
      consumerSecret: formValue.secret ?? '',
      token: formValue.token ?? '',
      tokenSecret: formValue.tokenSecret ?? ''
    };

    this.integrationService
      .onConnectNetSuite(body)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(true);
          this.alertService.successAlert({
            content: 'Successfully Connected.',
            close: true
          });
        }
        this.isFirstSection = true;
        this.changeDetector.markForCheck();
      });
  }

  /**
   * @description Starts the OAuth connection and redirects the browser to the
   * NetSuite authorization page returned by the API.
   */
  private connectWithOAuth(): void {
    const formValue = this.netSuiteForm.getRawValue();
    const body: INetsuiteOAuthConnectPayload = {
      accountId: formValue.accountId ?? '',
      clientId: formValue.clientId ?? '',
      clientSecret: formValue.clientSecret ?? ''
    };

    this.integrationService
      .connectNetSuiteOAuth(body)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data?.url) {
          window.location.href = res.data.url;
        }
      });
  }

  onBack(): void {
    this.isFirstSection = true;
    this.changeDetector.markForCheck();
  }
}
