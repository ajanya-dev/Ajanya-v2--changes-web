import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  NavigationEnd,
  Router,
  ActivatedRoute,
  RouterOutlet
} from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { NgClass } from '@angular/common';
import { ScriptService } from 'src/app/core/services/script.service';
import { environment } from 'src/environments/environment';
import { LoomComponent } from '../../../modules/loom-video/loom/loom.component';
import { NpsComponent } from '../../../modules/nps/components/nps/nps.component';
import { V3TodoButtonComponent } from '../v3-todo-button/v3-todo-button.component';
import { HeaderV35Component } from '../header-v35/header-v35.component';
import { SideBarV35Component } from '../side-bar-v35/side-bar-v35.component';
import { SideBarCsnhcComponent } from '../side-bar-csnhc/side-bar-csnhc.component';
import { ChatBoxComponent } from '../chat-box/chat-box.component';

@Component({
  selector: 'app-content-layout-v35',
  templateUrl: './content-layout-v35.component.html',
  styleUrls: ['./content-layout-v35.component.scss'],
  standalone: true,
  imports: [
    SideBarV35Component,
    SideBarCsnhcComponent,
    NgClass,
    HeaderV35Component,
    V3TodoButtonComponent,
    RouterOutlet,
    NpsComponent,
    LoomComponent,
    ChatBoxComponent
]
})
export class ContentLayoutV35Component implements OnInit, OnDestroy {
  private router = inject(Router);
  private layoutservice = inject(LayoutService);
  private activatedRoute = inject(ActivatedRoute);
  private headerService = inject(HeaderService);
  private scriptService = inject(ScriptService);

  isCsnhc = environment.env_id === 'csnhc';
  isV3Page = false;
  isUserManagementPage = false;
  subscriptions: Subscription[] = [];
  isHidden: boolean;

  ngOnInit(): void {
    this.handleV3Page();
    this.scrollSubcribe();
    this.layoutservice.enableUseMobileAppPage();
    this.scriptService.addZohoSrcipt();
  }

  /**
   * @description check if the current route v# or not
   */
  handleV3Page() {
    this.isV3Page =
      this.activatedRoute.snapshot.url.length > 1 &&
      this.activatedRoute.snapshot.url[0].path === 'v3';
    this.subscriptions.push(
      this.router.events.subscribe((res) => {
        if (res instanceof NavigationEnd) {
          const segments = this.activatedRoute.snapshot.url;
          this.isV3Page = segments.length > 1 && segments[0].path === 'v3';
        }
        this.isUserManagementPage =
          this.router.url === '/manage/manage-users/index';
      })
    );
  }

  scrollSubcribe() {
    this.subscriptions.push(
      this.headerService.isSubHeaderVisible.subscribe((res) => {
        this.isHidden = res.hidden || environment.env_id === 'csnhc';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
