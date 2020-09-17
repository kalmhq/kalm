export interface LoginStatus {
  authorized: boolean;
  email: string;
  groups: string[];
  policies: string;
  impersonation: string;
  impersonationType: string;
}
