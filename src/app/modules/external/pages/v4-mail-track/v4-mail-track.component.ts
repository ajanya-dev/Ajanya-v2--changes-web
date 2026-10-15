import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
  signal,
  computed
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ITrackingDetails } from '../../external-interface';
import { ExternalService } from '../../external-service';

interface ProgressStep {
  label: string;
  icon: string;
  isComplete: boolean;
  isActive: boolean;
}

const STATUS_ORDER = ['pre_transit', 'in_transit', 'out_for_delivery', 'delivered'];

@Component({
  selector: 'app-v4-mail-track',
  templateUrl: './v4-mail-track.component.html',
  styleUrls: ['./v4-mail-track.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    NgOptimizedImage,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4MailTrackComponent implements OnInit {
  private externalService = inject(ExternalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private destroyRef = inject(DestroyRef);

  trackingDetails = signal<ITrackingDetails | null>(null);
  isLoading = signal(true);
  isError = signal(false);
  isDownloading = signal(false);

  private trackingCode: string | undefined;

  shipmentDetails = computed(() => {
    const details = this.trackingDetails()?.tracking_details;
    return details ? [...details].reverse() : [];
  });

  themeConfig = computed(() => {
    const isOttimate = this.trackingDetails()?.shipment?.user_id === 834703;
    return {
      brandCssVar: isOttimate ? 'var(--ottimate-color)' : 'var(--v4-common-green-color)',
      logoUrl: isOttimate
        ? '/assets/images/mail-track/OttimateMailLogo.png'
        : '/assets/images/mail-track/ocwMailLogo.svg',
      isOttimate
    };
  });

  currentStatus = computed(() => this.trackingDetails()?.shipment?.current_status ?? null);

  progressSteps = computed<ProgressStep[]>(() => {
    const status = this.currentStatus();
    const statusIndex = status ? STATUS_ORDER.indexOf(status) : -1;

    return [
      { label: 'Pre-Transit', icon: 'package', isComplete: statusIndex > 0, isActive: statusIndex === 0 },
      { label: 'In Transit', icon: 'truck', isComplete: statusIndex > 1, isActive: statusIndex === 1 },
      { label: 'Out for Delivery', icon: 'map-pin', isComplete: statusIndex > 2, isActive: statusIndex === 2 },
      { label: 'Delivered', icon: 'circle-check', isComplete: statusIndex >= 3, isActive: statusIndex === 3 }
    ];
  });

  progressPercent = computed(() => {
    const status = this.currentStatus();
    const statusIndex = status ? STATUS_ORDER.indexOf(status) : -1;
    if (statusIndex <= 0) return 0;
    return (statusIndex / (STATUS_ORDER.length - 1)) * 100;
  });

  ngOnInit(): void {
    this.trackingCode = this.route.snapshot.paramMap.get('tracking_code') || undefined;

    if (!this.trackingCode) {
      this.isLoading.set(false);
      this.isError.set(true);
      return;
    }

    this.externalService
      .getMailTrackingData(this.trackingCode)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.status_code === 200) {
          this.trackingDetails.set(res);
        } else {
          this.isError.set(true);
        }
      });
  }

  goHome(): void {
    this.router.navigate(['v4/manage/payments-v4/payments-out/detailed/check']);
  }

  openChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  convertToReadable(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  downloadPod(): void {
    if (!this.trackingCode) return;
    this.isDownloading.set(true);
    this.externalService
      .downloadProof(this.trackingCode)
      .pipe(
        finalize(() => this.isDownloading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data);
        }
      });
  }
}
