export interface LoginStatus {
  authorized: boolean;
  email: string;
  avatarUrl: string;
  groups: string[];
  policies: string;
  impersonation: string;
  impersonationType: string;
}
