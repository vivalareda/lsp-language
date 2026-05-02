import type { Token } from "@/lexer/token";
import { Error } from "./error";
import { Integer } from "./integer";
import { CONSTANT_OBJECTS, OBJECTS, type Object } from "./object";

type BuiltinFunction = (token: Token, ...args: Object[]) => Object;

const print: BuiltinFunction = (_, ...args: Object[]) => {
  for (const arg of args) {
    console.log(arg.Inspect());
  }
  return CONSTANT_OBJECTS.null;
};

export class Builtin implements Object {
  constructor(public func: BuiltinFunction) {}

  Type() {
    return OBJECTS.BUILTIN_OBJ;
  }

  Inspect(): string {
    return "builtin function";
  }
}

export const BUILTIN_FUCTIONS: Map<string, Builtin> = new Map([
  ["print", new Builtin(print)],
]);
