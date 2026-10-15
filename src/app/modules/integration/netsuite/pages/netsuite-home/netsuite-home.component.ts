import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { OnInit, OnDestroy, inject, Component, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { INetSuiteCompanyDetails } from 'src/app/modules/integration/model/integration';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, NgFor, NgClass, NgOptimizedImage } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faGear } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { ConnectNetsuiteModalComponent } from '../../modals/connect-netsuite-modal/connect-netsuite-modal.component';
import { NetsuiteSettingsModalComponent } from '../../modals/netsuite-settings-modal/netsuite-settings-modal.component';

// interface IMergeLink {
//   initialize(options: {
//     linkToken: string;
//     onSuccess: (public_token: string) => void;
//     shouldSendTokenOnSuccessfulLink: boolean;
//   }): void;
// }

// declare let MergeLink: IMergeLink;

/**
 * Component for managing NetSuite integration and importing payees.
 */
@Component({
  selector: 'app-netsuite-home',
  templateUrl: './netsuite-home.component.html',
  styleUrls: ['./netsuite-home.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    NgIf,
    NgFor,
    MatTooltip,
    NgClass,
    CustomerSupportComponent,
    CommonButtonV35Component,
    NgOptimizedImage,
    FontAwesomeModule,
    MatTooltipModule,
    RouterLink
  ]
})
export class NetsuiteHomeComponent implements OnInit, OnDestroy {
  private netSuiteintegrationService = inject(NetsuiteIntegrationService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  subscriptions: Subscription[] = [];

  env = environment;

  loading = {
    globalLoading: false,
    defaultLoading: false,
    importLoading: false
  };

  instructions: string[] = [
    'Click on connect',
    'Authenticate with your NetSuite credentials'
  ];

  isConnected = false;
  apiToken: string;
  userOriginId: string;
  publicToken: string;
  companyDetails: INetSuiteCompanyDetails[];
  isCompanies = false;
  isSuccess = false;
  syncStatus: number;
  netSuiteId: string;
  faGear = faGear;

  /** Used to hide old html code.This condition is removed when netsuite work with merge. */
  isOldNetSuite = false;

  /**
   * Source of the import.
   */
  source = signal<string>('');

  /**
   * Flag to track if settings modal has been opened for payments source.
   */
  isSettingsOpen = signal<boolean>(false);

  /**
   * Initializes the component and checks NetSuite connection status.
   */
  ngOnInit(): void {
    // this.scriptService.addScript('', '', 'https://cdn.merge.dev/initialize.js');
    // this.checkNetSuiteConnected();
    this.onCheckNetSuiteConnection();
    this.source.set(history.state?.source);
    this.checkOAuthSuccess();
  }

  /**
   * @description Shows a success modal when redirected back from the NetSuite
   * OAuth flow with `?success=1`, then removes the query param from the URL.
   */
  checkOAuthSuccess(): void {
    if (this.route.snapshot.queryParamMap.get('success') === '1') {
      this.alertService.successAlert({
        content: 'Successfully connected to NetSuite.'
      });
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  /**
   * @description Checks the connection status of Netsuite.
   */
  onCheckNetSuiteConnection(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this.netSuiteintegrationService
        .getNetSuiteConnectionDetails()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.netSuiteId = res.data.id;
            if (res.data.connected === 0) {
              this.isConnected = false;
            } else {
              this.isConnected = true;
              if(this.source() === 'payments' && !this.isSettingsOpen()) {
                this.isSettingsOpen.set(true);
                this.openSettings();
              }
            }
          }
        })
    );
  }

  /**
   * @description Handles connecting or disconnecting from Netsuite based on current connection status.
   */
  onConnectNetsuite(): void {
    if (this.isConnected) {
      this.onDisConnect();
    } else {
      this.onConnect();
    }
  }

  /**
   * @description Opens the modal to connect to Netsuite.
   */
  onConnect(): void {
    this.dialog
      .open(ConnectNetsuiteModalComponent, {
        width: '400px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.onCheckNetSuiteConnection();
        }
      });
  }

  /**
   * @description Handles disconnecting from Netsuite.
   */
  onDisConnect(): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading.defaultLoading = true;
        this.subscriptions.push(
          this.netSuiteintegrationService
            .onDisconnectNetSuite(this.netSuiteId)
            .pipe(
              finalize(() => {
                this.loading.defaultLoading = false;
              })
            )
            .subscribe((response) => {
              if (response.success) {
                this.onCheckNetSuiteConnection();
                this.alertService.successAlert({
                  content: 'Successfully disconnected.'
                });
              }
            })
        );
      }
    });
  }

  /**
   * @description Opens the Netsuite settings modal.
   */
  openSettings(): void {
    this.dialog.open(NetsuiteSettingsModalComponent, {
      maxWidth: '740px',
      width: '80%',
      disableClose: true
    });
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /** Below Code Temporarly commented.This code use when netsuite work with Merge. */

  // /**
  //  * Handles the event when the "Connect" button is clicked.
  //  * Initiates the NetSuite integration connection process.
  //  */
  // onConnectToNetsuite() {
  //   if (this.isConnected === false) {
  //     this.loading.defaultLoading = true;
  //     this.subscriptions.push(
  //       this.netSuiteintegrationService
  //         .connectNetsuite()
  //         .pipe(finalize(() => {(this.loading.defaultLoading = false);}))
  //         .subscribe((res) => {
  //           if (res) {
  //             this.apiToken = res.data.linkToken;
  //             this.userOriginId = res.data.userOriginId;
  //             this.mergeLink();
  //           }
  //         })
  //     );
  //   } else {
  //     const dRef = this.alertService.confirmAlert({
  //       content: 'Are you sure you want to disconnect?',
  //       doneMsg: 'Yes'
  //     });
  //     dRef.afterClosed().subscribe((res) => {
  //       if (res) {
  //         this.loading.defaultLoading = true;
  //         this.subscriptions.push(
  //           this.netSuiteintegrationService
  //             .disConnectNetSuite()
  //             .pipe(finalize(() => {(this.loading.defaultLoading = false);}))
  //             .subscribe((response) => {
  //               if (response) {
  //                 this.isCompanies = false;
  //                 this.isConnected = false;
  //               }
  //             })
  //         );
  //       }
  //     });
  //   }
  // }

  // /**
  //  * Initializes the MergeLink for NetSuite integration.
  //  */
  // mergeLink(): void {
  //   MergeLink.initialize({
  //     // Replace ADD_GENERATED_LINK_TOKEN with the token retrieved from backend
  //     linkToken: this.apiToken,
  //     onSuccess: (public_token: string) => this.onSuccess(public_token),
  //     // A value of `false` for `shouldSendTokenOnSuccessfulLink` makes Link call `onSuccess`
  //     // account has been successfully linked if user
  //     // closes the Link modal.
  //     shouldSendTokenOnSuccessfulLink: false
  //   });
  //   //  iframe comes as hidden so we make it visible
  //   const iframe = document.getElementById(
  //     'merge-link-iframe'
  //   ) as HTMLIFrameElement;
  //   if (iframe && iframe.style.display === 'none') {
  //     iframe.style.display = 'block';
  //   }
  // }

  // /**
  //  * Handles the successful integration with NetSuite.
  //  * @param token The public token obtained during the integration.
  //  */
  // onSuccess(token: string): void {
  //   this.loading.defaultLoading = true;
  //   this.publicToken = token;
  //   if (this.publicToken) {
  //     this.subscriptions.push(
  //       this.netSuiteintegrationService
  //         .getAccountToken(token, this.userOriginId)
  //         .pipe(finalize(() => {(this.loading.defaultLoading = false);}))
  //         .subscribe((res) => {
  //           if (res.success) {
  //             this.importNetSuiteCompany();
  //           }
  //         })
  //     );
  //   }
  // }

  // /**
  //  * Checks if NetSuite is connected and retrieves company details if connected.
  //  */
  // checkNetSuiteConnected() {
  //   this.loading.defaultLoading = true;
  //   this.subscriptions.push(
  //     this.netSuiteintegrationService
  //       .getNetSuiteDetails()
  //       .pipe(finalize(() => {(this.loading.defaultLoading = false);}))
  //       .subscribe((res) => {
  //         this.syncStatus = res.data.syncStatus;
  //         if (res.data.connected === 1) {
  //           this.companyDetails = res.data.companies;
  //           this.isConnected = true;
  //           this.isCompanies = true;
  //         }
  //       })
  //   );
  // }

  // /**
  //  * Disconnects a NetSuite company.
  //  * @param id The ID of the company to disconnect.
  //  */
  // disconnectNetSuitCompany(id: string) {
  //   const params = {
  //     companyId: id
  //   };

  //   const dRef = this.alertService.confirmAlert({
  //     content: 'Are you sure you want to disconnect?',
  //     doneMsg: 'Yes'
  //   });
  //   dRef.afterClosed().subscribe((res) => {
  //     if (res) {
  //       this.subscriptions.push(
  //         this.netSuiteintegrationService
  //           .disConnectCompany(params)
  //           .subscribe((response) => {
  //             if (response) {
  //               this.alertService.successAlert({ content: 'Disconnected' });
  //               this.checkNetSuiteConnected();
  //             }
  //           })
  //       );
  //     }
  //   });
  // }

  // /**
  //  * Opens the import payee modal for NetSuite companies.
  //  */
  // importPayeeForNetSuite() {
  //   this.dialog.open(ImportPayeeNetsuiteModalComponent, {
  //     maxWidth: '580px',
  //     width: '93%',
  //     data: this.companyDetails,
  //     disableClose: true
  //   });
  // }

  // /**
  //  * Initiates the import of NetSuite company details.
  //  */
  // importNetSuiteCompany() {
  //   this.loading.importLoading = true;
  //   this.loading.defaultLoading = true;
  //   const formData = {
  //     code: 'netsuite'
  //   };

  //   this.subscriptions.push(
  //     this.netSuiteintegrationService
  //       .importCompanyDetails(formData)
  //       .pipe(
  //         finalize(() => {
  //           this.loading.importLoading = false;
  //           this.loading.defaultLoading = false;
  //         })
  //       )
  //       .subscribe((res) => {
  //         if (res) {
  //           this.checkNetSuiteConnected();
  //         }
  //       })
  //   );
  // }
}
