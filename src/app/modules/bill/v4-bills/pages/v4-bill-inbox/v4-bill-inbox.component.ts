import { Component, HostBinding } from '@angular/core';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { V4BillInboxHeaderComponent } from '../../components/v4-bill-inbox-header/v4-bill-inbox-header.component';
import { V4BillInboxListComponent } from '../../components/v4-bill-inbox-list/v4-bill-inbox-list.component';
import { V4BillInboxDetailsComponent } from '../../components/v4-bill-inbox-details/v4-bill-inbox-details.component';

@Component({
  selector: 'app-v4-bill-inbox',
  standalone: true,
  imports: [CommonLayoutV4Component],
  templateUrl: './v4-bill-inbox.component.html',
  styleUrls: ['./v4-bill-inbox.component.scss']
})
export class V4BillInboxComponent {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-[720px]';

  headerComponent = V4BillInboxHeaderComponent;
  listComponent = V4BillInboxListComponent;
  detailsComponent = V4BillInboxDetailsComponent;
}
