import { Component, OnDestroy } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { NgIf } from '@angular/common';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { FormsModule } from '@angular/forms';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-article-writer-main',
  templateUrl: './article-writer-main.component.html',
  styleUrls: ['./article-writer-main.component.scss'],
  standalone: true,
  imports: [FormsModule, CdkCopyToClipboard, NgIf, CommonButtonV35Component]
})
export class ArticleWriterMainComponent implements OnDestroy {
  result2: string;
  result1: string;
  loading: boolean;
  showCopied1banner = false;
  showCopied2banner = false;
  subscriptions: Subscription[] = [];
  content: string;
  constructor(
    private businessToolsService: BusinessToolsService,
    private _alertService: AlertService
  ) {}


  clearText(field: string) {
    if (field === 'content') {
      this.content = ''
    }
    if (field === 'result') {
      this.result1 = ''
      this.result2 = ''
    }
  }

  /**
   * @description copy the first result.
   *
   */
  showCopied1() {
    navigator.clipboard.writeText(this.result1).then(()=>{
      this.showCopied1banner = true;
    }).catch( err => {
      console.error('Failed to copy text to clipboard', err);
    })
    setTimeout(() => {
      this.showCopied1banner = false;
    }, 2000);
  }

  /**
   * @description  copy the second result.
   *
   */
  showCopied2() {
    navigator.clipboard.writeText(this.result2).then(()=>{
      this.showCopied2banner = true;
    }).catch(err =>{
      console.error('Failed to copy text to clipboard', err);
    })
    setTimeout(() => {
      this.showCopied2banner = false;
    }, 2000);
  }

  /**
   * @description  submitting the email content.
   *
   */
  onGenerateButtonClicked() {
    if (this.content) {
      this.loading = true;
      const sendingData = new FormData();
      sendingData.append('content', this.content);
      this.subscriptions.push(
        this.businessToolsService
        .articleGenerator2(sendingData).pipe(finalize(()=>{
          this.loading = false;
        }))
        .subscribe((res) => {
          if (res.success && typeof res.data !== 'string') {
            this.result1 = res.data[0];
            this.result2 = res.data[1];
          } else {
            const data = {
              close: true,
              timeout: 2000,
              title: 'Info!',
              content: 'No results found on this content'
            };
            this._alertService.infoAlert(data);
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
