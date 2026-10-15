import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, CirclePlay } from 'lucide-angular';
import { DemoVideoService } from 'src/app/shared/service/common/demo-video/demo-video.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { IDemoVideo } from 'src/app/shared/components/demo-video/model/demovideo';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const $: any;

/**
 * @description V4 demo / tutorial video trigger. Looks up the help-video URL for the
 * given `slug` and opens it in a Fancybox lightbox on click. Colors (text, icon,
 * background, border) are fully configurable via inputs, with optional dark-theme
 * overrides, and an optional responsive mode that hides the label below 1024px.
 */
@Component({
  standalone: true,
  selector: 'app-v4-demo-video',
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './v4-demo-video.component.html',
  styleUrls: ['./v4-demo-video.component.scss']
})
export class V4DemoVideoComponent implements AfterViewInit {
  private demoVideoService = inject(DemoVideoService);
  private themeService = inject(ThemeService);

  readonly playIcon = CirclePlay;
  private staticWhiteLabelConditions = StaticWhiteLabelConditions;
  private static fancyboxInitialized = false;
  @ViewChild('demoVideoLink', { static: false })
  demoVideoLink!: ElementRef<HTMLAnchorElement>;

  // Identifies which help video to play (e.g. 'v3Homepage', 'check', 'bill')
  slug = input.required<string>();

  // Visible label text
  label = input<string>('Tutorial');

  // When true, the label is hidden below 1024px and only the icon is shown
  responsive = input<boolean>(false);

  // Light-theme colors — defaults match the reference design (brand navy on a subtle border)
  textColor = input<string>('var(--v4-primary-brand-bold-color)');
  iconColor = input<string>('var(--v4-primary-brand-bold-color)');
  borderColor = input<string>('var(--v4-primary-brand-bold-color)');
  backgroundColor = input<string>(
    'color-mix(in srgb, var(--v4-primary-brand-bold-color) 5%, transparent)'
  );

  // Optional dark-theme overrides — when null, the light-theme color is reused
  darkTextColor = input<string | null>(null);
  darkIconColor = input<string | null>(null);
  darkBackgroundColor = input<string | null>(null);
  darkBorderColor = input<string | null>(null);

  private videos = signal<IDemoVideo | null>(null);
  private isDark = signal<boolean>(this.themeService.getInitialColourTheme());

  // Resolved video URL for the current slug
  link = computed<string | null>(() => {
    const videos = this.videos();
    const slug = this.slug();
    if (videos && Object.prototype.hasOwnProperty.call(videos, slug)) {
      return videos[slug as keyof IDemoVideo] ?? null;
    }
    return null;
  });

  // Only render when help videos are allowed and a link exists for the slug
  visible = computed(
    () => !!this.staticWhiteLabelConditions?.helpVideoVisible && !!this.link()
  );

  effectiveTextColor = computed(() =>
    this.isDark() ? this.darkTextColor() || this.textColor() : this.textColor()
  );

  effectiveIconColor = computed(() =>
    this.isDark() ? this.darkIconColor() || this.iconColor() : this.iconColor()
  );

  effectiveBackgroundColor = computed(() =>
    this.isDark()
      ? this.darkBackgroundColor() || this.backgroundColor()
      : this.backgroundColor()
  );

  effectiveBorderColor = computed(() =>
    this.isDark()
      ? this.darkBorderColor() || this.borderColor()
      : this.borderColor()
  );

  constructor() {
    this.demoVideoService.loadDemoVideos();
    this.demoVideoService
      .getHelpVideos()
      .pipe(takeUntilDestroyed())
      .subscribe((res) => {
        if (res) {
          this.videos.set(res as IDemoVideo);
        }
      });

    this.themeService
      .getThemeSwitch()
      .pipe(takeUntilDestroyed())
      .subscribe((isDark) => this.isDark.set(isDark));
  }

  ngAfterViewInit(): void {
    this.initFancyboxTracking();
  }

  /**
   * @description Opens the help video in a Fancybox lightbox.
   */
  onPlayClick(event: MouseEvent): void {
    // Always prevent the anchor's default navigation to the video URL.
    event.preventDefault();

    const url = this.link();
    if (!url) {
      return;
    }

    if (typeof $ !== 'undefined' && $.fancybox) {
      // Fancybox's media plugin auto-detects YouTube/Vimeo URLs from `src`.
      $.fancybox.open({ src: url });
    } else {
      // Fallback if Fancybox failed to load — open in a new tab, never the current one.
      window.open(url, '_blank', 'noopener');
    }
  }

  /**
   * @description Initialize Fancybox tracking for video watch progress
   */
  private initFancyboxTracking(): void {
    if (V4DemoVideoComponent.fancyboxInitialized) {
      return;
    }

    if (typeof $ !== 'undefined' && $.fancybox) {
      V4DemoVideoComponent.fancyboxInitialized = true;
    }
  }
}
