import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { LucideAngularModule, X, Check } from 'lucide-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IAppState } from 'src/app/store/app-state.model';

@Component({
  selector: 'app-trail-period-alert-modal-v4',
  templateUrl: './trail-period-alert-modal-v4.component.html',
  styleUrls: ['./trail-period-alert-modal-v4.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component]
})
export class TrailPeriodAlertModalV4Component implements OnInit, OnDestroy {
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly features = [
    'Keep your payees & history',
    'ACH, wire & check payments',
    'Unlimited check creation',
    'Bulk pay with approvals'
  ];

  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<TrailPeriodAlertModalV4Component>);
  private store = inject(Store<IAppState>);

  ngOnInit(): void {
    this.store.select(selectUserVerification).pipe(takeUntil(this.destroy$)).subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  subscribe(): void {
    this.router.navigate(['manage/subscription/plan'], { state: { isFromTrial: 4 } });
    this.dialogRef.close();
  }
}
