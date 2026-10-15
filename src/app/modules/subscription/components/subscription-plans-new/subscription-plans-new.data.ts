import {
  faChartSimple,
  faGrid2Plus,
  faDollarSign,
  faMessageMiddle,
  faHeadset,
  faGlobe,
  faThumbsUp
} from '@fortawesome/pro-solid-svg-icons';

export const planFeatures = {
  'pay-as-you-go-monthly-v3': {
    fromCard: {
      title: 'Pay Anyone With a Credit Card',
      tooltip:
        'Pay anyone using your credit card balance even if they do not accept your card. You can use it to earn rewards or to increase your cash flow.',
      calcuator: true,
      values: [
        {
          name: 'Card Processing Fee',
          value: '2.9%',
          type: 'string',
          tooltip: ''
        },
        {
          name: 'ACH',
          min: '0.05%',
          max: '$10.00',
          type: 'minMax',
          tooltip: ''
        },
        {
          name: 'Same Day ACH',
          min: '0.2%',
          max: '$12.00',
          type: 'minMax',
          tooltip: ''
        },
        {
          name: 'Wire',
          value: '$10.00',
          type: 'string',
          tooltip: ''
        },
        {
          name: 'Virtual Card',
          value: 'Free',
          type: 'string',
          tooltip: ''
        }
      ]
    },
    fromWallet: {
      title: 'From Wallet',
      tooltip:
        'Upon signing up, a wallet is automatically created, similar to PayPal. Refill it via ACH, wire, or instant bank push. Multiple funding options are available. Create as many wallets as needed for your business.',
      values: [
        {
          name: 'Check Mail',
          value: 'Free',
          type: 'string',
          color: true,
          tooltip:
            'Keep your wallet pre-funded for instant payments via RTP, Fed-Now, Push to Card, or same-day ACH.'
        },
        {
          name: 'ACH, Same Day ACH',
          min: '1%',
          max: '$5.00',
          type: 'minMax',
          tooltip:
            'Keep your wallet pre-funded for instant payments via RTP, Fed-Now, Push to Card, or same-day ACH.'
        },
        {
          name: 'Wire (Domestic)',
          value: '$12.00',
          type: 'string',
          tooltip:
            "Keep your wallet pre-funded to send a quick wire with a click. Don't let your business deals fall behind."
        },
        {
          name: 'Wire (International)',
          value: '$25.00',
          type: 'string',
          tooltip:
            'Keep your wallet pre-funded to send a quick international wire from your PC or phone, anywhere in the world.'
        }
      ]
    },
    fromBank: {
      title: 'From Your Bank A/C',
      tooltip:
        "Add as many Bank Ac as you need, compatible with any US or Canadian bank. Add manually or instantly. Printing checks doesn't require bank verification, but ACH or electronic formats do, either instantly or via micro-deposit.",
      values: [
        {
          name: 'Check Printing',
          value: '$1.00',
          type: 'string',
          tooltip:
            'Print checks online instantly from any bank account on any printer, using blank check paper or plain white paper. '
        },
        {
          name: 'Email Check',
          value: '$1.00',
          type: 'string',
          tooltip:
            'Email a One-Time printable, trackable check, and the recipient can print it on plain white paper or blank check paper'
        },
        {
          name: 'ACH / Direct Deposit',
          min: '1%',
          max: '$5.00',
          type: 'minMax',
          tooltip:
            "Send anyone ACH or direct deposit. If you don't have the recipient's account number, we will collect and verify it via email or text for you"
        },
        {
          name: 'ACH - Same Day',
          min: '1%',
          max: '$10.00',
          type: 'minMax',
          tooltip: 'Send same day ACH in emergencies'
        },
        { name: 'Wire (Domestic)', value: '$15.00', type: 'string' },
        { name: 'Wire (International)', value: '$30.00', type: 'string' },
        // {
        //   name: 'Pay by Credit Card',
        //   desc: '(We send them ACH/Wire or Paper Check)',
        //   value: '2.95%',
        //   type: 'string',
        //   color: true,
        //   tooltip:
        //     'Pay your vendors, taxes, rent, or payroll using your credit card balance when short on cash, even if they do not accept cards. We will send them ach, wire, or a paper check of their choice. Keep all your credit card rewards and cash back'
        // },
        {
          name: 'Mail Check In One Click ',
          desc: '(USPS / Fedex)',
          value: '$1.25',
          type: 'string',
          color: true,
          tooltip:
            "Print and mail your check in one click on the same business day. Choose from a variety of mailing options: First class, First class tracking, Priority, Express, Fedex overnight, and certified mail. Prices are all-inclusive of printing MICR, stamps, envelopes, etc. Customize all checks with your own design and template. Add any attachments like invoices or pay stubs along with your check mailing for an additional fee. Don’t worry about pre-designed templates used by other service providers. Use any of your check designs. Please see below for specific pricing. We've got every custom option you need. Just tell us!!"
        },
        {
          name: 'Documents Mailing',
          value: '$1.00',
          type: 'string',
          color: true,
          tooltip:
            'Mail any kind of document in one click. Choose from all available mailing options via USPS and FedEx.'
        }
      ]
    },
    features: {
      title: 'Features',
      values: [
        {
          name: 'Bank Accounts Allowed',
          value: '3',
          type: 'string',
          tooltip: 'Add any bank account from the US or Canada regions.'
        },
        {
          name: 'International Payments',
          value: 'FX Rate',
          type: 'string',
          tooltip:
            'Pay anyone across the world. Most payments are processed within minutes.',
          color: true
        },
        {
          name: 'Users',
          value: '3',
          type: 'string',
          tooltip:
            'Assign roles with specific permissions based on your needs. Implement a role-based, multi-level approval process or limit access to certain bank accounts, transaction amounts, or payees. Require higher authority approval for transactions exceeding specified amounts. Control visibility of transactions and user data, and set restrictions on deleting or voiding payments. Limit access to specific computers, ip addresses, days, or times. Customize roles for your users or managers to suit your requirements.'
        },
        {
          name: 'Positive Pay (Per Account)',
          value: '$199.99',
          type: 'string',
          tooltip:
            'Positive pay is a fraud prevention service where a bank verifies your payment details before clearing a transaction. When you issues a check or ach payment, we notify your bank right away with specific details. The bank then matches these details with the presented payment. If the information does not match, the payment is rejected. This system helps prevent unauthorized transactions and reduces the risk of fraud 100%. You need to talk to your bank and have them turn on this feature for you. Most major bank have automated way. They provide you a sepcific positive pay FTP credential or API. We set it up for you. Even after you issue a payment, if you void that payment, that also pass over to your bank and your bank will not honor that payment. Some banks who do not have automated way give you and option to upload every day to their online platform, in this case we provide their specific needed and formated excel/csv file for you. We can custmise and work with anyway file or the formated way it required by your bank to make secured each and every payemtns.'
        },
        {
          name: 'Full Integration Suite',
          desc: '(including accounting software)',
          value: true,
          tooltip:
            "Seamlessly integrate with any accounting software of your choice. Automatically integrate with any platform you already have. Import or export data effortlessly. We've integrated with nearly all major accounting software. If we don't support it yet, we'll custom-create the integration for you within a few days. We work with any customer flow you need, integrating with any software you require.",
          type: 'check'
        },
        {
          name: 'Receive Payment Link',
          value: true,
          type: 'check',
          tooltip:
            'Send a payment link via text or email for one-time, recurring, or open payments. Seamlessly collect any type of payment like rent, association fees, customer payments, donations, or any other payments via this link. Choose to receive payments via ACH, paper check, or credit card, or connect with your PayPal, Stripe accounts, or any cryptos. We can also create custom payment solutions to meet your specific requirements.'
        },
        {
          name: 'Recurring Payments',
          desc: '(Send/Receive)',
          value: true,
          type: 'check',
          tooltip:
            'Send or collect recurring payments with one-time setup. Set up recurring payments for a specific number of payments or time periods using any method, including paper check, direct deposit, ACH, or credit card.'
        },
        {
          name: 'Cloud Banking',
          value: true,
          type: 'check',
          tooltip:
            'Open a US bank account from anywhere in the world within minutes. We will issue an FDIC-insured bank account number through our FDIC-insured banking partners'
        },
        {
          name: 'Bill & Invoice',
          value: true,
          type: 'check',
          tooltip:
            'Manage your bills efficiently. Set up due dates in advance for automatic or manual processing, optimizing your cash flow based on vendor negotiations. Create professional invoices and send them via text, email, USPS, or FedEx overnight with a single click.'
        },
        {
          name: 'Vendor Credits & Credit Memos',
          value: true,
          type: 'check',
          tooltip:
            'Manage vendor credits & refunds efficiently. Keep track of vendor credits or refunds for both parties and receive an automatic alert for your next billing process time. Maintain records of credit memos when sending invoices, including any credits you issue to your clients or credits owed to you.'
        },
        {
          name: 'Business Tools',
          value: true,
          type: 'check',
          tooltip:
            'Utilize a variety of business tools. Print your own shipping labels instantly and choose from USPS, FedEx, or UPS. Create text groups for your employees or customers. Take advantage of dozens of available business tools tailored to your needs.'
        },
        {
          name: 'Deposit Slip and Cash Expense',
          value: true,
          type: 'check',
          tooltip:
            'Print professional deposit slips and manage cash expenses. Print professional deposit slips for any bank and keep track of them. Reconcile and verifying deposits, is crucial when you have multiple locations by different employees or managers. No more waiting in bank for depost books to be filled, or order another deposit book. Manage your cash expenses on the same platform. Obtain signatures for cash payments from recipients via a simple text message. Maintain comprehensive records of all transactions.'
        },
        {
          name: 'Bank Data Aggregation',
          value: true,
          type: 'check',
          tooltip:
            'Connect with any financial institution and manage transactions efficiently. Automatically download transactions from any banking institution, credit card, or financial institution into one place. Automatically rename or categorize transactions using customizable rules to keep everything organized. We integrate with over 23,000 financial institutions worldwide.'
        },
        {
          name: 'Check Draft/Manual ACH',
          value: false,
          type: 'check',
          tooltip:
            "Print client checks with permission and automate ACH debits. Print your client's check with their permission obtained via phone, text, email, or on paper, no signature required. Set up one-time, recurring, or open payments, eliminating the wait for paper checks. Print on their behalf after permission is granted. Automatically debit ach transactions from any account with authorization for one-time, recurring, or open payments as needed. Same-day ACH debits are also available."
        },
        {
          name: 'Account Manager',
          value: false,
          type: 'check',
          tooltip:
            'Dedicated account manager available 24/7. You will have a specific account manager available around the clock via personal text, phone, email, or chat. We are here to help you every step of the way, working according to your preferences and needs, not the other way around.'
        },
        {
          name: 'Payments/Banking By API',
          value: false,
          type: 'check',
          tooltip:
            'Create custom payment and banking solutions with our endpoint api. Use our endpoint API to create any kind of payment option on your platform. Develop any banking solution you need. Customize everything your way!'
        },
        {
          name: 'Whitelabel Capability',
          value: false,
          type: 'check',
          tooltip:
            'Customize our platform to fit your brand. Replace our platform with your logo and domain name, customize system emails, and more. Tailor the experience to match your brand perfectly.'
        },
        {
          name: 'Embedded payments',
          value: false,
          type: 'check',
          tooltip:
            'Embed our services into your web application with minimal code. Whether you have your own web application or address, you can easily embed a portion of our service or the entire system. Add features like a pay button with minimal code integration.'
        },
        {
          name: 'Own Server',
          value: false,
          type: 'check',
          tooltip:
            "Need more security? host your data on your own server. Enhance security by adjusting and hosting your data on your own server. We're here to make it happen."
        },
        {
          name: 'Customized Email Templates',
          value: false,
          type: 'check',
          tooltip:
            'Design your own check template with our easy-to-use drag and drop solution. Customize your checks with multiple logos, multiple signatures, and custom fields for your business requirements. Dynamically change custom fields for each payment. Present your business personality on the check template. Design your checks your way.'
        },
        {
          name: 'Premium Check <br />& Invoice Templates',
          value: false,
          tooltip:
            'We will collaborate with world-class designers to create a check template that explicitly and uniquely reflects your business in a tailored way.',
          type: 'check'
        },
        {
          name: 'Custom Data Retention Policies',
          value: false,
          type: 'check',
          tooltip:
            'Customize flexible retention periods and automated data deletion schedules to meet compliance needs. Define granular retention policies for different data types, maintain audit trails, and ensure secure storage. Archive important data securely and comply with regulations like GDPR and CCPA. Implement user-specific policies, set notifications for data deletion, and create customizable rules based on data types, user roles, and business processes. Ensure transparency and security in data retention and management.'
        }
      ]
    },
    checkMailing: {
      title: 'Check Mailing',
      tooltip:
        "All mails are processed same business day and handed over to USPS or FedEx. Cut-off time: 1:30 PM EST. Delivery times depend on your selected shipping method and carrier schedules. For emergencies after the cut-off time, call us! We're here for you.",
      values: [
        {
          name: 'Express Mail',
          value: '$37.79',
          type: 'string',
          tooltip: 'Delivery:Next-Day to 2-Day Guarantee'
        },
        {
          name: 'FedEx Overnight',
          value: '$24.99',
          type: 'string',
          tooltip:
            'Delivery: Next day. Saturday delivery available upon request at submission'
        },
        {
          name: 'FedEx Overnight Canada',
          value: '$24.99',
          type: 'string',
          tooltip:
            'Delivery: Next day. Saturday delivery available upon request at submission',
          flag: 'https://flagcdn.com/w320/ca.png'
        },
        {
          name: 'Priority Mail USPS',
          value: '$13.99',
          type: 'string',
          tooltip:
            'Delivery: 1-3 business days. Most cases are delivered within one or two days; very rarely does USPS take three days.'
        },
        {
          name: 'First Class with Tracking',
          value: '$8.10',
          type: 'string',
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does USPS take five or more days, which often happens during holidays, as per USPS website.'
        },
        {
          name: 'First Class Canada',
          value: '$2.99',
          type: 'string',
          flag: 'https://flagcdn.com/w320/ca.png',
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does Canada Post take five or more days, which often happens during holidays, as per thire website.'
        },
        {
          name: 'USPS First Class',
          value: '$1.25',
          type: 'string',
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does USPS take five or more days, which often happens during holidays, as per USPS website.'
        },
        {
          name: 'Document Attachment',
          value: '$1.00',
          type: 'string',
          tooltip:
            'Attach up to 40 pages with your check, such as invoices or purchase orders, for any shipping method. Regular first-class mail without tracking allows only 5 pages (Besides Check), as it’s hard to fit inside a regular #10 envelope. Each attachment costs $1 per page unless you have special pricing. Call us for special pricing.'
        }
      ]
    },
    internationalMailing: {
      title: 'International Mailing',
      values: [
        {
          name: 'First Class International',
          value: '$4.99',
          type: 'string',
          tooltip:
            'Delivery: First Class Package International transit times will vary depending on how developed the postal network is in the destination country. The USPS advises to allow between 7 and 21 business days.'
        },
        {
          name: 'First Class Canada',
          value: '$2.99',
          flag: 'https://flagcdn.com/w320/ca.png',
          type: 'string',
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does Canada Post take five or more days, which often happens during holidays, as per thire website.'
        },
        {
          name: 'Fedex International',
          value: '$59.99',
          type: 'string',
          tooltip:
            'Delivery: Usually within 3 to 5 business days, depending on the destination. In some remote areas, it may take up to 8 business days as per FedEx website.'
        },
        {
          name: 'FedEx Overnight Canada',
          value: '$24.99',
          flag: 'https://flagcdn.com/w320/ca.png',
          type: 'string',
          tooltip:
            'Delivery: Next day. Saturday delivery available upon request at submission'
        }
      ]
    }
  },
  'enterprise-custom-monthly-v2': {
    fromCard: {
      title: 'Pay Anyone With a Credit Card',
      tooltip:
        'Pay anyone using your credit card balance even if they do not accept your card. You can use it to earn rewards or to increase your cash flow.',
      calcuator: true,
      values: [
        {
          name: 'Card Processing Fee',
          value: '2.9%',
          type: 'string',
          tooltip: ''
        },
        {
          name: 'ACH',
          min: '0.05%',
          max: '$10.00',
          type: 'minMax',
          tooltip: ''
        },
        {
          name: 'Same Day ACH',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip: ''
        },
        {
          name: 'Wire',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip: ''
        },
        {
          name: 'Virtual Card',
          value: 'Free',
          type: 'string',
          tooltip: ''
        }
      ]
    },
    fromWallet: {
      title: 'From Wallet',
      tooltip:
        'Upon signing up, a wallet is automatically created, similar to PayPal. Refill it via ACH, wire, or instant bank push. Multiple funding options are available. Create as many wallets as needed for your business.',
      values: [
        {
          name: 'Check Mail',
          value: 'Free',
          type: 'string',
          color: true,
          tooltip:
            'Keep your wallet pre-funded for instant payments via RTP, Fed-Now, Push to Card, or same-day ACH.'
        },
        {
          name: 'ACH, Same Day ACH',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Keep your wallet pre-funded for instant payments via RTP, Fed-Now, Push to Card, or same-day ACH.'
        },
        {
          name: 'Wire (Domestic)',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            "Keep your wallet pre-funded to send a quick wire with a click. Don't let your business deals fall behind."
        },
        {
          name: 'Wire (International)',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Keep your wallet pre-funded to send a quick international wire from your PC or phone, anywhere in the world.'
        }
      ]
    },
    fromBank: {
      title: 'From Your Bank A/C',
      tooltip:
        "Add as many Bank Ac as you need, compatible with any US or Canadian bank. Add manually or instantly. Printing checks doesn't require bank verification, but ACH or electronic formats do, either instantly or via micro-deposit.",
      values: [
        {
          name: 'Check Printing',
          desc: '(Instant Online - Do It Yourself)',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip:
            'Print checks online instantly from any bank account on any printer, using blank check paper or plain white paper. '
        },
        {
          name: 'Email Check',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip:
            'Email a One-Time printable, trackable check, and the recipient can print it on plain white paper or blank check paper'
        },
        {
          name: 'ACH / Direct Deposit',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip:
            "Send anyone ACH or direct deposit. If you don't have the recipient's account number, we will collect and verify it via email or text for you"
        },
        {
          name: 'ACH - Same Day',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip: 'Send same day ACH in emergencies'
        },
        {
          name: 'Wire (Domestic)',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic'
        },
        {
          name: 'Wire (International)',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic'
        },
        // {
        //   name: 'Pay by Credit Card',
        //   desc: '(We send them ACH/Wire or Paper Check)',
        //   value: 'Volume<br> / Custom Pricing',
        //   type: 'italic',
        //   tooltip:
        //     'Pay your vendors, taxes, rent, or payroll using your credit card balance when short on cash, even if they do not accept cards. We will send them ach, wire, or a paper check of their choice. Keep all your credit card rewards and cash back'
        // },
        {
          name: 'Mail Check In One Click ',
          desc: '(USPS / Fedex)',
          value: '$0.80',
          type: 'as-low-as',
          tooltip:
            "Print and mail your check in one click on the same business day. Choose from a variety of mailing options: First class, First class tracking, Priority, Express, Fedex overnight, and certified mail. Prices are all-inclusive of printing MICR, stamps, envelopes, etc. Customize all checks with your own design and template. Add any attachments like invoices or pay stubs along with your check mailing for an additional fee. Don’t worry about pre-designed templates used by other service providers. Use any of your check designs. Please see below for specific pricing. We've got every custom option you need. Just tell us!!"
        },
        {
          name: 'Documents Mailing',
          value: '$0.70',
          type: 'as-low-as',
          tooltip:
            'Mail any kind of document in one click. Choose from all available mailing options via USPS and FedEx.'
        }
      ]
    },
    features: {
      title: 'Features',
      values: [
        {
          name: 'Bank Accounts Allowed',
          value: 'Custom',
          color: true,
          type: 'string',
          tooltip: 'Add any bank account from the US or Canada regions.'
        },
        {
          name: 'International Payments',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip:
            'Pay anyone across the world. Most payments are processed within minutes.',
          color: true
        },
        {
          name: 'Users',
          value: 'Custom',
          color: true,
          type: 'string',
          tooltip:
            'Assign roles with specific permissions based on your needs. Implement a role-based, multi-level approval process or limit access to certain bank accounts, transaction amounts, or payees. Require higher authority approval for transactions exceeding specified amounts. Control visibility of transactions and user data, and set restrictions on deleting or voiding payments. Limit access to specific computers, ip addresses, days, or times. Customize roles for your users or managers to suit your requirements.'
        },
        {
          name: 'Positive Pay (Per Account)',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip:
            'Positive pay is a fraud prevention service where a bank verifies your payment details before clearing a transaction. When you issues a check or ach payment, we notify your bank right away with specific details. The bank then matches these details with the presented payment. If the information does not match, the payment is rejected. This system helps prevent unauthorized transactions and reduces the risk of fraud 100%. You need to talk to your bank and have them turn on this feature for you. Most major bank have automated way. They provide you a sepcific positive pay FTP credential or API. We set it up for you. Even after you issue a payment, if you void that payment, that also pass over to your bank and your bank will not honor that payment. Some banks who do not have automated way give you and option to upload every day to their online platform, in this case we provide their specific needed and formated excel/csv file for you. We can custmise and work with anyway file or the formated way it required by your bank to make secured each and every payemtns.'
        },
        {
          name: 'Full Integration Suite',
          desc: '(including accounting software)',
          value: true,
          tooltip:
            "Seamlessly integrate with any accounting software of your choice. Automatically integrate with any platform you already have. Import or export data effortlessly. We've integrated with nearly all major accounting software. If we don't support it yet, we'll custom-create the integration for you within a few days. We work with any customer flow you need, integrating with any software you require.",
          type: 'check'
        },
        {
          name: 'Receive Payment Link',
          value: true,
          type: 'check',
          tooltip:
            'Send a payment link via text or email for one-time, recurring, or open payments. Seamlessly collect any type of payment like rent, association fees, customer payments, donations, or any other payments via this link. Choose to receive payments via ACH, paper check, or credit card, or connect with your PayPal, Stripe accounts, or any cryptos. We can also create custom payment solutions to meet your specific requirements.'
        },
        {
          name: 'Recurring Payments',
          desc: '(Send/Receive)',
          value: true,
          type: 'check',
          tooltip:
            'Send or collect recurring payments with one-time setup. Set up recurring payments for a specific number of payments or time periods using any method, including paper check, direct deposit, ACH, or credit card.'
        },
        {
          name: 'Cloud Banking',
          value: true,
          type: 'check',
          tooltip:
            'Open a US bank account from anywhere in the world within minutes. We will issue an FDIC-insured bank account number through our FDIC-insured banking partners'
        },
        {
          name: 'Bill & Invoice',
          value: true,
          type: 'check',
          tooltip:
            'Manage your bills efficiently. Set up due dates in advance for automatic or manual processing, optimizing your cash flow based on vendor negotiations. Create professional invoices and send them via text, email, USPS, or FedEx overnight with a single click.'
        },
        {
          name: 'Vendor Credits & Credit Memos',
          value: true,
          type: 'check',
          tooltip:
            'Manage vendor credits & refunds efficiently. Keep track of vendor credits or refunds for both parties and receive an automatic alert for your next billing process time. Maintain records of credit memos when sending invoices, including any credits you issue to your clients or credits owed to you.'
        },
        {
          name: 'Business Tools',
          value: true,
          type: 'check',
          tooltip:
            'Utilize a variety of business tools. Print your own shipping labels instantly and choose from USPS, FedEx, or UPS. Create text groups for your employees or customers. Take advantage of dozens of available business tools tailored to your needs.'
        },
        {
          name: 'Deposit Slip and Cash Expense',
          value: true,
          type: 'check',
          tooltip:
            'Print professional deposit slips and manage cash expenses. Print professional deposit slips for any bank and keep track of them. Reconcile and verifying deposits, is crucial when you have multiple locations by different employees or managers. No more waiting in bank for depost books to be filled, or order another deposit book. Manage your cash expenses on the same platform. Obtain signatures for cash payments from recipients via a simple text message. Maintain comprehensive records of all transactions.'
        },
        {
          name: 'Bank Data Aggregation',
          value: true,
          type: 'check',
          tooltip:
            'Connect with any financial institution and manage transactions efficiently. Automatically download transactions from any banking institution, credit card, or financial institution into one place. Automatically rename or categorize transactions using customizable rules to keep everything organized. We integrate with over 23,000 financial institutions worldwide.'
        },
        {
          name: 'Check Draft/Manual ACH',
          value: true,
          type: 'check',
          tooltip:
            "Print client checks with permission and automate ACH debits. Print your client's check with their permission obtained via phone, text, email, or on paper, no signature required. Set up one-time, recurring, or open payments, eliminating the wait for paper checks. Print on their behalf after permission is granted. Automatically debit ach transactions from any account with authorization for one-time, recurring, or open payments as needed. Same-day ACH debits are also available."
        },
        {
          name: 'Account Manager',
          value: true,
          type: 'check',
          tooltip:
            'Dedicated account manager available 24/7. You will have a specific account manager available around the clock via personal text, phone, email, or chat. We are here to help you every step of the way, working according to your preferences and needs, not the other way around.'
        },
        {
          name: 'Payments/Banking By API',
          value: true,
          type: 'check',
          tooltip:
            'Create custom payment and banking solutions with our endpoint api. Use our endpoint API to create any kind of payment option on your platform. Develop any banking solution you need. Customize everything your way!'
        },
        {
          name: 'Whitelabel Capability',
          value: true,
          type: 'check',
          tooltip:
            'Customize our platform to fit your brand. Replace our platform with your logo and domain name, customize system emails, and more. Tailor the experience to match your brand perfectly.'
        },
        {
          name: 'Embedded payments',
          value: true,
          type: 'check',
          tooltip:
            'Embed our services into your web application with minimal code. Whether you have your own web application or address, you can easily embed a portion of our service or the entire system. Add features like a pay button with minimal code integration.'
        },
        {
          name: 'Own Server',
          value: true,
          type: 'check',
          tooltip:
            "Need more security? host your data on your own server. Enhance security by adjusting and hosting your data on your own server. We're here to make it happen."
        },
        {
          name: 'Customized Email Templates',
          value: true,
          type: 'check',
          tooltip:
            'Design your own check template with our easy-to-use drag and drop solution. Customize your checks with multiple logos, multiple signatures, and custom fields for your business requirements. Dynamically change custom fields for each payment. Present your business personality on the check template. Design your checks your way.'
        },
        {
          name: 'Premium Check <br />& Invoice Templates',
          value: true,
          tooltip:
            'We will collaborate with world-class designers to create a check template that explicitly and uniquely reflects your business in a tailored way.',
          type: 'check'
        },
        {
          name: 'Custom Data Retention Policies',
          value: true,
          type: 'check',
          tooltip:
            'Customize flexible retention periods and automated data deletion schedules to meet compliance needs. Define granular retention policies for different data types, maintain audit trails, and ensure secure storage. Archive important data securely and comply with regulations like GDPR and CCPA. Implement user-specific policies, set notifications for data deletion, and create customizable rules based on data types, user roles, and business processes. Ensure transparency and security in data retention and management.'
        }
      ]
    },
    checkMailing: {
      title: 'Check Mailing',
      tooltip:
        "All mails are processed same business day and handed over to USPS or FedEx. Cut-off time: 1:30 PM EST. Delivery times depend on your selected shipping method and carrier schedules. For emergencies after the cut-off time, call us! We're here for you.",
      values: [
        {
          name: 'Express Mail',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip: 'Delivery:Next-Day to 2-Day Guarantee'
        },
        {
          name: 'FedEx Overnight',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: Next day. Saturday delivery available upon request at submission'
        },
        {
          name: 'FedEx Overnight Canada',
          value: 'Volume<br> / Custom Pricing',
          flag: 'https://flagcdn.com/w320/ca.png',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: Next day. Saturday delivery available upon request at submission'
        },
        {
          name: 'Priority Mail USPS',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: 1-3 business days. Most cases are delivered within one or two days; very rarely does USPS take three days.'
        },
        {
          name: 'First Class with Tracking',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does USPS take five or more days, which often happens during holidays, as per USPS website.'
        },
        {
          name: 'First Class Canada',
          value: 'Volume<br> / Custom Pricing',
          flag: 'https://flagcdn.com/w320/ca.png',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does Canada Post take five or more days, which often happens during holidays, as per thire website.'
        },
        {
          name: 'USPS First Class',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does USPS take five or more days, which often happens during holidays, as per USPS website.'
        },
        {
          name: 'Document Attachment',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Attach up to 40 pages with your check, such as invoices or purchase orders, for any shipping method. Regular first-class mail without tracking allows only 5 pages (Besides Check), as it’s hard to fit inside a regular #10 envelope. Each attachment costs $1 per page unless you have special pricing. Call us for special pricing.'
        }
      ]
    },
    internationalMailing: {
      title: 'International Mailing',
      values: [
        {
          name: 'First Class International',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: First Class Package International transit times will vary depending on how developed the postal network is in the destination country. The USPS advises to allow between 7 and 21 business days.'
        },
        {
          name: 'First Class Canada',
          value: 'Volume<br> / Custom Pricing',
          flag: 'https://flagcdn.com/w320/ca.png',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: 1-5 business days. Most cases are delivered within one to four days; very rarely does Canada Post take five or more days, which often happens during holidays, as per thire website.'
        },
        {
          name: 'Fedex International',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: Usually within 3 to 5 business days, depending on the destination. In some remote areas, it may take up to 8 business days as per FedEx website.'
        },
        {
          name: 'FedEx Overnight Canada',
          value: 'Volume<br> / Custom Pricing',
          flag: 'https://flagcdn.com/w320/ca.png',
          type: 'italic',
          color: true,
          tooltip:
            'Delivery: Next day. Saturday delivery available upon request at submission'
        }
      ]
    }
  }
};

export const additionalBenefits = [
  {
    title: 'Volume Pricing',
    desc: 'Customized to your needs, providing significant savings for higher transaction volumes',
    faIcon: faChartSimple
  },
  {
    title: 'Tell Us What You Want',
    desc: 'If you let us know what you need, we will build it according to your specifications. We will meet your specific requirements and needs',
    faIcon: faMessageMiddle
  },
  {
    title: 'Custom Integration',
    desc: "Seamlessly integrate with any of your platforms, including accounting software. We'll develop tailored components to fit your requirements.",
    faIcon: faGrid2Plus
  },
  {
    title: 'Flexible Payments',
    desc: "Develop custom payment flow integrations across multiple platforms. We'll create a version tailored specifically for you",
    faIcon: faDollarSign
  },
  {
    title: 'One-on-One Support',
    desc: "Receive support via text, call, chat, email, or modern platforms like Slack, Teams, Skype, WhatsApp, and Telegram. You choose, we're there for you",
    faIcon: faHeadset
  },
  {
    title: 'Best-in-Class Technology',
    desc: 'Enjoy superior performance and reliability with our cutting-edge technology',
    faIcon: faGlobe
  },
  {
    title: '100% Satisfaction',
    desc: "We don't accept anything less than 100% satisfaction. We meet all your expectations",
    faIcon: faThumbsUp
  }
];
