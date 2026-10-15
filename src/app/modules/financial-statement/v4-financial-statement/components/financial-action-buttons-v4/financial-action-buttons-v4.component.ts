import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams, IRowNode } from '@ag-grid-community/core';
import { finalize, Subject, takeUntil } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { LUCIDE_ICONS_V4 } from 'src/app/shared/V4/lucide-icons';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DocumentMailService } from 'src/app/modules/business-tools/document-mail/services/document-mail.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IFinancialStatementRowData } from 'src/app/modules/financial-statement/model/financialstatement';

@Component({
  selector: 'app-financial-action-buttons-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip],
  template: `
    <div class="flex items-center h-full gap-1">
      @if (showEye) {
        <button
          type="button"
          class="action-icon-btn"
          matTooltip="View Details"
          (click)="onEyeClick($event)"
        >
          <lucide-icon name="eye" [size]="16" class="v4-action-icon" />
        </button>
      }
      @if (showDownload) {
        <button
          type="button"
          class="action-icon-btn"
          [matTooltip]="isDownloading() ? 'Downloading...' : 'Download Document'"
          (click)="onDownloadClick($event)"
          [disabled]="isDownloading()"
        >
          @if (isDownloading()) {
            <lucide-icon
              name="loader-circle"
              [size]="16"
              class="v4-action-icon animate-spin"
            />
          } @else {
            <lucide-icon
              name="arrow-down-to-line"
              [size]="16"
              class="v4-action-icon"
            />
          }
        </button>
      }
    </div>
  `
})
export class FinancialActionButtonsV4Component
  implements ICellRendererAngularComp, OnDestroy
{
  readonly icons = LUCIDE_ICONS_V4;

  private dataTableService = inject(DataTableService);
  private documentMailService = inject(DocumentMailService);
  private destroy$ = new Subject<void>();

  showEye = false;
  showDownload = false;
  isDownloading = signal(false);

  private rowData: IFinancialStatementRowData;
  private node: IRowNode;

  agInit(params: ICellRendererParams<IFinancialStatementRowData>): void {
    this.rowData = params.data as IFinancialStatementRowData;
    this.node = params.node;
    this.showEye = this.isEnableButton(this.rowData);
    this.showDownload = !!this.getDocumentEncId();
  }

  refresh(): boolean {
    return false;
  }

  onEyeClick(event: MouseEvent): void {
    event.stopPropagation();
    this.node.setSelected(false);
    this.dataTableService.setDataFromActionViewComp(
      this.rowData as unknown as Record<string, unknown>,
      'eye',
      DTTableId.financialStatement
    );
  }

  onDownloadClick(event: MouseEvent): void {
    event.stopPropagation();
    this.node.setSelected(false);

    const docId = this.getDocumentEncId();
    if (!docId || this.isDownloading()) return;

    this.isDownloading.set(true);
    this.documentMailService
      .downloadDocument(docId)
      .pipe(
        finalize(() => this.isDownloading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((val) => {
        if (val.success) {
          window.open(val.data.file_url, '_blank');
        }
      });
  }

  private getDocumentEncId(): string | undefined {
    return (this.rowData?.json_data as unknown as Record<string, unknown>)
      ?.document_enc_id as string | undefined;
  }

  private isEnableButton(item: IFinancialStatementRowData): boolean {
    if (!item) return false;

    if (
      item.operation_type === 25 &&
      item.has_json_data &&
      item.json_data?.invoice_id
    ) {
      return true;
    }

    if (item.action !== null) {
      return item.operation_type === 2 || item.operation_type === 3;
    }

    if (item.operation_type === 3) return true;
    if (item.operation_type === 2 && item.has_json_data) return true;

    return false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
