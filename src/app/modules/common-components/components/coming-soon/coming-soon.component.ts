import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss'],
  standalone: true,
  imports: [FaIconComponent, RouterLink, NgOptimizedImage]
})
export class ComingSoonComponent {
  faArrowLeft = faArrowLeft;
  title: string;
  private route = inject(ActivatedRoute);


  constructor() {
    this.route.data.subscribe((data) => {
      this.title = data.title;
    });
  }
}
