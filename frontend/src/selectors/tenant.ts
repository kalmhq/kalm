import { RootState } from "reducers";

export const getHasSelectedTenant = (state: RootState) => {
  return state.auth.tenant.length > 0;
};

export const getUserEmail = (state: RootState) => {
  return state.auth.email;
};

export const getUserAvatar = (state: RootState) => {
  return state.auth.avatarUrl;
};

export const isSameTenant = (tenantName: string, clusterTenantName: string) => {
  return tenantName === clusterTenantName || clusterTenantName.includes(tenantName);
};

export const composeTenantLink = (clusterTenantName: string) => {
  if (clusterTenantName.includes("/")) {
    const parts = clusterTenantName.split("/");

    return `https://${parts[1]}.${parts[0]}.kalm.dev`;
  } else {
    return `https://${clusterTenantName}.kalm.dev`;
  }
};

export const composeTenantText = (clusterTenantName: string) => {
  return clusterTenantName.includes("/") ? clusterTenantName.split("/")[1] : clusterTenantName;
};
