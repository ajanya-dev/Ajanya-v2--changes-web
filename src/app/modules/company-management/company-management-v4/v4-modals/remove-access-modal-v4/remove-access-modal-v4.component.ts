import { Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  DOUBLE_SIDE_MODAL_DATA,
  DOUBLE_SIDE_MODAL_REF
} from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';

@Component({
  selector: 'app-remove-access-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './remove-access-modal-v4.component.html'
})
export class RemoveAccessModalV4Component {
  public data = inject(DOUBLE_SIDE_MODAL_DATA) as {
    companyName: string;
    action: 'remove-access' | 'cancel-deletion';
  };

  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);

  get title(): string {
    return this.data.action === 'cancel-deletion'
      ? 'Cancel Deletion'
      : 'Remove Access';
  }

  get message(): string {
    if (this.data.action === 'cancel-deletion') {
      return `Are you sure you want to cancel the deletion of "${this.data.companyName}"?`;
    }
    return `Are you sure you want to remove your access to "${this.data.companyName}"? You will no longer be able to view or manage this company.`;
  }

  confirm(): void {
    this.modalRef.close({ confirmed: true });
  }

  close(): void {
    this.modalRef.close();
  }
}
