import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { IAppState } from 'src/app/store/app-state.model';

@Component({
  selector: 'app-trail-period-alert-modal',
  templateUrl: './trail-period-alert-modal.component.html',
  styleUrls: ['./trail-period-alert-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogClose, NgOptimizedImage]
})
export class TrailPeriodAlertModalComponent implements OnInit {
  emailVerified?: number;
  phoneVerified?: number;

  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<TrailPeriodAlertModalComponent>);
  private store = inject(Store<IAppState>);

  ngOnInit(): void {
    this.store.select(selectUserVerification).subscribe((res) => {
      this.emailVerified = res?.email_verified ?? 0;
      this.phoneVerified = res?.phone_verified ?? 0;
    });
  }

  seePlans() {
    this.router.navigate(['manage/subscription/plan'], {
      state: { isFromTrial: 4 }
    });
      this.dialogRef.close();
  }
}
