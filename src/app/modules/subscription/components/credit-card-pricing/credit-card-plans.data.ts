export const planFeatures = {
  'free-plan': {
    fromCard: {
      title: 'Fee Captured From Credit Card',
      tooltip: '',
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
          min: '0.4%',
          max: '$40.00',
          type: 'minMax',
          tooltip: ''
        },
        {
          name: 'Wire',
          min: '0.1%',
          max: '$12.00',
          type: 'minMax',
          tooltip: ''
        },
        {
          name: 'Virtual Card',
          value: 'Free',
          type: 'string',
          tooltip: ''
        }
      ]
    }
  },
  'pay-as-you-go-monthly-v3': {
    fromCard: {
      title: 'Fee Captured From My Credits',
      tooltip: '',
      values: [
        {
          name: 'Card Processing Fee',
          value: '2.9%',
          type: 'string',
          tooltip: ''
        },
        {
          name: 'ACH',
          value: 'Free',
          type: 'string',
          color: true,
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
    }
  },
  'enterprise-custom-monthly-v2': {
    fromCard: {
      title: 'Fee Captured From My Credits',
      tooltip: '',
      values: [
        {
          name: 'Card Processing Fee',
          value: '2.9%',
          type: 'string',
          tooltip: ''
        },
        {
          name: 'ACH',
          value: 'Free',
          type: 'string',
          color: true,
          tooltip: ''
        },
        {
          name: 'Same Day ACH',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip: ''
        },
        {
          name: 'Wire',
          value: 'Volume<br> / Custom Pricing',
          type: 'italic',
          tooltip: ''
        },
        {
          name: 'Virtual Card',
          value: 'Free',
          type: 'string',
          tooltip: ''
        }
      ]
    }
  }
};
