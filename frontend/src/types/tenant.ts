export interface Tenant {
  id: string;
  name: string;
  resourceQuotas: { [key: string]: any };
  consumedResources: { [key: string]: any };
}
