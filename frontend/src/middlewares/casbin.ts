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
      // FIXME: remove comments
      enforcer.loadPolicies(action.payload.loginStatus.policies);
      // const policy = `p, tenant_free10subioq5ffshyisjlg_owner, view, */*, storageClasses/*\np, tenant_free10subioq5ffshyisjlg_owner, view, free10subioq5ffshyisjlg/*, */*\np, tenant_free10subioq5ffshyisjlg_owner, edit, free10subioq5ffshyisjlg/*, */*\np, tenant_free10subioq5ffshyisjlg_owner, manage, free10subioq5ffshyisjlg/*, */*\np, tenant_free8subiospi7whwfpocb_owner, view, */*, storageClasses/*\np, tenant_free8subiospi7whwfpocb_owner, view, free8subiospi7whwfpocb/*, */*\np, tenant_free8subiospi7whwfpocb_owner, edit, free8subiospi7whwfpocb/*, */*\np, tenant_free8subiospi7whwfpocb_owner, manage, free8subiospi7whwfpocb/*, */*\np, tenant_free9subiovafzlplyy90z_owner, view, */*, storageClasses/*\np, tenant_free9subiovafzlplyy90z_owner, view, free9subiovafzlplyy90z/*, */*\np, tenant_free9subiovafzlplyy90z_owner, edit, free9subiovafzlplyy90z/*, */*\np, tenant_free9subiovafzlplyy90z_owner, manage, free9subiovafzlplyy90z/*, */*\np, tenant_free1subiou4wm9zk8t9lv_owner, view, */*, storageClasses/*\np, tenant_free1subiou4wm9zk8t9lv_owner, view, free1subiou4wm9zk8t9lv/*, */*\np, tenant_free1subiou4wm9zk8t9lv_owner, edit, free1subiou4wm9zk8t9lv/*, */*\np, tenant_free1subiou4wm9zk8t9lv_owner, manage, free1subiou4wm9zk8t9lv/*, */*\np, tenant_global_owner, view, */*, storageClasses/*\np, tenant_global_owner, view, global/*, */*\np, tenant_global_owner, edit, global/*, */*\np, tenant_global_owner, manage, global/*, */*\np, tenant_free5subioskguds8f1tep_owner, view, */*, storageClasses/*\np, tenant_free5subioskguds8f1tep_owner, view, free5subioskguds8f1tep/*, */*\np, tenant_free5subioskguds8f1tep_owner, edit, free5subioskguds8f1tep/*, */*\np, tenant_free5subioskguds8f1tep_owner, manage, free5subioskguds8f1tep/*, */*\ng, user-ialaddin@me.com, tenant_free10subioq5ffshyisjlg_owner\ng, user-ialaddin@me.com, tenant_free8subiospi7whwfpocb_owner\ng, user-ialaddin@me.com, tenant_free9subiovafzlplyy90z_owner\ng, user-ialaddin@me.com, tenant_free1subiou4wm9zk8t9lv_owner\ng, user-ialaddin@me.com, tenant_global_owner\ng, user-ialaddin@me.com, tenant_free5subioskguds8f1tep_owner`;
      // enforcer.loadPolicies(policy);

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

      const { tenant } = action.payload.loginStatus;

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
