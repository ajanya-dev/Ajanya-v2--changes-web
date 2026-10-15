import { Component, computed, HostBinding, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { V4CheckDraftHeaderComponent } from '../../components/v4-check-draft-header/v4-check-draft-header.component';
import { V4CheckDraftListComponent } from '../v4-check-draft-list/v4-check-draft-list.component';
import { V4CheckDraftRecuriingChecksComponent } from '../v4-check-draft-recuriing-checks/v4-check-draft-recuriing-checks.component';

@Component({
  selector: 'app-v4-check-draft-index',
  standalone: true,
  imports: [CommonLayoutV4Component],
  templateUrl: './v4-check-draft-index.component.html'
})
export class V4CheckDraftIndexComponent implements OnInit, OnDestroy {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-[720px]';

  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private checkDraftService = inject(CheckDraftService);

  headerComponent = V4CheckDraftHeaderComponent;
  detailsComponent = computed(() =>
    this.checkDraftService.showRecurringList()
      ? V4CheckDraftRecuriingChecksComponent
      : V4CheckDraftListComponent
  );

  listviewComponent = computed(() =>
    this.checkDraftService.showRecurringList()
      ? V4CheckDraftRecuriingChecksComponent
      : null
  );

  ngOnInit(): void {
    this.commonLayoutToggleV4Service.gridView.set(false);
  }

  ngOnDestroy(): void {
    this.checkDraftService.showRecurringList.set(false);
  }
}
