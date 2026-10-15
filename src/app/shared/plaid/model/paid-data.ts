export interface IPlaidMetaData {
    status: unknown
    link_session_id: string
    institution: Institution
    accounts: Account[]
    account: Account2
    account_id: string
    transfer_status: unknown
    wallet: unknown
    public_token: string
    error_code: string
    exit_status: string
    institution_name: string
  }

  export interface IPlaidExitError {
    error_code: string
    error_message: string
    error_type: string
    display_message: string
  }
  
  export interface Institution {
    name: string
    institution_id: string
  }
  
  export interface Account {
    id: string
    name: string
    mask: string
    type: string
    subtype: string
    verification_status: unknown
    class_type: unknown
  }
  
  export interface Account2 {
    id: string
    name: string
    mask: string
    type: string
    subtype: string
    verification_status: unknown
    class_type: unknown
  }
  