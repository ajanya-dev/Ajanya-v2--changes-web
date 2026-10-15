import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ComplianceFreezeModalComponent } from './compliance-freeze-modal/compliance-freeze-modal.component';
import {
  ComplianceFreezeV4Component,
  ComplianceFreezeV4ModalData
} from './compliance-freeze-v4/compliance-freeze-v4.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private isFrozenSubject = new BehaviorSubject<boolean>(false);
  isFrozen$ = this.isFrozenSubject.asObservable();
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  get isFrozen(): boolean {
    return this.isFrozenSubject.value;
  }

  setFreezeState(frozen: boolean): void {
    this.isFrozenSubject.next(frozen);
  }

  openComplianceFreezeModal(): void {
    const isV4 = this.localStorageService.getItem('isV4LayoutEnabled') === 1;
    if (isV4) {
      this.dialog.open<ComplianceFreezeV4Component, ComplianceFreezeV4ModalData>(
        ComplianceFreezeV4Component,
        {
          maxWidth: '720px',
          width: '90%',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { variant: 'modal' }
        }
      );
      return;
    }
    this.dialog.open(ComplianceFreezeModalComponent, {
      maxWidth: '720px',
      width: '90%',
      disableClose: true,
      panelClass: 'compliance-freeze-modal'
    });
  }
}
