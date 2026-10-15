import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription } from 'rxjs';
import { IPaidStatement } from 'src/app/models/payment-switch-board';
import { PsbService } from 'src/app/shared/service/psb/psb.service';

@Component({
  selector: 'app-paid-statement-modal',
  templateUrl: './paid-statement-modal.component.html',
  styleUrls: ['./paid-statement-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaidStatementModalComponent implements OnInit, OnDestroy {
  private psbService = inject(PsbService);
  private changeDetection = inject(ChangeDetectorRef);
  public data: { uuid: string } = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  statements: IPaidStatement[];

  ngOnInit(): void {
    this.getStatements();
  }

  getStatements() {
    this.subscriptions.push(
      this.psbService.getPaidStatements(this.data?.uuid).subscribe((res) => {
        if (res?.success) {
          this.statements = res.data;
          this.changeDetection.markForCheck();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
