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
m = g(r.subject, p.subject) && objectMatchFunc(r.scope, p.scope) && objectMatchFunc(r.object, p.object) && r.action == p.action
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

  const name1Parts = name1.split("/");
  const name2Parts = name2.split("/");

  if (name1Parts.length !== 2) {
    throw `wrong object in objectMatchFunc ${name1}`;
  }

  if (name2Parts.length !== 2) {
    throw `wrong object in objectMatchFunc ${name2}`;
  }

  return objMatch(name1Parts[0], name2Parts[0]) && objMatch(name1Parts[1], name2Parts[1]);
}

const ActionView = "view";
const ActionEdit = "edit";
const ActionManage = "manage";
const ResourceAll = "*/*";
const AllScope = "*/*";

export class RBACEnforcer {
  private enforcer: CoreEnforcer;
  private policyAdapter: StringAdapter;

  constructor(policies: string) {
    this.policyAdapter = new StringAdapter(policies);
    const enforcer = new CoreEnforcer(newModelFromString(RBACModel), this.policyAdapter);
    enforcer.addFunction("objectMatchFunc", objMatchFunc);
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

  public canViewScope(subject: string, scope: string) {
    return this.enforcer.enforce(subject, ActionView, scope, ResourceAll);
  }

  public canEditScope(subject: string, scope: string) {
    return this.enforcer.enforce(subject, ActionEdit, scope, ResourceAll);
  }

  public canManageScope(subject: string, scope: string) {
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
