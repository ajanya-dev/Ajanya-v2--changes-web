import { DatePipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { ICheckDraftRecurringView } from '../../model/Checkdraft';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description Component for viewing details of a recurring check draft.
 */
@Component({
  selector: 'app-check-draft-recurring-view',
  templateUrl: './check-draft-recurring-view.component.html',
  styleUrls: ['./check-draft-recurring-view.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, FaIconComponent, NgClass]
})
export class CheckDraftRecurringViewComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  isRecurrig = false;
  Id: string;
  viewData: ICheckDraftRecurringView;
  constructor(
    private route: ActivatedRoute,
    private checkDraftService: CheckDraftService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  /**
   * @description Initializes the component by retrieving the ID from the route parameter and fetching the view data.
   */
  ngOnInit(): void {
    this.Id = this.route.snapshot.paramMap.get('id') as string;
    this.getViewData();
  }

  /**
   * @description Fetches the recurring check draft's view data.
   */
  getViewData() {
    this.subscription.push(
      this.checkDraftService.recurringView(this.Id).subscribe((res) => {
        this.viewData = res.data;
      })
    );
  }

  /**
   * @description Maps the status number to its corresponding text representation.
   * @param status - The status number.
   * @returns - The corresponding status text.
   */
  getStatus(status: number) {
    if (status === 1) {
      return 'completed';
    } else {
      return 'pending';
    }
  }

  /**
   * @description Handles navigation based on the provided parameters.
   * @param num - The navigation action identifier.
   * @param check_id - The ID of the check draft.
   */
  clickToNav(num: number, check_id: number) {
    if (num === 1) {
      this.router.navigate([`/manage/checkdraft/view/${check_id}`]);
    } else {
      return;
    }
  }

  /**
   * @description Formats a date string using the datePipe service to `MM/dd/yyyy` format.
   * @param date - The date string to be formatted.
   * @returns - The formatted date string.
   */
  formatedDate(date: string) {
    return this.datePipe.transform(date, 'MM/dd/yyyy');
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el.unsubscribe());
  }
}
