import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faPlus } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-refer-and-earn-mlm-modal',
  standalone: true,
  imports: [FaIconComponent, MatDialogClose, NgClass],
  templateUrl: './refer-and-earn-mlm-modal-new.component.html',
  styleUrl: './refer-and-earn-mlm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReferAndEarnMlmModalComponent {
  faPlus = faPlus;
  faCicleInfo = faCircleInfo;

  data = [
    {
      heading: 'Initial Subscription Payment',
      desc: {
        descHeader: 'Direct Commission',
        desc: `50% of referred user's first payment`
      },
      breakDowns: {
        title: 'Commission Breakdown',
        values: [
          { name: 'Level 1', value: '16%' },
          { name: 'Level 2', value: '8%' },
          { name: 'Level 3', value: '4%' },
          { name: 'Level 4', value: '2%' },
          { name: 'Level 5', value: '1%' }
        ]
      }
    },
    {
      heading: 'Subsequent Monthly Subscription',
      desc: {
        descHeader: 'Monthly Commission',
        desc: `5% of referred user's monthly subscription (for 12 months)`
      }
      // breakDowns: {
      //   title: 'Ongoing Commission Breakdown',
      //   values: [
      //     { name: "B's Commisson", value: '16%' },
      //     { name: "C's Commisson", value: '8%' },
      //     { name: "D's Commisson", value: '4%' },
      //     { name: "E's Commisson", value: '2%' },
      //     { name: "F's Commisson", value: '1%' }
      //   ]
      // }
    }
  ];

  commissionData = {
    table_heading_one: 'Credits Granted(up to)',
    table_heading_two: 'Refer Commission(%)',
    values: [
      { name: '100', value: '50%' },
      { name: '150', value: '48.5%' },
      { name: '200', value: '47%' },
      { name: '250', value: '45.5%' },
      { name: '300', value: '44%' },
      { name: '350', value: '42.5%' },
      { name: '400', value: '41%' },
      { name: '450', value: '39.5%' },
    ]
  };
}
