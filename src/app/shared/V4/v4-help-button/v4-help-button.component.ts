import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  isDevMode
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  LucideAngularModule,
  CircleHelp,
  MessageSquare,
  Monitor,
  BookOpen,
  Video,
  Lightbulb,
  CircleAlert,
  Heart,
  Calendar,
  MessageCircle,
  Phone
} from 'lucide-angular';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { FeatureRequestModalV4Component } from 'src/app/shared/modal/feature-request-modal-v4/feature-request-modal-v4.component';
import { TextUsV4Component } from 'src/app/shared/modal/text-us-v4/text-us-v4.component';
import { BookADemoModalV4Component } from 'src/app/modules/user-support/modals/v4/book-a-demo-modal-v4/book-a-demo-modal-v4.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-v4-help-button',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './v4-help-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4HelpButtonComponent implements OnInit {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  readonly CircleHelpIcon = CircleHelp;
  readonly MessageSquareIcon = MessageSquare;
  readonly MonitorIcon = Monitor;
  readonly BookOpenIcon = BookOpen;
  readonly VideoIcon = Video;
  readonly LightbulbIcon = Lightbulb;
  readonly CircleAlertIcon = CircleAlert;
  readonly HeartIcon = Heart;
  readonly CalendarIcon = Calendar;
  readonly MessageCircleIcon = MessageCircle;
  readonly PhoneIcon = Phone;

  showHelpMenu = false;
  showLiveChat = true;
  showPhoneNumber = true;
  showLiveScreenSharing = true;
  showVideoTutorial = true;
  showSubmitIdea = true;
  showReportIssue = true;
  showCompliance = true;
  showBookDemo = true;
  showTextUs = true;

  supportNo = StaticWhiteLabelConditions.customerSupportNo;

  ngOnInit(): void {
    this.loadHelpMenuConfig();
  }

  loadHelpMenuConfig(): void {
    if (!StaticWhiteLabelConditions.zohoSupportChat) this.showLiveChat = false;
    if (!StaticWhiteLabelConditions.customerSupportNo) this.showPhoneNumber = false;
    if (environment.isItWhiteLabel) {
      this.showLiveScreenSharing = false;
      this.showVideoTutorial = false;
      this.showSubmitIdea = false;
      this.showCompliance = false;
      this.showBookDemo = false;
      this.showTextUs = false;
    }
    if (environment.env_id === 'sandbox') {
      this.showLiveScreenSharing = false;
      this.showVideoTutorial = false;
      this.showSubmitIdea = false;
      this.showReportIssue = false;
      this.showCompliance = false;
      this.showBookDemo = false;
      this.showTextUs = false;
    }
    if (
      environment.env_id === 'quickbanked' ||
      environment.env_id === 'quickbanked-sandbox'
    ) {
      this.showBookDemo = false;
    }
  }

  onLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  onLiveScreenSharing(): void {
    window.open('https://join.zoho.com/', '_blank');
  }

  onHelpTutorial(): void {
    // Local Help Center redesign prototype (docs/design-system/help-center) while
    // serving in dev; production keeps the Zoho Desk portal.
    const url = isDevMode()
      ? '/assets/help-center/index.html'
      : StaticWhiteLabelConditions.supportWebsite;
    window.open(url, '_blank');
  }

  onVideoTutorial(): void {
    window.open(
      'https://www.youtube.com/channel/UC4rjiWXUxv-6V4drscMQDwA',
      '_blank'
    );
  }

  onSubmitIdea(): void {
    this.dialog.open(FeatureRequestModalV4Component, {
      maxWidth: '510px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {}
    });
  }

  onReportIssue(): void {
    this.router.navigate(['/v4/manage/user-support']);
  }

  onOurCompliance(): void {
    this.router.navigate(['/v4/manage/user-profile/user-settings'], {
      queryParams: { tab: 'our-compliance' }
    });
  }

  onBookDemo(): void {
    this.dialog.open(BookADemoModalV4Component, {
      maxWidth: '800px',
      width: '100%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  onTextUs(): void {
    this.dialog.open(TextUsV4Component, {
      maxWidth: '460px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded'
    });
  }

  onPhoneCall(): void {
    document.location.href = `tel:${StaticWhiteLabelConditions.customerSupportNo}`;
  }
}
