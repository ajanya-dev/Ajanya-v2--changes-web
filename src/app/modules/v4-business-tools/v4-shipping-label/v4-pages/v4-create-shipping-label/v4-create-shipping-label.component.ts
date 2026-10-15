import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  IShippingData,
  IToolTipDimension,
  ShippingSteps,
  shipOptions
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4DeliveryAddressStepComponent } from '../../v4-components/v4-delivery-address-step/v4-delivery-address-step.component';
import { V4FromAddressStepComponent } from '../../v4-components/v4-from-address-step/v4-from-address-step.component';
import { V4ExistingAddressStepComponent } from '../../v4-components/v4-existing-address-step/v4-existing-address-step.component';
import { V4PackageDetailsStepComponent } from '../../v4-components/v4-package-details-step/v4-package-details-step.component';
import { V4CheckoutStepComponent } from '../../v4-components/v4-checkout-step/v4-checkout-step.component';

interface IWizardStep {
  step: number;
  name: string;
  pages: ShippingSteps[];
}

@Component({
  selector: 'app-v4-create-shipping-label',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltip,
    V4DeliveryAddressStepComponent,
    V4FromAddressStepComponent,
    V4ExistingAddressStepComponent,
    V4PackageDetailsStepComponent,
    V4CheckoutStepComponent
  ],
  templateUrl: './v4-create-shipping-label.component.html'
})
export class V4CreateShippingLabelComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private shippingLabelService = inject(ShippingLabelService);
  private headerService = inject(HeaderService);
  private googleAddressService = inject(GoogleAddressService);

  subscriptions: Subscription[] = [];

  shippingData: IShippingData;
  pageId = signal<ShippingSteps>('delivery_address');

  shipOptions: shipOptions[] = [
    { name: 'Card', icon: 'credit-card' },
    { name: 'Letter', icon: 'mail' },
    { name: 'Soft Package', icon: 'package' },
    { name: 'Box', icon: 'box' }
  ];

  packageType = signal<string>('Card');

  /**
   * Card and Letter have predefined dimensions, so the wizard skips Package Details
   * for them. The row stays listed while the user is still on the earlier steps and
   * only drops out once the flow actually jumps ahead to Checkout.
   */
  isPackageStepSkipped = signal<boolean>(false);

  steps = computed<IWizardStep[]>(() => {
    const wizardSteps: IWizardStep[] = [
      {
        step: 1,
        name: 'Delivery Address',
        pages: ['delivery_address', 'existing_addr']
      },
      { step: 2, name: 'From Address', pages: ['from_address'] }
    ];
    if (!this.isPackageStepSkipped()) {
      wizardSteps.push({
        step: 3,
        name: 'Package Details',
        pages: ['package_page']
      });
    }
    wizardSteps.push({
      step: wizardSteps.length + 1,
      name: 'Checkout',
      pages: ['rate_page']
    });
    return wizardSteps;
  });

  currentStep = computed<number>(() => {
    const active = this.steps().find((item) =>
      item.pages.includes(this.pageId())
    );
    return active?.step ?? 1;
  });

  /** The package tiles are only selectable while on the first step. */
  isPackageSelectable = computed(
    () =>
      this.pageId() === 'delivery_address' || this.pageId() === 'existing_addr'
  );

  showPackageOptions = computed(
    () => this.pageId() !== 'package_page' && this.pageId() !== 'rate_page'
  );

  cardDimension = signal<IToolTipDimension | undefined>(undefined);
  letterDimension = signal<IToolTipDimension | undefined>(undefined);

  dimensionTooltip = computed(() => {
    const card = this.cardDimension();
    const letter = this.letterDimension();
    return (
      'By default, card and letter dimensions are set. ' +
      `For the card, dimensions are length (${card?.length}), width (${card?.width}), height (${card?.height}), and weight (${card?.weight}); ` +
      `for the letter, dimensions are length (${letter?.length}), width (${letter?.width}), height (${letter?.height}), and weight (${letter?.weight}). ` +
      'For soft packages and boxes, you can customize the dimensions.'
    );
  });

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: true,
      animation: false
    });
    this.getTooltipDimensions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * @description Select the package type to ship.
   */
  selectPackage(item: shipOptions): void {
    if (!this.isPackageSelectable()) return;
    this.packageType.set(item.name);
    if (!this.hasPredefinedDimensions(item.name)) {
      this.isPackageStepSkipped.set(false);
    }
  }

  /**
   * @description Get the emitted data from the active step.
   */
  getEmitedData(emited: IShippingData): void {
    if (!emited?.success) return;
    this.shippingData = emited;
    this.pageId.set(emited.data.nextStep);
    if (emited.data.packageType) {
      this.packageType.set(emited.data.packageType);
    }
    this.syncPackageStep(emited);
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * @description Drop the Package Details step once Card or Letter skips past it,
   * and restore it whenever a package type that needs dimensions is selected.
   */
  syncPackageStep(emited: IShippingData): void {
    if (this.hasPredefinedDimensions(this.packageType())) {
      if (emited.data.nextStep === 'rate_page') {
        this.isPackageStepSkipped.set(true);
      }
      return;
    }
    this.isPackageStepSkipped.set(false);
  }

  /**
   * @description Card and Letter dimensions are set by the server.
   */
  hasPredefinedDimensions(packageType: string): boolean {
    return packageType === 'Card' || packageType === 'Letter';
  }

  /**
   * @description Get the card and letter dimensions shown in the tooltip.
   */
  getTooltipDimensions(): void {
    this.subscriptions.push(
      this.shippingLabelService.getTooltipDimensions().subscribe((res) => {
        res.data?.forEach((item) => {
          if (item.package_code === 'Card') {
            this.cardDimension.set(item);
          }
          if (item.package_code === 'Letter') {
            this.letterDimension.set(item);
          }
        });
      })
    );
  }

  goToList(): void {
    this.router.navigate(['/v4/manage/business-tools/shipping-label']);
  }
}
