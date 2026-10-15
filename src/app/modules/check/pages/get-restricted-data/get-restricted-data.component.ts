import { Component, inject } from '@angular/core';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

@Component({
  selector: 'app-get-restricted-data',
  templateUrl: './get-restricted-data.component.html',
  styleUrls: ['./get-restricted-data.component.scss'],
  standalone: true
})
export class GetRestrictedDataComponent {
  private _dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  enableNow() {
    this._dynamicWhiteLabelService.goToLiveChat();
  }
}
