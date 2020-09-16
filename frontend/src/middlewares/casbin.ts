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
      enforcer.loadPolicies(action.payload.loginStatus.policies);

      const clientInfo = action.payload.loginStatus;
      let subjects: string[];

      if (clientInfo.impersonation !== "") {
        subjects = [toSafeSubject(clientInfo.impersonation)];
      } else {
        subjects = [toSafeSubject(action.payload.loginStatus.email)];
        subjects = subjects.concat(clientInfo.groups.map(toSafeSubject));
      }

      const withSubjects = (fn: (...args: string[]) => boolean, ...args: string[]) => {
        for (let i = 0; i < subjects.length; i++) {
          const subject = subjects[i];

          if (fn.call(enforcer, subject, ...args)) {
            return true;
          }
        }

        return false;
      };

      store.dispatch({
        type: SET_AUTH_METHODS,
        payload: {
          can: (action: string, scope: string, resource: string) => withSubjects(enforcer.can, action, scope, resource),
          canView: (scope: string, resource: string) => withSubjects(enforcer.canView, scope, resource),
          canEdit: (scope: string, resource: string) => withSubjects(enforcer.canEdit, scope, resource),
          canManage: (scope: string, resource: string) => withSubjects(enforcer.canManage, scope, resource),
          canViewNamespace: (scope: string) => withSubjects(enforcer.canViewNamespace, scope),
          canEditNamespace: (scope: string) => withSubjects(enforcer.canEditNamespace, scope),
          canManageNamespace: (scope: string) => withSubjects(enforcer.canManageNamespace, scope),
          canViewCluster: () => withSubjects(enforcer.canViewCluster),
          canEditCluster: () => withSubjects(enforcer.canEditCluster),
          canManageCluster: () => withSubjects(enforcer.canManageCluster),
        },
      });
    }

    return next(action);
  };
};
