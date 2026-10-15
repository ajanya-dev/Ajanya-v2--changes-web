export interface IPolicy {
    policy_name: string;
    policy_content: string;
  }
  
  export interface IPendingPolicy {
    success: boolean;
    pendingPolicy: number;
  }