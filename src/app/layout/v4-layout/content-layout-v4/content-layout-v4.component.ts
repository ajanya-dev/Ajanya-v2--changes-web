import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { PaymentsOutDetailPanelComponent } from 'src/app/modules/payments-v4/payments-out/components/payments-out-detail-panel/payments-out-detail-panel.component';
import { NpsService } from 'src/app/shared/service/nps/nps.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NpsV4Component } from 'src/app/modules/nps/components/nps-v4/nps-v4.component';
import { HeaderV4Component } from '../header-v4/header-v4.component';
import { SideBarV4Component } from '../side-bar-v4/side-bar-v4.component';
import { V4SidebarService } from '../services/v4-sidebar.service';

@Component({
  selector: 'app-content-layout-v4',
  templateUrl: './content-layout-v4.component.html',
  styleUrls: ['./content-layout-v4.component.scss'],
  standalone: true,
  imports: [
    SideBarV4Component,
    HeaderV4Component,
    RouterOutlet,
    PaymentsOutDetailPanelComponent
  ]
})
export class ContentLayoutV4Component implements OnInit, OnDestroy {
  private v4SidebarService = inject(V4SidebarService);
  private npsService = inject(NpsService);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);

  detailPanelService = inject(V4DetailPanelService);
  isCollapsed = computed(() => this.v4SidebarService.isCollapsed());

  private npsDialogRef: MatDialogRef<NpsV4Component> | null = null;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.subscriptions.push(
      this.npsService.getNPSVal().subscribe((show) => {
        if (show) {
          this.openNpsModal();
        } else {
          this.npsDialogRef?.close();
          this.npsDialogRef = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private openNpsModal(): void {
    if (this.npsDialogRef) return;

    const submitted = this.localStorageService.getItem('NPSVal');
    const remindLater = this.localStorageService.getItem('NpsRemind');
    if (submitted != null || remindLater != null) return;

    this.npsDialogRef = this.dialog.open(NpsV4Component, {
      width: '460px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      disableClose: true
    });

    this.npsDialogRef.afterClosed().subscribe(() => {
      this.npsDialogRef = null;
    });
  }
}
