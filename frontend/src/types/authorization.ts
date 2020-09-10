export interface LoginStatus {
  authorized: boolean;
  isAdmin: boolean;
  entity: string;
  csrf: string;
}
