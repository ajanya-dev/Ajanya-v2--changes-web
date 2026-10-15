import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IDocumentMailDataTableRowData } from '../../../models/document-mail.model';
import { DocumentMailService } from '../../../services/document-mail.service';
import { DocumentMailStatementModalV4Component } from '../../modals/document-mail-statement-modal-v4/document-mail-statement-modal-v4.component';

@Component({
  selector: 'app-document-mail-table-action-v4',
  standalone: true,
  imports: [MatMenuTrigger, MatMenu, MatMenuItem, MatTooltip, LucideAngularModule],
  templateUrl: './document-mail-table-action-v4.component.html',
  styleUrl: './document-mail-table-action-v4.component.scss'
})
export class DocumentMailTableActionV4Component implements ICellRendererAngularComp {
  private matDialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private documentMailService = inject(DocumentMailService);
  private checkService = inject(CheckService);
  private destroyRef = inject(DestroyRef);

  params!: ICellRendererParams<IDocumentMailDataTableRowData>;

  agInit(params: ICellRendererParams<IDocumentMailDataTableRowData>): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams<IDocumentMailDataTableRowData>): boolean {
    return true;
  }

  getStatement(): void {
    this.documentMailService
      .getStatement(this.params.data?.id as string)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.matDialog.open(DocumentMailStatementModalV4Component, {
          width: '510px',
          maxWidth: '95%',
          panelClass: 'paddingless-modal-rounded',
          disableClose: false,
          autoFocus: false,
          data: { statements: res }
        });
      });
  }

  getTrackDetails(): void {
    this.documentMailService
      .getMailTrack(this.params.data?.id as string)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          if (res.data.trackingData.success) {
            this.checkService.openTrackingModal(
              res.data,
              'mail-doc',
              this.params.data?.id as string
            );
          } else if (res.data.trackingCode) {
            window.open(getMailTrackUrl(res.data.trackingCode), '_blank');
          } else {
            this.alertService.warningAlert({
              content: 'Tracking details are not available yet.'
            });
          }
        }
      });
  }
}
