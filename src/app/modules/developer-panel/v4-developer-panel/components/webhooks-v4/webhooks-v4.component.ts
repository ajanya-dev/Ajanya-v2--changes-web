import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  UntypedFormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { DeveloperPanelService } from 'src/app/shared/service/developer-panel/developer-panel.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-webhooks-v4',
  templateUrl: './webhooks-v4.component.html',
  styleUrls: ['./webhooks-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, CommonButtonV4Component, CommonInputFieldV4Component, MatTooltip]
})
export class WebhooksV4Component implements OnInit {
  private fb = inject(FormBuilder);
  private developerPanelService = inject(DeveloperPanelService);
  private v4AlertService = inject(V4AlertService);

  activeTab = signal<'new' | 'old'>('new');
  collapsed = signal<boolean>(false);
  loading = signal<boolean>(false);
  saveLoading = signal<boolean>(false);

  webhookForm: UntypedFormGroup;
  getpaidWebhookForm: UntypedFormGroup;

  mailTrackChecked = false;
  checkStatusChecked = false;
  webhookEvents: string[] = [];
  selectedEvents: string[] = [];
  private arr: string[] = [];

  ngOnInit(): void {
    this.initForms();
    this.loadSettings();
    this.loadWebhookEvents();
  }

  private initForms(): void {
    this.webhookForm = this.fb.group({
      webhookUrl: ['', [Validators.required, this.urlValidator()]],
      secrectKey: [''],
      mailTrack: [''],
      sendCheckUpdate: [''],
      webhookStatus: ['']
    });
    this.getpaidWebhookForm = this.fb.group({
      getPaidWebhookurl: ['', [Validators.required]],
      getPaidSecret: [''],
      selectUpdate: [],
      getPaidStatus: ['']
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    this.developerPanelService
      .apiActivity()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (!res.success) return;
          const ws = res.data.webhookSettings;
          const gpbf = res.data.getPaidByFormWebhook;

          // Populate OLD form
          this.webhookForm.patchValue({
            webhookUrl: ws.webhookUrl,
            secrectKey: ws.webhookSecret,
            webhookStatus: ws.webhookStatus?.toString()
          });
          this.mailTrackChecked = ws.enabledServices[0] == 1;
          this.webhookForm.controls['mailTrack'].setValue(this.mailTrackChecked ? 1 : '');
          this.checkStatusChecked = ws.enabledServices[1] == 1;
          this.webhookForm.controls['sendCheckUpdate'].setValue(this.checkStatusChecked ? 2 : '');

          // Populate NEW form
          this.arr = gpbf.selectAnEvent ? [...gpbf.selectAnEvent] : [];
          this.selectedEvents = [...this.arr];
          this.sortWebhookEvents();
          this.getpaidWebhookForm.patchValue({
            getPaidWebhookurl: gpbf.webhookUrl,
            getPaidSecret: gpbf.secretKey,
            getPaidStatus:
              gpbf.webhookStatus === 0 || gpbf.webhookStatus === 1
                ? gpbf.webhookStatus.toString()
                : '1'
          });
        },
        error: (err) => {
          this.v4AlertService.failedAlert({
            content: err.error?.errorMsg ?? 'Failed to load webhook settings.'
          });
        }
      });
  }

  private loadWebhookEvents(): void {
    this.developerPanelService.getWebhookEvents().subscribe({
      next: (res) => {
        this.webhookEvents = res.data ?? [];
        this.sortWebhookEvents();
      }
    });
  }

  private sortWebhookEvents(): void {
    this.webhookEvents.sort((a, b) => {
      const aSelected = this.selectedEvents.includes(a) ? 0 : 1;
      const bSelected = this.selectedEvents.includes(b) ? 0 : 1;
      return aSelected - bSelected;
    });
  }

  saveWebhook(): void {
    if (this.activeTab() === 'new') this.saveNewWebhook();
    else this.saveOldWebhook();
  }

  private saveNewWebhook(): void {
    this.getpaidWebhookForm.markAllAsTouched();
    if (this.getpaidWebhookForm.invalid) return;
    this.saveLoading.set(true);
    const payload = {
      webhookUrl: this.getpaidWebhookForm.value.getPaidWebhookurl,
      webhookSecret: this.getpaidWebhookForm.value.getPaidSecret,
      enabledServices: [...new Set([...this.selectedEvents])],
      status: this.getpaidWebhookForm.value.getPaidStatus
    };
    this.developerPanelService
      .gpblWebhook(payload)
      .pipe(finalize(() => this.saveLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.sortWebhookEvents();
            this.v4AlertService.successAlert({ title: 'Success', content: 'Webhook updated successfully.' });
          }
        },
        error: (err) => {
          this.v4AlertService.failedAlert({
            content: err.error?.errorMsg ?? 'Failed to update webhook.'
          });
        }
      });
  }

  private saveOldWebhook(): void {
    this.webhookForm.markAllAsTouched();
    if (this.webhookForm.invalid) return;
    this.saveLoading.set(true);
    const data = this.webhookForm.value;
    const payload = {
      webhookUrl: data.webhookUrl,
      webhookSecret: data.secrectKey,
      enabledServices: [data.mailTrack, data.sendCheckUpdate],
      status: data.webhookStatus
    };
    this.developerPanelService
      .updateWebhook(payload)
      .pipe(finalize(() => this.saveLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success)
            this.v4AlertService.successAlert({ title: 'Success', content: 'Webhook updated successfully.' });
        },
        error: (err) => {
          this.v4AlertService.failedAlert({
            content: err.error?.errorMsg ?? 'Failed to update webhook.'
          });
        }
      });
  }

  onCheckedGpbf(checked: boolean, item: string): void {
    if (checked && !this.arr.includes(item)) {
      this.arr.push(item);
      if (!this.selectedEvents.includes(item)) this.selectedEvents.push(item);
    } else if (!checked) {
      this.arr = this.arr.filter((v) => v !== item);
      this.selectedEvents = this.selectedEvents.filter((v) => v !== item);
    }
  }

  isEventSelected(item: string): boolean {
    return this.selectedEvents.includes(item);
  }

  onCheckedOld(checked: boolean, val: number): void {
    if (val === 1) this.webhookForm.controls['mailTrack'].setValue(checked ? 1 : '');
    if (val === 2) this.webhookForm.controls['sendCheckUpdate'].setValue(checked ? 2 : '');
  }

  private urlValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: string } | null => {
      if (!control.value) return null;
      const url: string = control.value;
      if (!url.startsWith('https://')) return { invalidUrl: 'URL must start with https://' };
      if (/^https:\/\/localhost/i.test(url)) return { invalidUrl: 'localhost is not allowed' };
      const host = url.replace(/^https:\/\//i, '');
      const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}/i;
      const ipPattern =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!domainPattern.test(host) && !ipPattern.test(host))
        return { invalidUrl: 'Invalid domain or IP address' };
      return null;
    };
  }
}
