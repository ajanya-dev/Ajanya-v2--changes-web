import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { ICheckDraftRecurringView } from '../../model/v4-Checkdraft';

@Component({
  selector: 'app-v4-check-draft-recurring-view',
  templateUrl: './v4-check-draft-recurring-view.component.html',
  styleUrls: ['./v4-check-draft-recurring-view.component.scss'],
  standalone: true,
  imports: [LucideAngularModule, MatTooltip]
})
export class V4CheckDraftRecurringViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private checkDraftService = inject(CheckDraftService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  viewData = signal<ICheckDraftRecurringView | null>(null);
  private id: string;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.getViewData();
  }

  getViewData() {
    this.checkDraftService
      .recurringView(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data) {
          this.viewData.set(res.data);
        }
      });
  }

  getStatus(status: number): string {
    return status === 1 ? 'Completed' : 'Pending';
  }

  clickToNav(num: number, checkId: number) {
    if (num === 1) {
      this.router.navigate([`/v4/manage/checkdraft/view/${checkId}`]);
    }
  }

  formatedDate(date: string): string | null {
    return this.datePipe.transform(date, 'MM/dd/yyyy');
  }

  goBack() {
    window.history.back();
  }
}
