import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IWhatsNewSlider } from 'src/app/layout/model/header';
import { finalize } from 'rxjs/operators';
import { DatePipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-whats-new',
  templateUrl: './whats-new.component.html',
  styleUrls: ['./whats-new.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgIf, DatePipe]
})
export class WhatsNewComponent implements OnInit {
  subscriptions: Subscription[] = [];
  whatsnewslider: IWhatsNewSlider[];
  currentdate: string | null;
  currentSlide = 0;
  currentItem: IWhatsNewSlider | undefined;

  constructor(
    private _headerService: HeaderService,
    public dialogRef: MatDialogRef<WhatsNewComponent>,
    private route: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.sliderDatadetails();
    this.currentdate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  }

  removeLoadedSkelton(): void {
    const whats_new_skelton: NodeListOf<HTMLElement> =
      document.querySelectorAll('.skelton')!;
    whats_new_skelton.forEach((item) => item.classList.remove('skelton'));
  }

  // whats-new data here
  sliderDatadetails(): void {
    this.subscriptions.push(
      this._headerService
        .getSliderDataDetails()
        .pipe(
          finalize(() => {
            this.removeLoadedSkelton();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (res.data?.length) {
              this.whatsnewslider = res.data;
              this.currentItem = this.whatsnewslider[this.currentSlide];
              if (this.whatsnewslider.length > 1) {
                setInterval(this.slideNext, 5000);
              }
            }
          }
        })
    );
  }

  slidePrev = () => {
    if (this.currentSlide <= 0) {
      this.currentSlide = this.whatsnewslider.length - 1;
      this.currentItem = this.whatsnewslider[this.currentSlide];
      return;
    }
    this.currentSlide--;
    this.currentItem = this.whatsnewslider[this.currentSlide];
  };

  slideNext = () => {
    if (this.currentSlide >= this.whatsnewslider.length - 1) {
      this.currentSlide = 0;
      this.currentItem = this.whatsnewslider[this.currentSlide];
      return;
    }
    this.currentSlide++;
    this.currentItem = this.whatsnewslider[this.currentSlide];
  };

  openWindow(url: string) {
    this.close();
    this.route.navigateByUrl(url);
  }

  close() {
    this.dialogRef.close();
  }
}
