import { RBACEnforcer } from "rbac/model";
import { Store } from "redux";
import { Actions } from "types";
import { RootState } from "reducers";
import { LOAD_LOGIN_STATUS_FULFILLED, SET_AUTH_METHODS } from "types/common";

// a different prefix will do the trick.
const toSafeSubject = (sub: string) => {
  return "sub-" + sub;
};

export const createCasbinEnforcerMiddleware = () => {
  const enforcer = new RBACEnforcer("");

  return (store: Store<RootState, Actions>) => (next: any) => (action: Actions) => {
    if (action.type === LOAD_LOGIN_STATUS_FULFILLED) {
      enforcer.loadPolicies(action.payload.loginStatus.get("policies"));

      const clientInfo = action.payload.loginStatus;
      let subject: string;

      if (clientInfo.get("impersonation") !== "") {
        subject = toSafeSubject(clientInfo.get("impersonation"));
      } else {
        subject = toSafeSubject(action.payload.loginStatus.get("entity"));
      }

      store.dispatch({
        type: SET_AUTH_METHODS,
        payload: {
          can: (action: string, scope: string, resource: string) => enforcer.can(subject, action, scope, resource),
          canView: (scope: string, resource: string) => enforcer.canView(subject, scope, resource),
          canEdit: (scope: string, resource: string) => enforcer.canEdit(subject, scope, resource),
          canManage: (scope: string, resource: string) => enforcer.canManage(subject, scope, resource),
          canViewNamespace: (scope: string) => enforcer.canViewNamespace(subject, scope),
          canEditNamespace: (scope: string) => enforcer.canEditNamespace(subject, scope),
          canManageNamespace: (scope: string) => enforcer.canManageNamespace(subject, scope),
          canViewCluster: () => enforcer.canViewCluster(subject),
          canEditCluster: () => enforcer.canEditCluster(subject),
          canManageCluster: () => enforcer.canManageCluster(subject),
        },
      });
    }

    return next(action);
  };
};
