import { IViewPayee } from "src/app/modules/payee/payee-v2/model/payee";

export interface IIntroPayee {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  company: string | null;
  country: string;
  createdAt: string;
  email: string;
  encryptedId: string;
  id: string;
  name: string;
  nickName: string;
  payeeIdNumber: string;
  payeeTypeId: string;
  phone: string;
  state: string;
  zip?: string;
  thisMonthTransaction: string;
  thisYearTransaction: string;
  lastYearTransaction: string;
  allTimeTransaction: string;
  typeDetails: {
    createdAt: string;
    employeeAccountNumber: string;
    employeeSsn: string;
    id: string;
    payee: {
      payeeId: string;
      payeeMobilePhone: string;
      updatedAt: string;
      vendorDefaultPayMethod: string;
      zip: string;
    };
  };
}
export const introPayees = [
  {
    addressLine1: 'Intro payee one street',
    city: 'New York',
    company: 'Company one',
    country: 'United States',
    createdAt: '12/09/2023',
    email: 'intropayeeone@gmail.com',
    encryptedId: 'xZqXGKBbnn4RzVv',
    id: 'id1',
    name: 'Intro payee one',
    nickName: '4',
    payeeIdNumber: '23123123',
    payeeTypeId: '1',
    phone: '+12254879895',
    state: 'NY',
    zip:'671541',
    thisMonthTransaction: '324',
    thisYearTransaction: '722',
    lastYearTransaction: '3423',
    allTimeTransaction: '4223',
    typeDetails: {
      createdAt: '2023-12-09T06:46:04.000000Z',
      employeeAccountNumber: '23123123',
      employeeSsn: '877978979',
      id: '36gYVewVrRGdx7br',
      payee: {
        payeeId: 'xZqXGKBbnn4RzVv',
        payeeMobilePhone: '+12345679895',
        updatedAt: '2024-03-15T04:39:09.000000Z',
        vendorDefaultPayMethod: '4',
        zip: '10038'
      }
    }
  },
  {
    addressLine1: 'Intro payee two  street',
    city: 'New York',
    company: 'Company two',
    country: 'United States',
    createdAt: '12/09/2023',
    email: 'intropayeetwo@gmail.com',
    encryptedId: 'xZqXGKBbnn4RzVv',
    id: 'id2',
    name: 'Intro payee two',
    nickName: '4',
    payeeIdNumber: '23123123',
    payeeTypeId: '1',
    phone: '+12254879895',
    state: 'NY',
    zip:'671541',
    thisMonthTransaction: '3544',
    thisYearTransaction: '2252',
    lastYearTransaction: '3423',
    allTimeTransaction: '8585',
    typeDetails: {
      createdAt: '2023-12-09T06:46:04.000000Z',
      employeeAccountNumber: '23123123',
      employeeSsn: '877978979',
      id: '36gYVewVrRGdx7br',
      payee: {
        payeeId: 'xZqXGKBbnn4RzVv',
        payeeMobilePhone: '+12265459895',
        updatedAt: '2024-03-15T04:39:09.000000Z',
        vendorDefaultPayMethod: '4',
        zip: '10038'
      }
    }
  },
  {
    addressLine1: 'Intro payee four  street',
    city: 'New York',
    company: 'Company three',
    country: 'United States',
    createdAt: '12/09/2023',
    email: 'intropayeethree@gmail.com',
    encryptedId: 'xZqXGKBbnn4RzVv',
    id: 'id3',
    name: 'Intro payee three',
    nickName: '4',
    payeeIdNumber: '23123123',
    payeeTypeId: '2',
    phone: '+12254879895',
    state: 'NY',
    zip:'671541',
    thisMonthTransaction: '323',
    thisYearTransaction: '4522',
    lastYearTransaction: '3343',
    allTimeTransaction: '8582',
    typeDetails: {
      createdAt: '2023-12-09T06:46:04.000000Z',
      employeeAccountNumber: '23123123',
      employeeSsn: '877978979',
      id: '36gYVewVrRGdx7br',
      payee: {
        payeeId: 'xZqXGKBbnn4RzVv',
        payeeMobilePhone: '+12254654395',
        updatedAt: '2024-03-15T04:39:09.000000Z',
        vendorDefaultPayMethod: '4',
        zip: '10038'
      }
    }
  },
  {
    addressLine1: 'Intro payee four  street',
    city: 'New York',
    company: 'Company four',
    country: 'United States',
    createdAt: '12/09/2023',
    email: 'intropayeefour@gmail.com',
    encryptedId: 'xZqXGKBbnn4RzVv',
    id: 'id4',
    name: 'Intro payee four',
    nickName: '2',
    payeeIdNumber: '23123123',
    payeeTypeId: '2',
    phone: '+12254879895',
    state: 'NY',
    zip:'671541',
    thisMonthTransaction: '132',
    thisYearTransaction: '182',
    lastYearTransaction: '33',
    allTimeTransaction: '658',
    typeDetails: {
      createdAt: '2023-12-09T06:46:04.000000Z',
      employeeAccountNumber: '23123123',
      employeeSsn: '877978979',
      id: '36gYVewVrRGdx7br',
      payee: {
        payeeId: 'xZqXGKBbnn4RzVv',
        payeeMobilePhone: '+12254877887',
        updatedAt: '2024-03-15T04:39:09.000000Z',
        vendorDefaultPayMethod: '4',
        zip: '10038'
      }
    }
  },
  {
    addressLine1: 'Intro payee four  street',
    city: 'New York',
    company: 'Company five',
    country: 'United States',
    createdAt: '12/09/2023',
    email: 'intropayeefive@gmail.com',
    encryptedId: 'xZqXGKBbnn4RzVv',
    id: 'id5',
    name: 'Intro payee five',
    nickName: '2',
    payeeIdNumber: '23123123',
    payeeTypeId: '3',
    phone: '+12254879895',
    state: 'NY',
    zip:'671541',
    thisMonthTransaction: '344',
    thisYearTransaction: '452',
    lastYearTransaction: '23',
    allTimeTransaction: '745',
    typeDetails: {
      createdAt: '2023-12-09T06:46:04.000000Z',
      employeeAccountNumber: '23123123',
      employeeSsn: '877978979',
      id: '36gYVewVrRGdx7br',
      payee: {
        payeeId: 'xZqXGKBbnn4RzVv',
        payeeMobilePhone: '+12345879895',
        updatedAt: '2024-03-15T04:39:09.000000Z',
        vendorDefaultPayMethod: '4',
        zip: '10038'
      }
    }
  },
  {
    addressLine1: 'Intro payee four  street',
    city: 'New York',
    company: 'Company six',
    country: 'United States',
    createdAt: '12/09/2023',
    email: 'intropayeesix@gmail.com',
    encryptedId: 'xZqXGKBbnn4RzVv',
    id: 'id6',
    name: 'Intro payee six',
    nickName: '2',
    payeeIdNumber: '23123123',
    payeeTypeId: '3',
    phone: '+12254879895',
    state: 'NY',
    zip:'671541',
    thisMonthTransaction: '34',
    thisYearTransaction: '222',
    lastYearTransaction: '323',
    allTimeTransaction: '858',
    typeDetails: {
      createdAt: '2023-12-09T06:46:04.000000Z',
      employeeAccountNumber: '23123123',
      employeeSsn: '877978979',
      id: '36gYVewVrRGdx7br',
      payee: {
        payeeId: 'xZqXGKBbnn4RzVv',
        payeeMobilePhone: '+1245879895',
        updatedAt: '2024-03-15T04:39:09.000000Z',
        vendorDefaultPayMethod: '4',
        zip: '10038'
      }
    }
  }
];

export const intoTabsArray: { value: string; name: string }[] = [
  { value: '0', name: 'All' },
  { value: '1', name: 'Customers' },
  { value: '2', name: 'Vendors' },
  { value: '3', name: 'Employees' }
];

export interface IPayeeModalResponse extends IViewPayee {
  success?: boolean;
  payeeTypeId: string;
  encryptedId?: string;
}