import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { PlaidModalComponent } from '../components/plaid-modal/plaid-modal.component';

@Injectable({
  providedIn: 'root'
})
export class PlaidHelperService {

  private dialog = inject(MatDialog);

  openPlaidModal(data?: { isVerify: boolean,selectedBankId:string;page?:string;sourceType?:number;isV4?:boolean }): Observable<any> {

    return this.dialog.open<any>(PlaidModalComponent, {
      width: '360px',
      height: '600px',
      disableClose: true,
      panelClass: 'plaid-modal',
      data: {
        isVerify: data?.isVerify,
        selectedBankId:data?.selectedBankId,
        page:data?.page,
        sourceType:data?.sourceType || 1,
        isV4:data?.isV4
      }
    }).afterClosed();
  }

}
