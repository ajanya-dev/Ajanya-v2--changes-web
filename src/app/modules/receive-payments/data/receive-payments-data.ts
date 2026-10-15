export const receivedCheckStatus = [
  { value: 0, name: 'All' },
  { value: 1, name: 'Email' },
  { value: 14, name: 'Requested' },
  { value: { type: 4, status: 1 }, name: 'GPBL Acpt/Rej' },
  { value: { type: 4, status: 2 }, name: 'GPBL Viewed' },
  { value: { type: 4, status: 3 }, name: 'GPBL Rejected' },
  { value: { type: 4, status: 4 }, name: 'GPBL Accepted' },
  { value: { type: 4, status: 5 }, name: 'GPBL TTP' },
  { value: { type: 4, status: 6 }, name: 'GPBL Printed' },
  {
    value: { type: 4, status: 7 },
    name: 'HTML-FORM-SENDER-FPRINTED'
  },
  { value: { type: 4, status: 30 }, name: 'GPBL DD' },
  { value: { type: 4, status: 32 }, name: 'DD Rejected' },
  { value: { type: 4, status: 50 }, name: 'DD Initiated' },
  { value: { type: 4, status: 51 }, name: 'DD Completed' },
  { value: { type: 4, status: 52 }, name: 'DD Failed' },
  { value: 5, name: 'ACH' },
  { value: 6, name: 'M-ACH' },
  { value: 10, name: 'Stripe' },
  { value: 11, name: 'Paypal' }
];
