interface IPayrollList{
  title: string;
  icon: string;
  id: string;
  connected: boolean;
  isManual?:boolean;
}

export class payrollList {
  static payrollApps() {
    return [
      {
        title: 'Extension for Unlisted Apps',
        icon: 'puzzle-piece',
        id: 'extension',
        connected: false,
        isManual: true
      },
      {
        title: 'ADP Run Payroll ',
        icon: '/assets/images/integration/adp-logo1.png',
        id: 'adp-run',
        connected: false
      },
      {
        title: 'Gusto',
        icon: '/assets/images/integration/gusto-latest-logo.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Zoho Payroll',
        icon: '/assets/images/integration/payroll-latest-logo.png',
        id: 'zoho',
        connected: false
      },
      {
        title: 'Paychex',
        icon: '/assets/images/integration/paychex.png',
        id: 'paychex',
        connected: false
      },
      {
        title: 'ADP Work Force',
        icon: '/assets/images/integration/adp-logo1.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'UKG Pro',
        icon: '/assets/images/integration/ukgpro.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'UKG Ready',
        icon: '/assets/images/integration/ukgpro.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Paylocity',
        icon: '/assets/images/integration/paylocity.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Trinet',
        icon: '/assets/images/integration/trinet.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Factorial',
        icon: '/assets/images/integration/factorial.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Proliant',
        icon: '/assets/images/integration/proliant.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Rippling',
        icon: '/assets/images/integration/rippling.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'SAP',
        icon: '/assets/images/integration/sap.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Intuit QuickBooks Payroll',
        icon: '../../../../../assets/images/integration/qb-logo-stacked.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Workday',
        icon: '../../../../../assets/images/integration/workday.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Paycor',
        icon: '../../../../../assets/images/integration/Paycor.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Paycom',
        icon: '../../../../../assets/images/integration/paycom.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Deel',
        icon: '../../../../../assets/images/integration/deel.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Square',
        icon: '../../../../../assets/images/integration/square.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Insperity',
        icon: '../../../../../assets/images/integration/Insperity.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Netchex',
        icon: '../../../../../assets/images/integration/netchex.jpeg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'BambooHR',
        icon: '../../../../../assets/images/integration/BambooHR.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Justworks',
        icon: '../../../../../assets/images/integration/Justworks.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'SurePayroll',
        icon: '../../../../../assets/images/integration/surepayroll.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Greenshades',
        icon: '../../../../../assets/images/integration/Greenshades.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Ceridian',
        icon: '../../../../../assets/images/integration/Ceridian.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Namely',
        icon: '../../../../../assets/images/integration/Namely.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'OnPay',
        icon: '../../../../../assets/images/integration/onpay.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Payentry',
        icon: '../../../../../assets/images/integration/payentry.jpg',
        id: ' bypass',
        connected: false
      },
      {
        title: 'Viventium',
        icon: '../../../../../assets/images/integration/viventium.jpg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Heartland Payment System',
        icon: '../../../../../assets/images/integration/heartland.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'TimeClock Plus',
        icon: '../../../../../assets/images/integration/timeclock.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Patriot Software',
        icon: '../../../../../assets/images/integration/patriot.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Coastal Payroll',
        icon: '../../../../../assets/images/integration/coastal-payroll.jfif',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Fingercheck',
        icon: '../../../../../assets/images/integration/finger-check-payroll.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'PrimePay',
        icon: '../../../../../assets/images/integration/prime-payy-payroll.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Usemultiplier',
        icon: '../../../../../assets/images/integration/multiplier.jfif',
        id: 'bypass',
        connected: false
      },
      {
        title: 'isolved HCM',
        icon: '../../../../../assets/images/integration/isolved-payroll.svg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Asure Software',
        icon: '../../../../../assets/images/integration/assure-payroll.webp',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Wagepoint',
        icon: '../../../../../assets/images/integration/wagepoint.jfif',
        id: 'bypass',
        connected: false
      },
      {
        title: 'EPAY Systems',
        icon: '../../../../../assets/images/integration/epay.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Payroll Network',
        icon: '../../../../../assets/images/integration/payroll-network.webp',
        id: 'bypass',
        connected: false
      },
      {
        title: 'The Payroll Company',
        icon: '../../../../../assets/images/integration/tpc.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Deluxe Payroll',
        icon: '../../../../../assets/images/integration/delux-payroll.jpg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'CheckWise Payroll',
        icon: '../../../../../assets/images/integration/checkwise-payroll.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Payroll4Construction',
        icon: '../../../../../assets/images/integration/payroll4construction.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Apex hcm',
        icon: '../../../../../assets/images/integration/apex-hcm-payroll.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Blue Marble Payroll',
        icon: '../../../../../assets/images/integration/blue-marble.png',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Dominion Payroll ',
        icon: '../../../../../assets/images/integration/dominionpayroll.jpg',
        id: 'bypass',
        connected: false
      },
      {
        title: 'Fuse Workforce',
        icon: '../../../../../assets/images/integration/fuse-workforce.jfif',
        id: 'bypass',
        connected: false
      }
    ] as IPayrollList[];
  }
}
