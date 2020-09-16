import { Config, ConfigInterface } from "rbac/casbin/config";
import { Assertion } from "./assertion";
import { RoleManager } from "rbac/casbin/roleManager";

// because the expression evaluation doesn't support such variable names.
function escapeAssertion(s: string): string {
  s = s.replace(/r\./g, "r_");
  s = s.replace(/p\./g, "p_");
  return s;
}

export enum PolicyOp {
  PolicyAdd,
  PolicyRemove,
}

export class FunctionMap {
  private functions: Map<string, any>;

  /**
   * constructor is the constructor for FunctionMap.
   */
  constructor() {
    this.functions = new Map<string, any>();
  }

  // loadFunctionMap loads an initial function map.
  public static loadFunctionMap(): FunctionMap {
    const fm = new FunctionMap();
    return fm;
  }

  // addFunction adds an expression function.
  public addFunction(name: string, func: any): void {
    if (!this.functions.get(name)) {
      this.functions.set(name, func);
    }
  }

  // getFunctions return all functions.
  public getFunctions(): any {
    return this.functions;
  }
}

export const sectionNameMap: { [index: string]: string } = {
  r: "request_definition",
  p: "policy_definition",
  g: "role_definition",
  e: "policy_effect",
  m: "matchers",
};

export const requiredSections = ["r", "p", "e", "m"];

export class Model {
  // Model represents the whole access control model.
  // Mest-map is the collection of assertions, can be "r", "p", "g", "e", "m".
  public model: Map<string, Map<string, Assertion>>;

  /**
   * constructor is the constructor for Model.
   */
  constructor() {
    this.model = new Map<string, Map<string, Assertion>>();
  }

  private loadAssertion(cfg: ConfigInterface, sec: string, key: string): boolean {
    const secName = sectionNameMap[sec];
    const value = cfg.getString(`${secName}::${key}`);
    return this.addDef(sec, key, value);
  }

  private getKeySuffix(i: number): string {
    if (i === 1) {
      return "";
    }

    return i.toString();
  }

  public buildRoleLinks(rm: RoleManager): void {
    const astMap = this.model.get("g");

    if (!astMap) {
      return;
    }

    for (const value of Array.from(astMap.values())) {
      value.buildRoleLinks(rm);
    }
  }

  private loadSection(cfg: ConfigInterface, sec: string): void {
    let i = 1;
    for (;;) {
      if (!this.loadAssertion(cfg, sec, sec + this.getKeySuffix(i))) {
        break;
      } else {
        i++;
      }
    }
  }

  // addDef adds an assertion to the model.
  public addDef(sec: string, key: string, value: string): boolean {
    if (value === "") {
      return false;
    }

    const ast = new Assertion();
    ast.key = key;
    ast.value = value;

    if (sec === "r" || sec === "p") {
      const tokens = value.split(",").map((n) => n.trim());

      for (let i = 0; i < tokens.length; i++) {
        tokens[i] = key + "_" + tokens[i];
      }

      ast.tokens = tokens;
    } else if (sec === "m") {
      const stringArguments = value.match(/"(.*?)"/g) || [];

      stringArguments.forEach((n, index) => {
        value = value.replace(n, `$<${index}>`);
      });

      value = escapeAssertion(value);

      stringArguments.forEach((n, index) => {
        value = value.replace(`$<${index}>`, n);
      });

      ast.value = value;
    } else {
      ast.value = escapeAssertion(value);
    }

    const nodeMap = this.model.get(sec);

    if (nodeMap) {
      nodeMap.set(key, ast);
    } else {
      const assertionMap = new Map<string, Assertion>();
      assertionMap.set(key, ast);
      this.model.set(sec, assertionMap);
    }

    return true;
  }

  // loadModelFromText loads the model from the text.
  public loadModelFromText(text: string): void {
    const cfg = Config.newConfigFromText(text);

    this.loadModelFromConfig(cfg);
  }

  public loadModelFromConfig(cfg: ConfigInterface): void {
    for (const s in sectionNameMap) {
      this.loadSection(cfg, s);
    }

    const ms: string[] = [];
    requiredSections.forEach((n) => {
      if (!this.hasSection(n)) {
        ms.push(sectionNameMap[n]);
      }
    });

    if (ms.length > 0) {
      throw new Error(`missing required sections: ${ms.join(",")}`);
    }
  }

  private hasSection(sec: string): boolean {
    return this.model.get(sec) !== undefined;
  }

  // clearPolicy clears all current policy.
  public clearPolicy(): void {
    this.model.forEach((value, key) => {
      if (key === "p" || key === "g") {
        value.forEach((ast) => {
          ast.policy = [];
        });
      }
    });
  }
}

/**
 * newModelFromString creates a model from a string which contains model text.
 */
export function newModelFromString(text: string): Model {
  const m = new Model();
  m.loadModelFromText(text);
  return m;
}
