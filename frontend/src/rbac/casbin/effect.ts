// EffectorStream provides a stream interface
export interface EffectorStream {
  current(): boolean;
  pushEffect(eft: Effect): [boolean, boolean];
}

export enum Effect {
  Allow = 1,
  Indeterminate,
  Deny,
}

// Effector is the interface for Casbin effectors.
export interface Effector {
  newStream(expr: string): EffectorStream;
}

export class DefaultEffector implements Effector {
  newStream(expr: string): EffectorStream {
    return new DefaultEffectorStream(expr);
  }
}

export class DefaultEffectorStream implements EffectorStream {
  private done = false;
  private res = false;
  private readonly expr: string;

  constructor(expr: string) {
    this.expr = expr;
  }

  current(): boolean {
    return this.res;
  }

  public pushEffect(eft: Effect): [boolean, boolean] {
    switch (this.expr) {
      case "some(where (p_eft == allow))":
        if (eft === Effect.Allow) {
          this.res = true;
          this.done = true;
        }
        break;
      case "!some(where (p_eft == deny))":
        this.res = true;
        if (eft === Effect.Deny) {
          this.res = false;
          this.done = true;
        }
        break;
      case "some(where (p_eft == allow)) && !some(where (p_eft == deny))":
        if (eft === Effect.Allow) {
          this.res = true;
        } else if (eft === Effect.Deny) {
          this.res = false;
          this.done = true;
        }
        break;
      case "priority(p_eft) || deny":
        if (eft !== Effect.Indeterminate) {
          this.res = eft === Effect.Allow;
          this.done = true;
        }
        break;
      default:
        throw new Error("unsupported effect");
    }
    return [this.res, this.done];
  }
}
