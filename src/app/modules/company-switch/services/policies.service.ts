import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { BehaviorSubject, Observable,tap } from 'rxjs';
import { IPendingPolicy } from '../model/company-switch';
import { CompanySwitchRepository } from '../repository/companySwitch.repository';

@Injectable({
  providedIn: 'root'
})
export class PoliciesService {
  public localStorageService = inject(LocalStorageService);
  private companySwitchRepo = inject(CompanySwitchRepository);
  pendingPolicy = new BehaviorSubject<number>(0);

  getPolicyPending(): Observable<IPendingPolicy> {
    return this.companySwitchRepo.getPolicyPending().pipe(
      tap((res) => {
        this.pendingPolicy.next(res.pendingPolicy);
        this.localStorageService.setItem(
          'policyPending',
          res.pendingPolicy?.toString()
        );
      })
    );
  }
}
