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

      store.dispatch({
        type: SET_AUTH_METHODS,
        payload: {
          can: (action: string, namespace: string, resource: string) =>
            withSubjects(enforcer.can, action, namespace, resource),

          canView: (namespace: string, resource: string) => withSubjects(enforcer.canView, namespace, resource),
          canEdit: (namespace: string, resource: string) => withSubjects(enforcer.canEdit, namespace, resource),
          canManage: (namespace: string, resource: string) => withSubjects(enforcer.canManage, namespace, resource),

          canViewNamespace: (namespace: string) => withSubjects(enforcer.canViewNamespace, namespace),
          canEditNamespace: (namespace: string) => withSubjects(enforcer.canEditNamespace, namespace),
          canManageNamespace: (namespace: string) => withSubjects(enforcer.canManageNamespace, namespace),

          canViewCluster: () => withSubjects(enforcer.canViewCluster),
          canEditCluster: () => withSubjects(enforcer.canEditCluster),
          canManageCluster: () => withSubjects(enforcer.canManageCluster),
        },
      });
    }

    return next(action);
  };
};
