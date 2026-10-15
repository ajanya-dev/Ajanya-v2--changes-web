import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { IGetComment } from 'src/app/models/common';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  CommonButtonV4Component
} from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule,
    CommonButtonV4Component,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-deposit-slip-comments-v4',
  templateUrl: './deposit-slip-comments-v4.component.html',
  styleUrls: ['./deposit-slip-comments-v4.component.scss']
})
export class DepositSlipCommentsV4Component implements OnInit {
  slipId = input<string>('');
  private v4AlertService = inject(V4AlertService);
  private sharedService = inject(SharedService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  listData: IGetComment[] = [];
  loading = false;
  comment = '';
  isLoading = signal(false);

  ngOnInit(): void {
    this.getComment();
  }

  createCommentBody() {
    return { comment: this.comment };
  }

  getComment() {
    this.isLoading.set(true);
    this.sharedService
      .getAllComments('deposit-slips', this.slipId())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.listData = res.data as IGetComment[];
          this.cdr.detectChanges();
        }
      });
  }

  onSubmit() {
    if (!this.comment) {
      this.v4AlertService.warningAlert({ content: 'Comment field is required.' });
      return;
    }

    this.loading = true;
    this.sharedService
      .addComment('deposit-slips', this.slipId(), this.createCommentBody())
      .pipe(
        finalize(() => { this.loading = false; }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.getComment();
        }
      });
    this.comment = '';
  }

  onDeleteComment(id: string) {
    const alert = this.v4AlertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to delete this deposit slip comment?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete it!'
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.sharedService
          .deleteComment('deposit-slips', 0, id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((apiRes) => {
            if (apiRes.success === true) {
              this.getComment();
              this.cdr.detectChanges();
            }
          });
      }
    });
  }
}
