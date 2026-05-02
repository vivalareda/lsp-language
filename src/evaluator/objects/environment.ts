import type { Object } from "./object";

export class Environment {
  private store: Map<string, Object>;
  private outer: Environment | null;

  constructor(outer: Environment | null = null) {
    this.store = new Map();
    this.outer = outer;
  }

  get(name: string) {
    return this.store.get(name) ?? this.outer?.get(name);
  }

  set(name: string, val: Object) {
    this.store.set(name, val);
    return val;
  }
}
