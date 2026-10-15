import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { NgClass, NgOptimizedImage, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { finalize, Subscription } from 'rxjs';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

@Component({
  standalone: true,
  selector: 'app-square',
  templateUrl: './square-integration.component.html',
  styleUrls: ['./square-integration.component.scss'],
  imports: [
    OcwBackButtonComponent,
    NgOptimizedImage,
    NgStyle,
    FontAwesomeModule,
    CustomerSupportComponent,
    NgClass
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SquareImportsComponent implements OnInit, OnDestroy {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  faChevronRight = faChevronRight;
  subscriptions: Subscription[] = [];

  isConnected = signal<boolean>(false);

  loading = {
    globalLoading: false,
    defaultLoading: false
  };

  isImportLoading = {
    customerImportLoading: false,
    vendorImportLoading: false,
    employeeImportLoading: false
  };

  ngOnInit(): void {
    this.getSquareData();
  }

  /**
   * Retrieves square integration data.
   */
  getSquareData(): void {
    if (this.loading.defaultLoading) {
      return;
    }
    this.loading.defaultLoading = true;
    this.loading.globalLoading = true;

    this.subscriptions.push(
      this.integrationService
        .getSquareDetails()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
            this.loading.globalLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (res.data.connected === 1) {
              this.isConnected.set(true);
            }
          }
        })
    );
  }

  connectToSquare() {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this.integrationService
        .getConnectionUrlForSquare()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            window.open(res?.data.url, '_self');
          }
        })
    );
  }

  onDisconnectSquare() {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this.integrationService
        .disconnectSquare()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.isConnected.set(false);
          }
        })
    );
  }

  import(type: number) {
    const payload = {
      type
    };
    if (type === 2) {
      this.isImportLoading.customerImportLoading = true;
    } else if (type === 3) {
      this.isImportLoading.vendorImportLoading = true;
    } else {
      this.isImportLoading.employeeImportLoading = true;
    }
    this.cdr.detectChanges();
    this.subscriptions.push(
      this.integrationService
        .importFromSquare(payload)
        .pipe(
          finalize(() => {
            this.isImportLoading = {
              customerImportLoading: false,
              vendorImportLoading: false,
              employeeImportLoading: false
            };
            this.cdr.detectChanges();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({ close: true });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
