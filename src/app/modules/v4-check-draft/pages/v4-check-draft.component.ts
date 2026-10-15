import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';

/**
 * @description Represents the CheckDraftComponent responsible for checking the draft status
 * and navigating to appropriate routes based on the status.
 */
@Component({
  template: '',
  standalone: true
})
export class V4CheckDraftComponent implements OnInit, OnDestroy {
  subsription: Subscription[] = [];
  constructor(
    private checkDraftService: CheckDraftService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCheckDraftCondtion();
  }

  /**
   * @description Fetches the draft status and navigates to the appropriate route based on the status.
   */
  getCheckDraftCondtion() {
    this.subsription.push(
      this.checkDraftService
        .getcheckDraftStatus()
        .pipe(catchError(() => of(false)))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .subscribe((res: any) => {
          if (res.success) {
            this.router.navigateByUrl('/v4/manage/checkdraft/index');
          } else {
            this.router.navigateByUrl('/v4/manage/checkdraft/index');
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subsription.forEach((el) => el.unsubscribe());
  }
}
