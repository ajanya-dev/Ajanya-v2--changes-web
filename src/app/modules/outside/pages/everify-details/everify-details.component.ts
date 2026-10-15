import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IAppConfig } from 'src/app/models/app_settings';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { environment } from 'src/environments/environment';
import { NgIf, DatePipe } from '@angular/common';

@Component({
  selector: 'app-everify-details',
  templateUrl: './everify-details.component.html',
  styleUrls: ['./everify-details.component.scss'],
  standalone: true,
  imports: [RouterLink, NgIf, DatePipe]
})
export class EverifyDetailsComponent implements OnInit {
  environment = environment;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  bottomSection = false;
  loading = false;
  checkDetails: any;
  appConfig: IAppConfig;
  learnMore = true;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((data) => {
      this.checkDetails = data;
    });
  }
  moreDetails() {
    this.bottomSection = true;
    this.learnMore = false;
  }
  onGoToWebsite(): void {
    window.open(StaticWhiteLabelConditions.website);
  }
}
