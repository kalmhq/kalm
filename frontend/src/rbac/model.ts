import { CoreEnforcer } from "rbac/casbin/coreEnforcer";
import { newModelFromString } from "rbac/casbin/model";
import { StringAdapter } from "rbac/casbin/persist";

export const RBACModel = `
[request_definition]
r = subject, action, scope, object

[policy_definition]
p = subject, action, scope, object

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.subject, p.subject) && (r.scope == p.scope || p.scope == "*") && objMatchFunc(r.object, p.object) && r.action == p.action
`;

function objMatch(key1: string, key2: string): boolean {
  const i = key2.indexOf("*");

  if (i === -1) {
    return key1 === key2;
  }

  if (key1.length > i) {
    return key1.slice(0, i) === key2.slice(0, i);
  }

  return key1 === key2.slice(0, i);
}

function objMatchFunc(...args: any[]): boolean {
  const [arg0, arg1] = args;
  const name1: string = (arg0 || "").toString();
  const name2: string = (arg1 || "").toString();

  return objMatch(name1, name2);
}

const ActionView = "view";
const ActionEdit = "edit";
const ActionManage = "manage";
const ResourceAll = "*";
const AllScope = "*";

export class RBACEnforcer {
  private enforcer: CoreEnforcer;
  private policyAdapter: StringAdapter;

  constructor(policies: string) {
    this.policyAdapter = new StringAdapter(policies);
    const enforcer = new CoreEnforcer(newModelFromString(RBACModel), this.policyAdapter);
    enforcer.addFunction("objMatchFunc", objMatchFunc);
    enforcer.loadPolicy();
    this.enforcer = enforcer;
  }

  public loadPolicies(policies: string) {
    this.policyAdapter = new StringAdapter(policies);
    this.enforcer.setAdapter(this.policyAdapter);
    this.enforcer.loadPolicy();
  }

  public can(subject: string, action: string, namespace: string, resource: string) {
    return this.enforcer.enforce(subject, action, namespace, resource);
  }

  public canView(subject: string, namespace: string, resource: string) {
    return this.enforcer.enforce(subject, ActionView, namespace, resource);
  }

  public canEdit(subject: string, namespace: string, resource: string) {
    return this.enforcer.enforce(subject, ActionEdit, namespace, resource);
  }

  public canManage(subject: string, namespace: string, resource: string) {
    return this.enforcer.enforce(subject, ActionManage, namespace, resource);
  }

  public canViewNamespace(subject: string, namespace: string) {
    return this.enforcer.enforce(subject, ActionView, namespace, ResourceAll);
  }

  public canEditNamespace(subject: string, namespace: string) {
    return this.enforcer.enforce(subject, ActionEdit, namespace, ResourceAll);
  }

  public canManageNamespace(subject: string, namespace: string) {
    return this.enforcer.enforce(subject, ActionManage, namespace, ResourceAll);
  }

  public canViewCluster(subject: string) {
    return this.enforcer.enforce(subject, ActionView, AllScope, ResourceAll);
  }

  public canEditCluster(subject: string) {
    return this.enforcer.enforce(subject, ActionEdit, AllScope, ResourceAll);
  }

  public canManageCluster(subject: string) {
    return this.enforcer.enforce(subject, ActionManage, AllScope, ResourceAll);
  }
}
