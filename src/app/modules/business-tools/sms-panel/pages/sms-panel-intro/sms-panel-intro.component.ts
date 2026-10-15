import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-sms-panel-intro',
  templateUrl: './sms-panel-intro.component.html',
  styleUrls: ['./sms-panel-intro.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class SmsPanelIntroComponent implements OnInit {
  private _dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  subscriptions: Subscription[] = [];
  requestStatus = 3;
  isLoading: boolean;
  isEnabled: boolean;
  constructor(
    private businessToolsService: BusinessToolsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkIsSMSEnabled();
  }

  /**
   * @description checking sms is enabled or not
   */
  checkIsSMSEnabled() {
    this.businessToolsService.getSmsEnable().subscribe((result) => {
      if (
        result.success &&
        (result?.data?.smsEnable == 1 || result?.data?.smsEnable == 2)
      ) {
        this.isEnabled = true;
        this.router.navigate(['/manage/business-tools/sms-panel']);
      }
    });
  }

  /**
   * @description Requesting to sms enable.
   */
  showRequested() {
    this._dynamicWhiteLabelService.goToLiveChat();
  }
}
