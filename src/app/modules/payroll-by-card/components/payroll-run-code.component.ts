import { ICellRendererParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFile } from '@fortawesome/pro-solid-svg-icons';
import { Subscription, finalize } from 'rxjs';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtAttachComntArray } from '../../data-table/model/datatable';
import { PayrollService } from '../services/payroll.service';

@Component({
  standalone: true,
  selector: 'app-payroll-run-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, MatTooltip],
  template: `<span>{{ runCode }}</span>
    @if (isAttachmentsPresents()) {
      <fa-icon
        class="cursor-pointer text-common-blue-color ml-2"
        [icon]="faFile"
        (click)="openAttachment()"
        matTooltip="Payroll summary"
      ></fa-icon>
    }`
})
export class PayrollRunCodeComponent {
  private dataTableService = inject(DataTableService);
  private payrollService = inject(PayrollService);

  faFile = faFile;

  runCode: string = '';
  id: string;
  isAttachmentLoading = false;
  isAttachmentsPresents: Signal<IDtAttachComntArray | undefined>;
  subscriptions: Subscription[] = [];
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);

  agInit(params: ICellRendererParams) {
    if (params.data) {
      this.runCode = params.data.payroll_run_code;
      this.id = params.data.id;
    }
    this.getAttachmentStatus();
    this.isAttachmentsPresents = computed(() => {
      const isAttachmentsPresents = this.attachCommentList()?.filter(
        (res) => res.id === params.data.id
      )[0];
      return isAttachmentsPresents;
    });
  }

  openAttachment() {
    if (this.isAttachmentLoading) {
      return;
    }
    this.isAttachmentLoading = true;
    this.subscriptions.push(
      this.payrollService
        .getAttachment(this.id)
        .pipe(
          finalize(() => {
            this.isAttachmentLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            window.open(res.data, '_blank');
          }
        })
    );
  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList.set(res);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
