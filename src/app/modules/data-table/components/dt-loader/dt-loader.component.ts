import { Component } from '@angular/core';
import { ILoadingCellRendererAngularComp } from '@ag-grid-community/angular';
import { ILoadingCellRendererParams } from '@ag-grid-community/core';

@Component({
  selector: 'app-dt-loader',
  templateUrl: './dt-loader.component.html',
  styleUrls: ['./dt-loader.component.scss'],
  standalone: true
})
export class DtLoaderComponent implements ILoadingCellRendererAngularComp {
  agInit(
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: ILoadingCellRendererParams & { loadingMessage: string } //eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}
}
