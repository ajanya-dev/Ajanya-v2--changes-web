import { Component, inject, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-v4-dynamic-iframe-tab',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip],
  templateUrl: './dynamic-iframe-tab.component.html',
  styleUrls: ['./dynamic-iframe-tab.component.scss']
})
export class DynamicIframeTabComponent {
  private clipboard = inject(Clipboard);

  dynamicLink = input('');
  iframeCode = input('');
  loading = input(false);

  copiedDynamic = signal(false);
  copiedIframe = signal(false);

  copyToClipboard(text: string, type: 'dynamic' | 'iframe') {
    this.clipboard.copy(text);
    if (type === 'dynamic') {
      this.copiedDynamic.set(true);
      setTimeout(() => this.copiedDynamic.set(false), 2000);
    } else {
      this.copiedIframe.set(true);
      setTimeout(() => this.copiedIframe.set(false), 2000);
    }
  }
}
