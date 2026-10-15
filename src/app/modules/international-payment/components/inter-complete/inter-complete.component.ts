import { Component, inject, input, output } from '@angular/core';
import { IInternationalPaymentHistory } from 'src/app/models/wallet';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheckCircle } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-inter-complete',
  standalone: true,
  imports: [CommonButtonV35Component,CurrencyPipe,DecimalPipe,FaIconComponent],
  templateUrl: './inter-complete.component.html',
  styleUrl: './inter-complete.component.scss'
})
export class InterCompleteComponent {
  public walletDataService = inject(WalletDataV35Service);
  paymentHistory = input<IInternationalPaymentHistory>();
  private router  = inject(Router);

  faCheckCircle = faCheckCircle;
  deliveryTime: string = '1-2 Business Days';
  complete = output<string>();

  makeAnotherTransfer() {
    this.complete.emit('new');
  }

  convertDate(originalDate: string): string {
    if(!originalDate) return '';
    // Split the original date string
    const [datePart, timePart] = originalDate.split('_');
    
    // Parse date parts
    const [month, day, year] = datePart.split('/').map(Number);
    
    // Parse time parts
    const [time, meridiem] = timePart.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    let convertedHours = hours;
    if (meridiem.toLowerCase() === 'pm' && hours !== 12) {
      convertedHours += 12;
    }
    if (meridiem.toLowerCase() === 'am' && hours === 12) {
      convertedHours = 0;
    }
    
    // Create Date object
    const date = new Date(year, month - 1, day, convertedHours, minutes);
    
    // Manual formatting
    const formattedMonth = date.getMonth() + 1; // getMonth() is 0-indexed
    const formattedDay = date.getDate();
    const formattedYear = date.getFullYear();
    
    // Format hours and minutes with leading zeros
    const formattedHours = date.getHours() % 12 || 12; // Convert to 12-hour format
    const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    
    // Construct the final formatted string
    return `${formattedMonth}/${formattedDay}/${formattedYear}, ${formattedHours}:${formattedMinutes}:00${ampm}`;
  }

  navigateToTransfer(){
    this.router.navigate(['manage/international-payment/index'],
      {
        queryParams: {
          tab: 'recent-transactions'
        }
      }
    );
  }
  
}
