import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { LucideAngularModule, Building2, Check } from 'lucide-angular';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { IAllCompanies, IInvitedCompany } from '../../model/header';


@Component({
  selector: 'app-header-company-dropdown-v4',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header-company-dropdown-v4.component.html',
  styleUrl: './header-company-dropdown-v4.component.scss'
})
export class HeaderCompanyDropdownV4Component {
  @Input() allCompanies: IAllCompanies;
  @Input() activeCompanyId: string = '';
  @Output() selectedCompany = new EventEmitter();

  readonly Building2Icon = Building2;
  readonly CheckIcon = Check;

  private router = inject(Router);
  private alertService = inject(AlertService);
  private companyManagementService = inject(CompanyManagementService);
  private destroyRef = inject(DestroyRef);
  
  selectCompany(
    company: IInvitedCompany,
    type: string,
    isItInvitedCompany = false
  ): void {
    if (company.isClosed === 1) {
      this.alertService.warningAlert({
        title: 'Error',
        content:
          'The selected company is scheduled for deletion. Please choose a different company and try again.'
      });
      return;
    }
    this.companyManagementService.checkCompanyAccessPermission(
      company.companyId,
      (res) => this.onCompanyAccess(res,isItInvitedCompany,company,type)
    )
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe();
  }

  onCompanyAccess(data: {success:boolean,access:number,errorMsg:string,errorCode:number},isItInvitedCompany:boolean,company:IInvitedCompany,type:string){
    if(data.success && data.access === 1){
      if(isItInvitedCompany){
        this.checkCompanyPermssion(company, type);
      }else{
        this.selectedCompany.emit({
          companyId: company.companyId,
          companyName: company.companyName,
          type,
          status: company.status
        });
        this.navigateToManageCompany(company);
      }
    }
  }

  async checkCompanyPermssion(company: IInvitedCompany, type: string) {
    try {
      const hasPermission = await this.companyManagementService.checkPermission(
        company.companyId
      );
      if (hasPermission) {
        this.selectedCompany.emit({
          companyId: company.companyId,
          companyName: company.companyName,
          type,
          status: company.status
        });

        this.navigateToManageCompany(company);
      }
    } catch (error) {
      /* empty */
    }
  }

  /**
   * Initiates navigation to the company management page and updates the company management service with the selected company details.
   *
   * @param {IInvitedCompany} company - Details of the company to manage.
   */
  navigateToManageCompany(company: IInvitedCompany) {
    const isV4 = this.router.url.includes('/v4/');

    if (company && company.status !== 1) {
      this.companyManagementService.invitedCompanySubject.next(company);
      if(company.status===0 || company.status===3){
        this.router.navigate(['manage/company_management/index/company_management']);
        return;
      }
      this.router.navigate([isV4 ? '/v4/manage/home' : '/manage/home']);
    } else if (isV4) {
      this.router.navigate(['/v4/manage/home']);
    } else if (this.router.url === '/manage/home') {
      location.reload();
    } else {
      const navigationSub = this.router.events.subscribe((event) => {
        if (
          event instanceof NavigationEnd &&
          event.urlAfterRedirects === '/manage/home'
        ) {
          location.reload();
          navigationSub.unsubscribe();
        }
      });

      this.router.navigate(['/manage/home']);
    }
  }

}
