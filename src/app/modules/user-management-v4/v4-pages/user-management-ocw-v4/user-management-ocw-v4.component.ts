import { Component, HostBinding, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserHeaderV4Component } from '../../v4-components/user-header-v4/user-header-v4.component';
import { UserListV4Component } from '../../v4-components/user-list-v4/user-list-v4.component';
import { UserDetailsV4Component } from '../../v4-components/user-details-v4/user-details-v4.component';
import { UserDataTableV4Component } from '../../v4-components/user-data-table-v4/user-data-table-v4.component';

@Component({
  selector: 'app-user-management-ocw-v4',
  templateUrl: './user-management-ocw-v4.component.html',
  styleUrls: ['./user-management-ocw-v4.component.scss'],
  standalone: true,
  imports: [CommonLayoutV4Component]
})
export class UserManagementOcwV4Component implements OnInit, OnDestroy {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-[720px]';

  private userManagementService = inject(UserManagementV35Service);
  private localStorageService = inject(LocalStorageService);

  headerComponent = UserHeaderV4Component;
  listComponent = UserListV4Component;
  detailsComponent = UserDetailsV4Component;
  listviewComponent = UserDataTableV4Component;

  ngOnInit() {
    this.userManagementService.usersSearchTerm = '';
    this.userManagementService.loadUserDetails();
    this.userManagementService.checkEnabledPlugins();
  }

  ngOnDestroy() {
    this.localStorageService.removeItem('clientPermissionId');
  }
}
