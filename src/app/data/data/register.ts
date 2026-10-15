import { ISocialIcon } from 'src/app/modules/auth/components/register/model/register';

export class register {
  static socialIcons(): ISocialIcon[] {
    return [
      {
        name: 'Google',
        image: 'google.svg',
        url: 'loginwith/google'
      },
      {
        name: 'Linkedin',
        image: 'linkedIn.svg',
        url: 'loginwith/linkedin'
      },
      {
        name: 'Microsoft',
        image: 'microsoft.svg',
        url: 'loginwith/microsoft'
      },
      {
        name: 'Xero',
        image: 'xero.svg',
        url: 'api/v4/loginwith/xero',
        styles: { img: { width: '29px', height: '29px' } }
      },
      {
        name: 'Amazon',
        image: 'amazon.svg',
        url: 'loginwith/amazon',
        styles: { img: { width: '40px', height: '40px' } }
      },
      {
        name: 'Azure',
        image: 'office.svg',
        url: 'loginwith/azure'
      },
      {
        name: 'Twitter',
        image: 'twitter.svg',
        url: 'loginwith/twitter'
      },
      // {
      //   name: 'Freshbooks',
      //   image: 'freshbooks.svg',
      //   url: 'api/v4/loginwith/freshbooks',
      //   styles: { img: { width: '60px', height: '30px' } }
      // }
    ];
  }
}
