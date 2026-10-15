import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { EmailTemplateService } from 'src/app/shared/service/email-template/email-template.service';
import { environment } from 'src/environments/environment';
import { IApiRes } from 'src/app/models/api';
import { EnterEmailModalComponent } from '../../modals/enter-email-modal/enter-email-modal.component';
import { IAPIMailDesignTags , IApiGetTemplate } from '../../models/email-template';

declare let Editor: any;

/** Where the back button lands when the opener did not pass a returnUrl. */
const DEFAULT_RETURN_URL = '/manage/user-profile/user-settings';

@Component({
  selector: 'app-email-editor',
  templateUrl: './email-editor.component.html',
  styleUrls: ['./email-editor.component.scss'],
  standalone: true
})
export class EmailTemplateEditorComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  tags: IAPIMailDesignTags[] = [];
  editor: typeof Editor;
  type: string;
  returnUrl = DEFAULT_RETURN_URL;

  constructor(
    private _emailService: EmailTemplateService,
    private _route: ActivatedRoute,
    private _alertService: AlertService,
    private _dialog: MatDialog,
    private _renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const {url} = this._route.snapshot;
    if (url?.length) {
      this.type = url[url.length - 1]?.path;
    }

    this.returnUrl = this.resolveReturnUrl(
      this._route.snapshot.queryParams?.returnUrl
    );

    // The back button belongs to the builder.js top bar, which renders outside
    // Angular and only after the editor boots, so listen for it on the document.
    document.addEventListener('click', this.onDocumentClick);

    this.initApis().subscribe(
      (response: [IApiRes<IApiGetTemplate>, IApiRes<IAPIMailDesignTags[]>]) => {
        if (!response?.length) {
          return;
        }
        if (response[1]?.success) {
          this.tags = response[1].data;
        }
        if (response[0]?.success) {
          const html = response[0].data.content.replace(/(\r\n|\n|\r)/gm, '');
          this.initEditor(html, response[0].data.subject);
        }
      }
    );
  }

  initApis(): Observable<
    [IApiRes<IApiGetTemplate>, IApiRes<IAPIMailDesignTags[]>]
  > {
    const getTemplate = this._emailService.getTemplate(this.type);
    const getTags = this._emailService.getTags(this.type);

    return forkJoin([getTemplate, getTags]);
  }

  initEditor(html: string, subject: string) {
    const editorConfig = {
      uploadAssetUrl: `${environment.rootUrl}/email-template/save-assets/${this.type}`
    };

    sessionStorage.setItem('editorConfig', JSON.stringify(editorConfig));

    this.editor = new Editor({
      root: '/assets/builderjs/dist/',
      uploadAssetMethod: 'POST',
      tags: this.tags,
      title: 'Template Design'
    });

    this.editor.load(html);
    this.editor.init();

    setTimeout(() => {
      this.setCustomHtml(subject);
    }, 3000);

    this.eventHandler();
  }

  setCustomHtml(subject: string) {
    const elem = document.createElement('div');
    elem.innerHTML = `<label style="width: 125px; margin-right: 10px;" for="subject">Email Subject </label> &nbsp;
      <input  name="subject" value="${subject}" id="subject" style="width: 100%; padding: 15px; border-radius: 5px; border: 2px solid #e0e0e0;" size="100"/>
      <span id="total-email-size"></span>
      <div id="template_loader" style="display:none;position: fixed;top: 0;left: 0;width: 100%;height: 100%;background-color: rgb(209 209 209 / 50%);justify-content: center;align-items: center;z-index: 9999;">
        <div  class="data_spinner"></div>
      </div>
      `;
    elem.style.cssText =
      'margin-top:56px;margin-left:17px;display:flex;align-items:center;z-index:2;background:#fff;padding:20px;width:calc(70% - 14px);';
    const editable = document.getElementById('editable')!;
    editable?.insertAdjacentElement('beforebegin', elem);
  }

  onDocumentClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('#custom_back_btn')) {
      return;
    }
    this.goBack();
  };

  /**
   * Only in-app paths are accepted so a crafted returnUrl cannot send the user
   * off site. `//host` and `http://host` are rejected, everything else falls
   * back to the V3 settings page the editor used to hardcode.
   */
  resolveReturnUrl(returnUrl?: string): string {
    if (
      typeof returnUrl !== 'string' ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//')
    ) {
      return DEFAULT_RETURN_URL;
    }
    return returnUrl;
  }

  /**
   * Returns to the page the editor was opened from. A full page load is used
   * because builder.js owns the DOM at this point and router navigation would
   * leave its markup behind.
   */
  goBack(): void {
    window.location.href = this.returnUrl;
  }

  /**
   * Get events from builder js iframe
   */
  eventHandler() {
    const messageEventHandler = (data: {
      data: string | { emailContent: string; event: string };
    }) => {
      if (!data?.data) {
        return;
      }

      let event: {
        data: string;
        emailContent: string;
        event: string;
        content: string;
      };
      try {
        event = JSON.parse(data.data as string);
      } catch {
        return;
      }

      if (event.event === 'save') {
        this.saveTemplate(event);
      } else if (event.event === 'test_email') {
        this.testEmail(event);
      } else if (event.event === 'default_template') {
        this.getDefaultTemplate();
      }
    };

    window.addEventListener('message', messageEventHandler, false);
  }

  saveTemplate(event: { data: string; emailContent: string; event: string }) {
    const spinner = document.querySelector('#template_loader');
    this._renderer.setStyle(spinner, 'display', 'flex');
    const subject = document.getElementById('subject') as HTMLInputElement;

    if (subject.value === '') {
      this._renderer.setStyle(spinner, 'display', 'none');
      this._alertService.warningAlert({
        title: 'Error',
        content: 'Subject is required',
        doneMsg: 'Ok'
      });
      return;
    }
    if (subject.value.length < 3) {
      this._renderer.setStyle(spinner, 'display', 'none');
      this._alertService.warningAlert({
        title: 'Error',
        content: 'Subject must be have three character',
        doneMsg: 'Ok'
      });
      return;
    }

    const body = { content: event.emailContent, subject: subject.value };
    this._emailService.saveTemplate(this.type, body).subscribe((data) => {
      if (data?.success) {
        this._renderer.setStyle(spinner, 'display', 'none');
        this._alertService.successAlert({
          content: 'Template Updated!',
          close: true
        });
      }
    });
  }

  testEmail(event: {
    data: string;
    emailContent: string;
    event: string;
    content: string;
  }) {
    const dRef = this._dialog.open(EnterEmailModalComponent, {
      width: '500px',
      maxWidth: '95%'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res?.email) {
        const body = {
          type: this.type,
          email: res.email,
          content: event.content
        };
        this._emailService.sendTestEmail(body).subscribe((response) => {
          if (response?.success) {
            this._alertService.successAlert({
              content: 'Emailed',
              close: true
            });
          }
        });
      }
    });
  }

  getDefaultTemplate() {
    const spinner = document.querySelector('#template_loader');
    this._renderer.setStyle(spinner, 'display', 'flex');
    this._emailService.getDefaultTemplate(this.type).subscribe((data) => {
      if (data?.success) {
        try {
          const html = JSON.parse(data.data)?.content.replace(
            /(\r\n|\n|\r)/gm,
            ''
          );
          this.editor.load(html);
          const subject = document.getElementById(
            'subject'
          ) as HTMLInputElement; // set subject default value
          subject.value = JSON.parse(data.data)?.subject;
        } catch {
          this._renderer.setStyle(spinner, 'display', 'none');
        }
      }
      this._renderer.setStyle(spinner, 'display', 'none');
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick);
    this._renderer.destroy();
  }
}
