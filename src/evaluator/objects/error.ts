import type { Token } from "@/lexer/token";
import { OBJECTS, type Object } from "./object";

export class Error implements Object {
  constructor(
    public Message: string,
    public Token: Token,
  ) {}

  Type() {
    return OBJECTS.ERROR_OBJ;
  }

  Inspect() {
    return `ERROR: ${this.Message}`;
  }
}
