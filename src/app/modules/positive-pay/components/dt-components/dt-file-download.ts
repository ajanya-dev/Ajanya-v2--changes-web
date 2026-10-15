import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

@Component({
  selector: 'app-file-download',
  template: `<a
    role="presentation"
    class="cursor-pointer text-common-blue-color"
    (click)="download()"
    >Download File</a
  >`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileDownloadComponent implements ICellRendererAngularComp {
  params: ICellRendererParams;
  link: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.link = this.params.data.download_link;
  }

  refresh(): boolean {
    return true;
  }

  download() {
    window.open(this.link);
  }
}
