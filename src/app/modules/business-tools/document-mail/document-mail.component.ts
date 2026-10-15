import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subject, takeUntil } from 'rxjs';
import {faTrash} from '@fortawesome/pro-solid-svg-icons';
import { DocumentMailModalComponent } from './components/document-mail-modal/document-mail-modal.component';
import { V3DataTableService } from '../../v3-data-table/services/v3-data-table.service';
import { IDocumentMailDataTableRowData } from './models/document-mail.model';
import { UploadDocumentModalComponent } from './components/upload-document-modal/upload-document-modal.component';
import { DocumentMailFilesTableComponent } from './components/document-mail-files-table/document-mail-files-table.component';
import { DocumentsMailDataTableComponent } from './components/documents-mail-data-table/documents-mail-data-table.component';
import { CommonButtonV35Component } from '../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgClass } from '@angular/common';
import { DocumentMailService } from './services/document-mail.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { environment } from 'src/environments/environment';
import { HeaderService } from 'src/app/shared/service/header/header.service';

@Component({
  selector: 'app-document-mail',
  templateUrl: './document-mail.component.html',
  styleUrls: ['./document-mail.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    DocumentsMailDataTableComponent,
    DocumentMailFilesTableComponent,
    FaIconComponent,
    MatTooltipModule,
    DemoVideoComponent
  ]
})
export class DocumentMailComponent implements OnInit, OnDestroy {
  private matDialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);
  private documentMailService = inject(DocumentMailService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private headerService = inject(HeaderService);

  faTrash = faTrash;
  helpVideoSlug = environment.env_id === 'zilMoney' ? 'document_mailing_zil' : 'document_mailing_ocw';

  selectedRowData: IDocumentMailDataTableRowData[] = [];
  destroy$ = new Subject<boolean>();
  selectedTable: 'files' | 'mail' = 'files';

  ngOnInit(): void {
    if(history.state.source === 'Mailing Dashboard') {
      this.headerService.isSubHeaderVisible.next({ hidden: false, animation: false });
    }
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.selectedRowData = val.map((item) => item.data);
      });
  }

  /**
   * Opens the upload document modal using the MatDialog service.
   * @memberof DocumentMailComponent
   */
  onUpload() {
    this.matDialog.open(UploadDocumentModalComponent, {
      disableClose: true,
      width: '650px'
    });
  }

  /**
   * Opens the document mail modal based on the specified type.
   * Displays a warning if no rows are selected for normal mail or if more than 10 rows are selected.
   *
   * @param {'bulk' | 'normal'} type - Type of mail operation ('bulk' or 'normal').
   * @memberof DocumentMailComponent
   */
  onMail(type: 'bulk' | 'normal') {
    if (!this.selectedRowData.length && type === 'normal') {
      this.alertService.warningAlert({
        content: 'Please selecte at least one row'
      });
      return;
    }

    if (this.selectedRowData.length > 10 && type === 'normal') {
      this.alertService.warningAlert({
        content: 'Maximum allowed files are 10'
      });
      return;
    }

    this.matDialog.open(DocumentMailModalComponent, {
      disableClose: true,
      width: '1200px',
      autoFocus: false,
      data: {
        type,
        documents: this.selectedRowData
      }
    });
  }


    /**
   * @description This method is to delete multiple transactions (of any type)
   * from the payment table.
   */
    bulkDelete() {
      const ref = this.alertService.confirmAlert({
        content: 'Are you sure you want to delete these files?',
        cancelMsg: 'No, cancel',
        doneMsg: 'Yes'
      });
      ref.afterClosed().subscribe((mode) => {
        if (mode) {
          
          const  mailIds: string[] = [];
          let showError = false;
          this.selectedRowData?.forEach(
            (row: IDocumentMailDataTableRowData) => {
              if(row.status !== 0 ) {
                showError = true;
              }else{
                mailIds.push(row.id);
              }
            }
          );

          if (showError) {
            this.alertService.warningAlert({
              content: this.selectedRowData.length === 1
                ? "Selected File can't be deleted."
                : "Some of the Files can't be deleted."
            });
            this.removeRowSelectionData();
            return;
          }

          if (mailIds.length) {
            this.documentMailService.deleteMultipleDocuments(mailIds).subscribe((res) => {
              if(res.success) {
                this.alertService.successAlert({
                  content: 'Files deleted successfully'
                });
              }
            });
          }

          this.removeRowSelectionData();
          this.v3DataTableService.refreshV3DataTable();
          
        }
      });
    }



    removeRowSelectionData() {
      this.v3DataTableService.v3RowSelectionData = [];
      this.v3DataTableService.gridApi?.deselectAll();
    }
  

  changeTab(tab: typeof this.selectedTable) {
    if (this.selectedTable !== tab) {
      this.selectedTable = tab;
    }
  }

  onSendMail(){
    this.router.navigate(['/manage/business-tools/document-mail/add-attachment']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
