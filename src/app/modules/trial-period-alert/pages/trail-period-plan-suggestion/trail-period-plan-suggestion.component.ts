import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

@Component({
  selector: 'app-trail-period-plan-suggestion',
  templateUrl: './trail-period-plan-suggestion.component.html',
  styleUrls: ['./trail-period-plan-suggestion.component.scss'],
  standalone: true
})
export class TrailPeriodPlanSuggestionComponent implements OnInit {
  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.getStats();
  }

  getStats() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.sharedService.getTrialExpiredStats().subscribe(() => {});
  }
}
