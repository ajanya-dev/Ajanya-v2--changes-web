export interface IDayforceConnection {
  clientNamespace: string;
  username: string;
  password: string;
}

export interface IDayforceConnectionResponse {
  message: string;
  connection_info: {
    client_namespace: string;
    username: string;
    base_url: string;
  };
}

export interface IDayforceConnectionDetails {
  connected: boolean;
  connection_info: {
    client_namespace: string;
    username: string;
    base_url: string;
    connected_at: string;
    inherited_from_parent: boolean;
  };
}

export interface IDayforceLocations {
  id: string;
  location_xref_code:string;
  location_name:string;
  parent_user_id:number;
  created_for_id:number;
  created_by_id:number;
  created_at:string;
  updated_at:string;
  deleted_at:string;
  bank_account:{id:string, name:string};
  company:{id:string, name:string};
}