import { DefaultRoleManager, RoleManager } from "./roleManager";

export class Assertion {
  public key: string;
  public value: string;
  public tokens: string[];
  public policy: string[][];
  public rm: RoleManager;

  constructor() {
    this.key = "";
    this.value = "";
    this.tokens = [];
    this.policy = [];
    this.rm = new DefaultRoleManager(10);
  }

  public buildRoleLinks(rm: RoleManager): void {
    this.rm = rm;
    const count = (this.value.match(/_/g) || []).length;
    if (count < 2) {
      throw new Error('the number of "_" in role definition should be at least 2');
    }
    for (let rule of this.policy) {
      if (rule.length > count) {
        rule = rule.slice(0, count);
      }

      this.rm.addLink(rule[0], rule[1], ...rule.slice(2));
    }
  }
}
