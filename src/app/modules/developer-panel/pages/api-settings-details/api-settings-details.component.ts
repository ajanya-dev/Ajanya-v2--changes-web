import { JsonPipe, NgClass } from '@angular/common';
import { CommonBackButtonV35Component } from './../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { IApiSettingsDetails } from 'src/app/models/developer';
import { DeveloperPanelService } from 'src/app/shared/service/developer-panel/developer-panel.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCopy, faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-api-settings-details',
  templateUrl: './api-settings-details.component.html',
  styleUrls: ['./api-settings-details.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, JsonPipe, FaIconComponent, NgClass]
})

export class ApiSettingsDetailsComponent implements OnInit, OnDestroy {
  public activatedRoute = inject(ActivatedRoute);
  private developerService = inject(DeveloperPanelService);

  @ViewChild('requestBody') requestBody: ElementRef;
  @ViewChild('responseBody') responseBody: ElementRef;
  
  id: string;
  apisettingsLog: IApiSettingsDetails;
  subscriptions: Subscription[] = [];
  settingsLoading = signal(false);
  selectedTab: string = 'request';
  copyCLass = false;

  // Icons
  faCopy = faCopy;
  faXmark = faXmark;
  
  ngOnInit(): void {
    this.subscriptions.push(this.activatedRoute.queryParams.subscribe((res) => {
      this.id = res.id;
    }));
    this.apiSettingsDetails();
  }

  apiSettingsDetails() {
    this.settingsLoading.set(true);
    this.subscriptions.push(this.developerService
    .apiSettingsDetails(this.id)
    .pipe(finalize(() => this.settingsLoading.set(false)))
    .subscribe((res: IApiRes<IApiSettingsDetails>) => {
      if (res.success === true) this.apisettingsLog = res.data;
    }));
  }

  parseJson(jsonString: string) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return { error: 'Invalid JSON', original: jsonString };
    }
  }

  switchTab(tab: string) {
    this.selectedTab = tab;
  }

  copyToClipboard(element: string) {
    const text = element === 'requestBody' ? this.requestBody.nativeElement.innerText : this.responseBody.nativeElement.innerText;
    navigator.clipboard.writeText(text);

    this.copyCLass = !this.copyCLass;
    setTimeout(() => {
      this.copyCLass = !this.copyCLass;
    }, 800);
  }
  
  
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
