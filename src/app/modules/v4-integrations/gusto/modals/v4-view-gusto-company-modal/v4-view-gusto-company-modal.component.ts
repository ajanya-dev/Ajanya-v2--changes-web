import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  IConnectedCompanyList,
  IGustoCompanyData
} from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-view-gusto-company-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-view-gusto-company-modal.component.html',
  styleUrls: ['./v4-view-gusto-company-modal.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4ViewGustoCompanyModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  readonly data: { company: IConnectedCompanyList } = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  details = signal<IGustoCompanyData | null>(null);

  ngOnInit(): void {
    this.loadDetails();
  }

  loadDetails(): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.integrationService
      .viewCompanyData(this.data.company.companyId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        // The v3 endpoint returns IGustoCompanyData under `data` despite the
        // service typing it as IConnectedThirdPartyData. Cast accordingly.
        this.details.set(res?.data as unknown as IGustoCompanyData);
        this.cdr.markForCheck();
      });
  }
}
