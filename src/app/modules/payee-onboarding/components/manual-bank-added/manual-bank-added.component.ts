import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

@Component({
  selector: 'app-manual-bank-added',
  templateUrl: './manual-bank-added.component.html',
  styleUrls: ['./manual-bank-added.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ManualBankAddedComponent implements OnInit {

  private localStorageService = inject(LocalStorageService);

  ngOnInit(): void {
    this.localStorageService.removeItem('payeePasswordSet');
  }
}
