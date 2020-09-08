import { newModelFromString } from "rbac/casbin/model";
import { StringAdapter } from "rbac/casbin/persist";
import { CoreEnforcer } from "rbac/casbin/coreEnforcer";

export const RBACModel = `
[request_definition]
r = sub, act, scope, obj

[policy_definition]
p = sub, act, scope, obj

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (r.scope == p.scope || p.scope == "*") && objMatchFunc(r.obj, p.obj) && r.act == p.act
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

  public can(subject: string, action: string, scope: string, resource: string) {
    return this.enforcer.enforce(subject, action, scope, resource);
  }

  public canView(subject: string, scope: string, resource: string) {
    return this.enforcer.enforce(subject, ActionView, scope, resource);
  }

  public canEdit(subject: string, scope: string, resource: string) {
    return this.enforcer.enforce(subject, ActionEdit, scope, resource);
  }

  public canManage(subject: string, scope: string, resource: string) {
    return this.enforcer.enforce(subject, ActionManage, scope, resource);
  }

  public canViewNamespace(subject: string, scope: string) {
    return this.enforcer.enforce(subject, ActionView, scope, ResourceAll);
  }

  public canEditNamespace(subject: string, scope: string) {
    return this.enforcer.enforce(subject, ActionEdit, scope, ResourceAll);
  }

  public canManageNamespace(subject: string, scope: string) {
    return this.enforcer.enforce(subject, ActionManage, scope, ResourceAll);
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
