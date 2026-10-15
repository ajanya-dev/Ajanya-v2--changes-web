import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-process-card-completed',
  templateUrl: './process-card-completed.component.html',
  styleUrls: ['./process-card-completed.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class ProcessCardCompletedComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  status: string;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.subscription.push(
      this.activatedRoute.queryParams.subscribe((res) => {
        this.status = res?.status;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((e) => e?.unsubscribe());
  }
}
