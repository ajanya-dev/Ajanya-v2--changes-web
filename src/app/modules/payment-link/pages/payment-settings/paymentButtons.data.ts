import { environment } from 'src/environments/environment';

export class PaymentButtons {
  private rootUrl = environment.rootUrl.split('/api/v4')[0];

  private images: { [key: string]: string } = {
    'pay-now': 'new-2.png',
    stripe: 'new-3.png',
    card: 'new-4.png',
    'bit-pay': 'new-5.png',
    check: 'new-6.png',
    donate: 'new-d-7.png'
  };

  getV1Buttons(config: {
    paymentId: string;
    shortUrl: string;
    amount?: string | number;
  }): IPaymentButtons[] {
    return Object.values(this.images).map((image) => ({
      imageName: image,
      buttonImage: `${this.rootUrl}/cdn/getpaidform/${image}`,
      htmlButtonCode: `<a href="${
        config.shortUrl ? `https://paybycheck.io/${config.shortUrl}` : ''
      }${
        config.amount ? `/${config.amount}` : ''
      }" target="_blank"><img src="https://cdn.onlinecheckwriter.com/cdn/getpaidform/${image}"></a>`,
      htmlWidgetCode: `<div id="ocw-widget" data-img="${image}" ${
        config.amount ? `data-amount="${config.amount}" ` : ''
      }data-id="${
        config.paymentId
      }"></div><script src="https://js.paybycheck.io/v1/widget.js" type="text/javascript"></script>`,
      snippetCode: `<script> OcwWidget.init({ id:"${
        config.paymentId
      }", buttonImage: "${image}", ${
        config.amount ? `amount="${config.amount}", ` : ''
      } isWidget:true }) </script>`
    })) as IPaymentButtons[];
  }

  getV2Buttons(config: {
    paymentId: string;
    shortUrl?: string;
    amount?: string | number;
  }): IPaymentButtons[] {
    return Object.keys(this.images).map((imageName) => ({
      imageName: this.images[imageName],
      buttonImage: `${this.rootUrl}/cdn/getpaidform/${this.images[imageName]}`,
      htmlButtonCode: `<script src="https://js.paybycheck.io/v2/widget.js" type="text/javascript"></script>,
<ocw-pay-button
  payment-id="${config.paymentId}"
  btn-style="${imageName}" ${
    config.amount
      ? `
  amount="${config.amount}"`
      : ''
  }
></ocw-pay-button>`,
      htmlWidgetCode: `<script src="https://js.paybycheck.io/v2/widget.js" type="text/javascript"></script>
<ocw-pay-modal
  payment-id="${config.paymentId}"
  id="ocw-payment-modal" ${
    config.amount
      ? `
  amount="${config.amount}"`
      : ''
  }
></ocw-pay-modal>`,
      snippetCode: `<script src="https://js.paybycheck.io/v2/widget.js" type="text/javascript"></script>
<script>
  OcwWidget.init({
    id:"${config.paymentId}",
    buttonImage: "${imageName}", ${
      config.amount
        ? `
    amount: "${config.amount}"`
        : ''
    }
  })
</script>`
    })) as IPaymentButtons[];
  }

  hrefExtractor(inputString: string) {
    // Using a regular expression to extract the href attribute
    const hrefRegex = /<a\s+[^>]*?href\s*=\s*["']([^"']*)["'][^>]*>/;
    const match = inputString.match(hrefRegex);

    if (match && match.length >= 2) {
      const hrefValue = match[1];
      return hrefValue;
    }
    return '';
  }
}

export interface IPaymentButtons {
  imageName:
    | 'new-2.png'
    | 'new-3.png'
    | 'new-4.png'
    | 'new-5.png'
    | 'new-6.png'
    | 'new-d-7.png';
  buttonImage: string;
  htmlButtonCode: string;
  htmlWidgetCode: string;
  snippetCode: string;
}
