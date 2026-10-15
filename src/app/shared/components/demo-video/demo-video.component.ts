import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild,  inject, input, OnDestroy, AfterViewInit } from '@angular/core';
import { IDemoVideo } from 'src/app/shared/components/demo-video/model/demovideo';
import { DemoVideoService } from '../../service/common/demo-video/demo-video.service';
import { CommonModule } from '@angular/common';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const $: any;

/**
 * @description Component for loading demo videos.
 */
@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  selector: 'app-demo-video',
  templateUrl: './demo-video.component.html',
  styleUrls: ['./demo-video.component.scss']
})
export class DemoVideoComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() slug!: string;
  @Input() disableText = false;
  @Input() pageType: string;
  clickedFromOutside = input<boolean>(false);
  @ViewChild('demoVideoLink', { static: false }) demoVideoLink!: ElementRef<HTMLAnchorElement>;


  link!: string;
  demoVideoKeys: IDemoVideo;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  subscriptions: Subscription[] = [];
  private demoVideoService = inject(DemoVideoService);
  @Output() clickedFromOutsideChange = new EventEmitter<boolean>();

  private static fancyboxInitialized = false;


  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initFancyboxTracking();
  }

  /**
   * @description Loads the demo video data for the given slug representing video link.
   */
  loadData(): void {
    this.demoVideoService.loadDemoVideos();
    this.subscriptions.push(
      this.demoVideoService.getHelpVideos().subscribe((res) => {
        if (res) {
          this.demoVideoKeys = res as IDemoVideo;
          if (this.demoVideoKeys?.hasOwnProperty(this.slug)) {
            this.link = this.demoVideoKeys[this.slug as keyof IDemoVideo];
          }
        }
      })
    );
  }

  /**
   * @description Initialize Fancybox tracking for video watch progress
   */
  private initFancyboxTracking(): void {

    if (DemoVideoComponent.fancyboxInitialized) {
      return;
    }

    if (typeof $ !== 'undefined' && $.fancybox) {
      DemoVideoComponent.fancyboxInitialized = true;
    }
  }



  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
