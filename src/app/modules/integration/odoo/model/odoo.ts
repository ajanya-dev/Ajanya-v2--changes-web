import { FormControl } from "@angular/forms";

export interface IOdooConnectionPayload {
    db: string;
    username: string;
    api_key: string;
}


export interface IOdooConnectionForm {
    db: FormControl<string | null>;
    username: FormControl<string | null>;
    api_key: FormControl<string | null>;
  }


  export interface IOdooMapedBankList {
    id: string;
    name: string;
    connected: number;
    ocwBankAccount: string;
    ocwBankAccountId: string;
    ocwBankAccountNickName: string;
    isMapped: number;
  }

  export interface IOdooImportedForm {
    type: FormControl<number | null>;
    time: FormControl<number | null>;
  }