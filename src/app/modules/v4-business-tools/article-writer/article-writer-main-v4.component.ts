import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LucideAngularModule, PenLine, Sparkles, Trash2, Copy, Check, ArrowLeft } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-article-writer-main-v4',
  templateUrl: './article-writer-main-v4.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, CommonButtonV4Component]
})
export class ArticleWriterMainV4Component {
  private businessToolsService = inject(BusinessToolsService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  readonly PenLineIcon = PenLine;
  readonly SparklesIcon = Sparkles;
  readonly Trash2Icon = Trash2;
  readonly CopyIcon = Copy;
  readonly CheckIcon = Check;
  readonly ArrowLeftIcon = ArrowLeft;

  content = signal('');
  result1 = signal('');
  result2 = signal('');
  loading = signal(false);
  showCopied1banner = signal(false);
  showCopied2banner = signal(false);

  goBack(): void {
    this.router.navigate(['/v4/manage/v4-business-tools/more']);
  }

  clearText(field: 'content' | 'result') {
    if (field === 'content') {
      this.content.set('');
    }
    if (field === 'result') {
      this.result1.set('');
      this.result2.set('');
    }
  }

  showCopied1() {
    navigator.clipboard.writeText(this.result1()).then(() => {
      this.showCopied1banner.set(true);
    }).catch(err => {
      console.error('Failed to copy text to clipboard', err);
    });
    setTimeout(() => {
      this.showCopied1banner.set(false);
    }, 2000);
  }

  showCopied2() {
    navigator.clipboard.writeText(this.result2()).then(() => {
      this.showCopied2banner.set(true);
    }).catch(err => {
      console.error('Failed to copy text to clipboard', err);
    });
    setTimeout(() => {
      this.showCopied2banner.set(false);
    }, 2000);
  }

  onGenerateButtonClicked() {
    if (this.content()) {
      this.loading.set(true);
      const sendingData = new FormData();
      sendingData.append('content', this.content());
      this.businessToolsService
        .articleGenerator2(sendingData)
        .pipe(
          finalize(() => this.loading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success && typeof res.data !== 'string') {
            this.result1.set(res.data[0]);
            this.result2.set(res.data[1]);
          } else {
            this.alertService.infoAlert({
              close: true,
              timeout: 2000,
              title: 'Info!',
              content: 'No results found on this content'
            });
          }
        });
    }
  }
}
