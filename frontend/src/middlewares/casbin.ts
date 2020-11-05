import { RBACEnforcer } from "rbac/model";
import { RootState } from "reducers";
import { Store } from "redux";
import { Actions } from "types";
import { LOAD_LOGIN_STATUS_FULFILLED, SET_AUTH_METHODS } from "types/common";
import { SubjectTypeGroup, SubjectTypeUser } from "types/member";

// a different prefix will do the trick.
const toSafeSubject = (sub: string, type: string) => {
  if (type === SubjectTypeUser) {
    return "user-" + sub;
  } else if (type === SubjectTypeGroup) {
    return "group-" + sub;
  }

  throw new Error("unknown subject type: " + type);
};

export const createCasbinEnforcerMiddleware = () => {
  const enforcer = new RBACEnforcer("");

  return (store: Store<RootState, Actions>) => (next: any) => (action: Actions) => {
    if (action.type === LOAD_LOGIN_STATUS_FULFILLED) {
      enforcer.loadPolicies(action.payload.loginStatus.policies);

      const clientInfo = action.payload.loginStatus;
      let subjects: string[];

      if (clientInfo.impersonation !== "") {
        subjects = [toSafeSubject(clientInfo.impersonation, clientInfo.impersonationType)];
      } else {
        subjects = [toSafeSubject(action.payload.loginStatus.email, SubjectTypeUser)];
        if (clientInfo.groups) {
          subjects = subjects.concat(clientInfo.groups.map((group: string) => toSafeSubject(group, SubjectTypeGroup)));
        }
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

      const tenant = "global";

      store.dispatch({
        type: SET_AUTH_METHODS,
        payload: {
          can: (action: string, scope: string, resource: string) =>
            withSubjects(enforcer.can, action, tenant + "/" + scope, resource),

          canView: (scope: string, resource: string) => withSubjects(enforcer.canView, tenant + "/" + scope, resource),
          canEdit: (scope: string, resource: string) => withSubjects(enforcer.canEdit, tenant + "/" + scope, resource),
          canManage: (scope: string, resource: string) =>
            withSubjects(enforcer.canManage, tenant + "/" + scope, resource),

          canViewNamespace: (scope: string) => withSubjects(enforcer.canViewScope, tenant + "/" + scope),
          canEditNamespace: (scope: string) => withSubjects(enforcer.canEditScope, tenant + "/" + scope),
          canManageNamespace: (scope: string) => withSubjects(enforcer.canManageScope, tenant + "/" + scope),

          canViewCluster: () => withSubjects(enforcer.canViewCluster),
          canEditCluster: () => withSubjects(enforcer.canEditCluster),
          canManageCluster: () => withSubjects(enforcer.canManageCluster),

          canViewTenant: () => withSubjects(enforcer.canViewScope, tenant + "/*"),
          canEditTenant: () => withSubjects(enforcer.canEditScope, tenant + "/*"),
          canManageTenant: () => withSubjects(enforcer.canManageScope, tenant + "/*"),

          canEditAnyNamespace: () => {
            const applications = store.getState().applications.applications;

            for (let i = 0; i < applications.length; i++) {
              if (withSubjects(enforcer.canEditScope, tenant + "/" + applications[i].name)) {
                return true;
              }
            }
            return false;
          },
        },
      });
    }

    return next(action);
  };
};
