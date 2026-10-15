import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-common-list-skelton',
  imports: [CommonModule],
  template: `
    <div
      role="presentation"
      class="border-b border-input-border-color h-12"
      *ngFor="let _ of [].constructor(items)"
    >
      <div class="pl-4 pr-3 py-2 flex gap-3">
        <div class="flex items-center justify-center">
          <div
            class="flex justify-center items-center h-7 w-7 rounded-full skelton"
          ></div>
        </div>
        <div class="w-full flex flex-col gap-1">
          <div class="skelton w-20 h-3"></div>
          <div class="flex justify-between">
            <div class="skelton w-14 h-3"></div>
            <div *ngIf="isThirdDiv" class="skelton w-14 h-3"></div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CommonListSkeltonComponent {
  /** Number of items to need skelton. */
  @Input({ required: true }) items: number;
  /** Sklton work on the third div based on the this boolean value. */
  @Input() isThirdDiv = true;
}
