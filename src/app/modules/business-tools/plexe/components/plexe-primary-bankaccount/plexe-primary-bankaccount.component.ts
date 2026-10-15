import { finalize } from 'rxjs/operators';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Subscription } from 'rxjs';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy
} from '@angular/core';
import { IPrimaryBankData } from 'src/app/modules/business-tools/plexe/model/plexe';
import { RouterLink } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-plexe-primary-bankaccount',
  templateUrl: './plexe-primary-bankaccount.component.html',
  styleUrls: ['./plexe-primary-bankaccount.component.scss'],
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink]
})
export class PlexePrimaryBankaccountComponent implements OnInit, OnDestroy {
  @Output() nextStep = new EventEmitter<boolean>();
  @Input() applicationId: string;
  subscription: Subscription[] = [];
  bankList: IPrimaryBankData;
  isLoading = false;
  bankId: string;
  btnDisable = false;

  constructor(private _plexeService: PlexeService) {}

  ngOnInit(): void {
    this.getAllPrimaryBank();
  }

  /**
   * @description Get primary bank list.
   *
   */
  getAllPrimaryBank(): void {
    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .gePrimarytBankList(this.applicationId)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.bankList = res?.data;
          }
        })
    );
  }

  /**
   * @description select bank.
   *
   */
  selectBank(id: string): void {
    this.bankId = id;
  }

  /**
   * @description Set selected bank as primary bank.
   *
   */
  onSumbit(): void {
    const bankData = {
      bankId: this.bankId
    };

    this.btnDisable = true;
    this.subscription.push(
      this._plexeService
        .setPrimaryBank(this.applicationId, bankData)
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.nextStep.emit(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
