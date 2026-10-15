import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { normalizeShopifyDomain } from 'src/app/shared/utils/shopify-domain.util';

/** Accepts `mystore`, `mystore.myshopify.com` or a full URL of either. */
const SHOPIFY_DOMAIN_PATTERN =
  /^(https?:\/\/)?[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\/?$/i;

@Component({
  selector: 'app-v4-shopify-domain-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    NgOptimizedImage,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-shopify-domain-modal.component.html'
})
export class V4ShopifyDomainModalComponent {
  private fb = inject(FormBuilder);
  private integrationService = inject(IntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;

  isLoading = false;

  shopForm = this.fb.group({
    shop: [
      '',
      [Validators.required, Validators.pattern(SHOPIFY_DOMAIN_PATTERN)]
    ]
  });

  /**
   * @description Resolves the Shopify authorize URL for the typed store and
   * hands the browser over to Shopify. Shopify builds its consent screen per
   * shop, so the domain has to be known before the redirect can be requested.
   */
  onSubmit(): void {
    this.shopForm.markAllAsTouched();
    if (this.shopForm.invalid) {
      this.changeDetector.markForCheck();
      return;
    }

    const shop = normalizeShopifyDomain(this.shopForm.getRawValue().shop ?? '');
    if (!shop) return;

    this.isLoading = true;

    this.integrationService
      .connectToShopify(shop)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.redirectUrl) {
            // Leave the button spinning and the modal open: handing over to
            // Shopify takes a few seconds, and closing first left the user on
            // an idle page that looked like the click had done nothing.
            window.open(res.redirectUrl, '_self');
            return;
          }
          this.stopLoading();
          this.alertService.failedAlert({
            content: 'Failed to get Shopify connection URL. Please try again.'
          });
        },
        error: () => {
          this.stopLoading();
          this.alertService.failedAlert({
            content: 'Failed to connect to Shopify. Please try again!'
          });
        }
      });
  }

  private stopLoading(): void {
    this.isLoading = false;
    this.changeDetector.markForCheck();
  }
}
