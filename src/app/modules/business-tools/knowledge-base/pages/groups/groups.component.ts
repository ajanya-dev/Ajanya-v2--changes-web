import { IGroups } from 'src/app/modules/business-tools/knowledge-base/model/knowledge-base';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IInfoAlert, ISuccessAlert } from 'src/app/models/alert';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { KnowledgeBaseService } from 'src/app/shared/service/knowledge-base/knowledge-base.service';
import { GroupModalComponent } from '../../modals/group-modal/group-modal.component';
import { Subscription } from 'rxjs';
import { NgIf, NgFor, JsonPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, RouterLinkActive, JsonPipe]
})
export class GroupsComponent implements OnInit, OnDestroy {
  constructor(
    public knowledgeBaseService: KnowledgeBaseService,
    public dialog: MatDialog,
    private _alertService: AlertService
  ) {}

  groups: IGroups[];
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.getGroupsData();
  }

  /**
   * @description Open Group modal.
   *
   */
  openGroupModal() {
    const dialogRef = this.dialog.open(GroupModalComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) this.getGroupsData();
    });
  }

  /**
   * @description Edit Group modal.
   *
   */
  openEditGroupModal(data: string) {
    const dialogRef = this.dialog.open(GroupModalComponent, {
      maxWidth: '430px',
      width: '95%',
      autoFocus: false,
      data: data
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) this.getGroupsData();
    });
  }

  /**
   * @description Delete confirmation.
   *
   */
  onDelete(id: string) {
    const data = {
      title: 'Are you sure you want to delete this group?',
      content: '',
      width: '370px',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };
    const response = this._alertService.confirmAlert(data);
    response.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteGroup(id);
      }
    });
  }

  /**
   * @description Delete group.
   *
   */
  deleteGroup(id: string) {
    this.knowledgeBaseService.deleteGroupById(id).subscribe((res) => {
      if (res.success) {
        this.openSuccessAlert();
        this.getGroupsData();
      }
    });
  }

  /**
   * @description Set status for group.
   *
   */
  setStatus(item: IGroups) {
    if (item.status === 'Active') {
      item.status = 'Inactive';
      this.updateArticle(item);
    } else {
      item.status = 'Active';
      this.updateArticle(item);
    }
  }

  /**
   * @description Edit article.
   *
   */
  updateArticle(item: IGroups) {
    this.knowledgeBaseService
      .updateStatus(this.statusFormBody(item.status), item.id)
      .subscribe((res) => {
        if (res.success) {
          this.getGroupsData();
        }
      });
  }

  /**
   * @description Remove loading spinner.
   *
   */
  removeLoadingSpinner() {
    const loadingSpinner = document.getElementById(
      'loading-spinner'
    ) as HTMLDivElement;
    loadingSpinner.style.display = 'none';
    const row = document.getElementById('remove-row') as HTMLDivElement;
    row.style.display = 'none';
  }

  /**
   * @description Creates group form body.
   *
   */
  groupsFormBody(item: IGroups) {
    return {
      id: item.id,
      group_name: item.group_name,
      status: item.status,
      short_description: item.short_description,
      orders: item.orders
    };
  }

  /**
   * @description Creates status form body.
   *
   */
  statusFormBody(status: string) {
    return {
      status: status
    };
  }

  /**
   * @description Get groups data.
   *
   */
  getGroupsData() {
    this.knowledgeBaseService.getGroups().subscribe((res) => {
      this.groups = res.data;
      this.removeLoadingSpinner();
    });
  }

  /**
   * @description Success Alert.
   *
   */
  openSuccessAlert(content?: string, _disable?: boolean, timeout?: number) {
    const data: ISuccessAlert = {
      title: 'Success!',
      content: content ? content : 'Group deleted',
      close: true,
      timeout: timeout ? timeout : 2000
    };
    return this._alertService.successAlert(data);
  }

  /**
   * @description Info alert.
   *
   */
  openInfoAlert(content?: string, _disable?: boolean, timeout?: number) {
    const data: IInfoAlert = {
      title: 'Coming Soon!',
      content: content ? content : '',
      close: true,
      timeout: timeout ? timeout : 2000
    };
    return this._alertService.infoAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
