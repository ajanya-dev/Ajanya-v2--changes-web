import {
  Component,
  Input,
  OnChanges,
  SimpleChange,
  inject
} from '@angular/core';
import { ICheckDetailsData } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgIf, NgClass, NgFor, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-check-remittance',
  templateUrl: './check-remittance.component.html',
  styleUrls: ['./check-remittance.component.scss'],
  standalone: true,
  imports: [NgIf, NgClass, NgFor, CurrencyPipe]
})
export class CheckRemittanceComponent implements OnChanges {
  private _checkService = inject(CheckService);

  @Input() checkId: string;

  remittanceType: number;
  remittanceData: ICheckDetailsData['remittance'];
  total: number;

  ngOnChanges(changes: { [property: string]: SimpleChange }) {
    const checkId: SimpleChange = changes.checkId;
    if (checkId) {
      this.checkId = checkId.currentValue;
      this.loadRemittance();
    }
  }

  loadRemittance() {
    this._checkService.getChecksById(this.checkId).subscribe((res) => {
      this.remittanceData = res.data.remittance;
      this.remittanceType = res.data.remittance_type;
      this.total = res.data.remittanceTotalAmount;
    });
  }
}
