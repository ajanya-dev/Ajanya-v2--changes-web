import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bank-data-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bank-data-landing.component.html',
  styleUrl: './bank-data-landing.component.scss'
})
export class BankDataLandingComponent {

  private localStorageService = inject(LocalStorageService);
  private sanitizer = inject(DomSanitizer);
  loading = signal<boolean>(true);

  private iframe =
    viewChild<ElementRef<HTMLIFrameElement>>('bankDataIframe');

  destroy$ = new Subject<boolean>();


  destory$ = new Subject();

  src: SafeResourceUrl;

  constructor() {
    const tempRoot = this.localStorageService.getItem('tempRoot');

    let { rootUrl } = environment;

    if (tempRoot && environment.isItDev) {
      rootUrl = `${tempRoot}/api/v4`;
    }

    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://wondrous-druid-dd6e79.netlify.app/?token=${this.localStorageService.appToken}&baseUrl=${rootUrl}`
    );
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if(event.data.action === 'iframe:ready') {
      this.loading.set(false);
    }
  }


  postMessage(data: unknown) {
    const iframe = this.iframe()?.nativeElement;

    if (!iframe) return;

    iframe.contentWindow?.postMessage(data, '*');
  }


}
