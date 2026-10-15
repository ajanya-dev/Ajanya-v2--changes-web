import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { SelectedPaymentLink } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { IPaymentLinkAuditTrail, getChangedFields } from 'src/app/modules/payment-links/models/payment-links.model';
import {
  getPaymentLinkStatus,
  STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  PaymentLinksMethods
} from '../../models/v4-payment-links.model';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-view-details-drawer',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip, CommonButtonV4Component],
  templateUrl: './view-details-drawer.component.html',
  styleUrls: ['./view-details-drawer.component.scss']
})
export class ViewDetailsDrawerComponent {
  private clipboard = inject(Clipboard);
  private paymentLinkApiService = inject(PaymentLinkService);

  link = input.required<SelectedPaymentLink>();
  isArchived = input<boolean>(false);
  busy = input<boolean>(false);

  close = output<void>();
  edit = output<void>();
  duplicate = output<void>();
  share = output<void>();
  preview = output<void>();
  toggleStatus = output<boolean>();
  customizeNotification = output<void>();
  archive = output<void>();
  restoreLink = output<void>();

  copied = signal(false);
  PAYMENT_METHOD_CONFIG = PAYMENT_METHOD_CONFIG;

  private auditTrailResult = toSignal(
    toObservable(this.link).pipe(
      switchMap((l) =>
        this.paymentLinkApiService.getAuditTrail(l.id).pipe(
          map((res) => ({ loading: false, data: res.success ? res.data : [] })),
          startWith({ loading: true, data: [] as IPaymentLinkAuditTrail[] }),
          catchError(() => of({ loading: false, data: [] as IPaymentLinkAuditTrail[] }))
        )
      )
    ),
    { initialValue: { loading: true, data: [] as IPaymentLinkAuditTrail[] } }
  );

  auditTrailLoading = computed(() => this.auditTrailResult().loading);
  auditTrailList = computed(() => this.auditTrailResult().data);

  getChangedFields = getChangedFields;

  get fullUrl(): string {
    return `${StaticWhiteLabelConditions.paymentShortLink}/${this.link().shortUrl}`;
  }

  get isActive(): boolean {
    return getPaymentLinkStatus(this.link()) === 'active';
  }

  get statusConfig() {
    return STATUS_CONFIG[getPaymentLinkStatus(this.link())];
  }

  get paymentMethods(): PaymentLinksMethods[] {
    const methods: PaymentLinksMethods[] = ['CHECK'];
    const opts = this.link().paymentOptionAsArray;
    if (!opts) {
      if (this.link().creditCardFormToken) methods.push('CREDIT_CARD');
      return methods;
    }

    for (const key of Object.keys(opts)) {
      const opt = opts[key as `${number}`];
      if (opt && (opt.status === 1 || opt.status === '1')) {
        const id = Number(key);
        if (id === 1) methods.push('CREDIT_CARD');
        else if (id === 2) methods.push('PAYPAL');
        else if (id === 3) methods.push('BITPAY');
        else if (id === 4) methods.push('STRIPE');
      }
    }

    if (this.link().creditCardFormToken && !methods.includes('CREDIT_CARD')) {
      methods.push('CREDIT_CARD');
    }

    return methods;
  }

  copyUrl() {
    this.clipboard.copy(this.fullUrl);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  onToggle(active: boolean) {
    if (this.busy()) return;
    this.toggleStatus.emit(active);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('drawer-backdrop')) {
      this.close.emit();
    }
  }
}
