import { Component } from '@angular/core';
import { INoRowsOverlayParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';

/**
 * @description a custom no rows to show overlay for ag grid. can pass a message as param to the class with noRowsOverlayComponentParams property of ag grid.
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-v3-no-rows-to-show-overlay',
  templateUrl: './v3-no-rows-to-show-overlay.component.html'
})
export class V3NoRowsToShowOverlayComponent {
  public params: INoRowsOverlayParams & { noRowsMessageFunc: () => string };

  agInit(
    params: INoRowsOverlayParams & { noRowsMessageFunc: () => string }
  ): void {
    this.params = params;
  }
}
