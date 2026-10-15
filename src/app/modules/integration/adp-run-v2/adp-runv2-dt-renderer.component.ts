import { ICellRendererParams } from "@ag-grid-community/core";
import { Component } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faEllipsisVertical } from "@fortawesome/pro-solid-svg-icons";

@Component({
    selector: 'app-adp-runv2-dt-renderer',
    template: `
        <fa-icon [icon]="faEllipsisVertical"  [matMenuTriggerFor]="menu" class="p-3 cursor-pointer " />
        <mat-menu #menu="matMenu" class="action-menu">
            @for(item of menuOptions; track $index){
                <li mat-menu-item (click)="onMenuItemClick(item.id)" role="presentation">
                    <mat-icon></mat-icon>
                    <span class="text-[14px]">{{item.name}}</span>
            </li>
            }
            
        </mat-menu>
    `,
    styles: [
    ],
    standalone: true,
    imports: [
        FaIconComponent,
        MatMenuModule
    ]
})
export class AdpRunV2DtRendererComponent {

    params: ICellRendererParams & {
        onSelect?: (params: ICellRendererParams & { 'click-event': string }) => void
    };

  faEllipsisVertical = faEllipsisVertical;

  menuOptions = [
    { id: 'issue-check', name: 'Issue Check' },
    { id: 'mail-check', name: 'Mail Check' },
    { id: 'send-letter', name: 'Send letter' },
    { id: 'send-virual-card', name: 'Send Virtual Card' },
    { id: 'view-details', name: 'View Details' }
  ];

  agInit(params: typeof this.params): void {
    this.params = params;
  }

  onMenuItemClick(id: string): void {
    this.params?.onSelect?.({ ...this.params, 'click-event': id });
  }

}