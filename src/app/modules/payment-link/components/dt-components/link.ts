import { Component } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-link',
  template: `
    <span class="parent__copy">
      <a class="copy___icon" (click)="copyThisLink()">
        <i
          class="mr-2"
          [class]="icon"
          style="color:#0053b5;cursor: pointer"
          title="Copy Link"
        ></i>
      </a>
      <a class="text-lowercase copied-text" [href]="link" target="_blank"
        ><span style="text-transform: lowercase;color:#5867dd">{{ link }}</span>
        <span id="copied" class="copied"></span>
      </a>
      <label
        *ngIf="icon === 'fas fa-check'"
        style="color: #6f727d;
    font-size: 13px; margin-left:10px;"
        >Link Copied..</label
      >
    </span>
  `,
  // styleUrls: ['./dt-select-all-check-box.component.scss']
  standalone: true,
  imports: [NgIf]
})
export class linkComponent implements ICellRendererAngularComp {
  params!: any;
  link: any;
  icon = 'fas fa-copy';

  refresh(): boolean {
    return true;
    // throw new Error('Method not implemented.');
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.link = this.params.data.link;
  }

  copyThisLink() {
    const elem = document.createElement('textarea');
    elem.value = this.link;
    document.body.appendChild(elem);
    elem.select();
    document.execCommand('copy');
    document.body.removeChild(elem);
    this.icon = 'fas fa-check';
    setTimeout(() => {
      this.icon = 'fas fa-copy';
    }, 2000);
  }
}
