import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { UserManagementListV35Component } from '../../components/user-management-list-v35/user-management-list-v35.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { CommonLayoutV35Component } from '../../../../layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { UsersActivityNewComponent } from '../../components/users-activity-new/users-activity-new.component';

@Component({
  selector: 'app-user-management-v35',
  templateUrl: './user-management-v35.component.html',
  styleUrls: ['./user-management-v35.component.scss'],
  standalone: true,
  imports: [CommonLayoutV35Component, AsyncPipe]
})
export class UserManagementV35Component implements OnInit, OnDestroy {
  private userManagementServiceV35 = inject(UserManagementV35Service);

  /**
   * Variables
   */
  listComponent = UserManagementListV35Component;
  detailsComponent = UsersActivityNewComponent;
  isActivityLoaded$: Observable<boolean>;
  isDateWiseActivityLoaded$: Observable<boolean>;
  loading$: Observable<{ default: boolean }>;

  ngOnInit(): void {
    this.isActivityLoaded$ = this.userManagementServiceV35.isActivityLoaded$;
    this.isDateWiseActivityLoaded$ =
      this.userManagementServiceV35.isDateWiseActivityLoaded$;
    this.loading$ = this.userManagementServiceV35.loading$;
  }

  ngOnDestroy(): void {
    this.userManagementServiceV35.ngOnDestroy();
  }
}
