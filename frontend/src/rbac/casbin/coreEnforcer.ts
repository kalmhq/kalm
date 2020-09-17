import { compile } from "expression-eval";
import { DefaultRoleManager, RoleManager } from "rbac/casbin/roleManager";
import { DefaultEffector, Effect, Effector } from "./effect";
import { FunctionMap, Model } from "./model";
import { Adapter } from "./persist";

function generateGFunction(rm: RoleManager): any {
  return function func(...args: any[]): boolean {
    const [arg0, arg1] = args;
    const name1: string = (arg0 || "").toString();
    const name2: string = (arg1 || "").toString();

    if (!rm) {
      return name1 === name2;
    } else if (args.length === 2) {
      return rm.hasLink(name1, name2);
    } else {
      const domain: string = args[2].toString();
      return rm.hasLink(name1, name2, domain);
    }
  };
}

type Matcher = ((context: object) => Promise<any>) | ((context: object) => any);

/**
 * CoreEnforcer defines the core functionality of an enforcer.
 */
export class CoreEnforcer {
  protected model: Model;
  protected fm: FunctionMap = FunctionMap.loadFunctionMap();
  protected eft: Effector = new DefaultEffector();
  protected adapter: Adapter;
  private matcherMap: Map<string, Matcher> = new Map();
  protected rm: RoleManager = new DefaultRoleManager(10);

  constructor(model: Model, adapter: Adapter) {
    this.model = model;
    this.adapter = adapter;
  }

  private getExpression(exp: string): Matcher {
    const matcherKey = exp;

    let expression = this.matcherMap.get(matcherKey);

    if (!expression) {
      expression = compile(exp);
      this.matcherMap.set(matcherKey, expression);
    }

    return expression;
  }

  public setAdapter(adapter: Adapter): void {
    this.adapter = adapter;
  }

  public clearPolicy(): void {
    this.model.clearPolicy();
  }

  public addFunction(name: string, func: any) {
    this.fm.addFunction(name, func);
  }

  public loadPolicy(): void {
    this.model.clearPolicy();
    this.adapter.loadPolicy(this.model);
    this.buildRoleLinksInternal();
  }

  protected buildRoleLinksInternal(): void {
    this.rm.clear();
    this.model.buildRoleLinks(this.rm);
  }

  private privateEnforce(...rvals: any[]): boolean {
    const functions: { [key: string]: any } = {};

    this.fm.getFunctions().forEach((value: any, key: string) => {
      functions[key] = value;
    });

    const astMap = this.model.model.get("g");

    astMap?.forEach((value, key) => {
      const rm = value.rm;
      functions[key] = generateGFunction(rm);
    });

    const expString = this.model.model.get("m")?.get("m")?.value;

    if (!expString) {
      throw new Error("Unable to find matchers in model");
    }

    const effectExpr = this.model.model.get("e")?.get("e")?.value;

    if (!effectExpr) {
      throw new Error("Unable to find policy_effect in model");
    }

    let expression = this.getExpression(expString);

    const p = this.model.model.get("p")?.get("p");
    const policyLen = p?.policy?.length;

    const rTokens = this.model.model.get("r")?.get("r")?.tokens;
    const rTokensLen = rTokens?.length;

    const effectStream = this.eft.newStream(effectExpr);

    if (policyLen && policyLen !== 0) {
      for (let i = 0; i < policyLen; i++) {
        const parameters: { [key: string]: any } = {};

        if (rTokens?.length !== rvals.length) {
          throw new Error(`invalid request size: expected ${rTokensLen}, got ${rvals.length}, rvals: ${rvals}"`);
        }

        rTokens.forEach((token, j) => {
          parameters[token] = rvals[j];
        });

        p?.tokens.forEach((token, j) => {
          parameters[token] = p?.policy[i][j];
        });

        let result;
        if (expression !== undefined) {
          const context = { ...parameters, ...functions };
          result = expression(context);
        }

        let eftRes: Effect;
        switch (typeof result) {
          case "boolean":
            eftRes = result ? Effect.Allow : Effect.Indeterminate;
            break;
          case "number":
            if (result === 0) {
              eftRes = Effect.Indeterminate;
            } else {
              eftRes = result;
            }
            break;
          default:
            throw new Error("matcher result should be boolean or number");
        }

        const eft = parameters["p_eft"];
        if (eft && eftRes === Effect.Allow) {
          if (eft === "allow") {
            eftRes = Effect.Allow;
          } else if (eft === "deny") {
            eftRes = Effect.Deny;
          } else {
            eftRes = Effect.Indeterminate;
          }
        }

        const [, done] = effectStream.pushEffect(eftRes);

        if (done) {
          break;
        }
      }
    } else {
      const parameters: { [key: string]: any } = {};

      rTokens?.forEach((token, j): void => {
        parameters[token] = rvals[j];
      });

      p?.tokens?.forEach((token) => {
        parameters[token] = "";
      });

      let result = false;

      if (expression !== undefined) {
        const context = { ...parameters, ...functions };
        result = expression(context);
      }

      if (result) {
        effectStream.pushEffect(Effect.Allow);
      } else {
        effectStream.pushEffect(Effect.Indeterminate);
      }
    }

    const res = effectStream.current();

    return res;
  }

  public enforce(...rvals: any[]): boolean {
    return this.privateEnforce(...rvals);
  }
}
