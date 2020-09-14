import { Model } from "rbac/casbin/model";

export interface Adapter {
  loadPolicy(model: Model): void;
}

const loadPolicyLine = (line: string, model: Model) => {
  if (!line || line.trim() === "" || line.charAt(0) === "#") {
    return;
  }

  const tokens = line.split(",").map((n) => n.trim());
  const key = tokens[0];
  const sec = key.substring(0, 1);
  const item = model.model.get(sec);
  if (!item) {
    return;
  }

  const policy = item.get(key);
  if (!policy) {
    return;
  }
  policy.policy.push(tokens.slice(1));
};

export class StringAdapter implements Adapter {
  public readonly policy: string;

  constructor(policy: string) {
    this.policy = policy;
  }

  public loadPolicy(model: Model) {
    this.loadRules(model, loadPolicyLine);
  }

  private loadRules(model: Model, handler: (line: string, model: Model) => void): void {
    const rules = this.policy.split("\n");

    rules.forEach((n: string) => {
      const line = n.trim();

      if (!line) {
        return;
      }

      handler(n, model);
    });
  }
}
