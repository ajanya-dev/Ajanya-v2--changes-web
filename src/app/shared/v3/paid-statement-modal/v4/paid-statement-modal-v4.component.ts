import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { IPaidStatement } from 'src/app/models/payment-switch-board';
import { PsbService } from 'src/app/shared/service/psb/psb.service';

@Component({
  selector: 'app-paid-statement-modal-v4',
  templateUrl: './paid-statement-modal-v4.component.html',
  styleUrls: ['./paid-statement-modal-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogClose, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaidStatementModalV4Component implements OnInit, OnDestroy {
  private psbService = inject(PsbService);
  private changeDetection = inject(ChangeDetectorRef);
  public data: { uuid: string } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

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
