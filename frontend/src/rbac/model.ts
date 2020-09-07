import { Enforcer, newEnforcer, newModelFromString, StringAdapter } from "casbin";

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
m = g(r.sub, p.sub) && (r.scope == p.scope || p.scope == "*") && objMatchFunc(r.obj, p.obj) && r.act == p.act`;

function objMatch(key1: string, key2: string): boolean {
  const i = key2.indexOf("*");

  if (i === -1) {
    return key1 === key2;
  }

  if (key1.length > i) {
    return key1.slice(0, i) === key2.slice(0, i);
  }

  return key1 == key2.slice(0, i);
}

export const newRBACEnforcer = async (policies: string) => {
  const enforcer = await newEnforcer(newModelFromString(RBACModel), new StringAdapter(policies));
  await enforcer.addFunction("objMatchFunc", objMatch);
  return enforcer;
};

const ActionView = "view";
const ActionEdit = "edit";
const ActionManage = "manage";
const ResourceAll = "*";
const AllScope = "*";

export class RBACEnforcer {
  private policies: string = "";
  private enforcer?: Enforcer;

  constructor(policies: string) {
    this.policies = policies;
  }

  public async init() {
    if (this.enforcer) {
      return;
    }

    const enforcer = await newEnforcer(newModelFromString(RBACModel), new StringAdapter(this.policies));
    await enforcer.addFunction("objMatchFunc", objMatch);
    this.enforcer = enforcer;
  }

  public async can(subject: string, action: string, scope: string, resource: string) {
    await this.init();
    return this.enforcer!.enforce(subject, action, scope, resource);
  }

  public async canView(subject: string, scope: string, resource: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionView, scope, resource);
  }

  public async canEdit(subject: string, scope: string, resource: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionEdit, scope, resource);
  }

  public async canManage(subject: string, scope: string, resource: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionManage, scope, resource);
  }

  public async canViewNamespace(subject: string, scope: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionView, scope, ResourceAll);
  }

  public async canEditNamespace(subject: string, scope: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionEdit, scope, ResourceAll);
  }

  public async canManageNamespace(subject: string, scope: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionManage, scope, ResourceAll);
  }

  public async canViewCluster(subject: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionView, AllScope, ResourceAll);
  }

  public async canEditCluster(subject: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionEdit, AllScope, ResourceAll);
  }

  public async canManageCluster(subject: string) {
    await this.init();
    return this.enforcer!.enforce(subject, ActionManage, AllScope, ResourceAll);
  }
}
