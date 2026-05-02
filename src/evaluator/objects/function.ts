import type { Identifier } from "@/parser/nodes/Identifier";
import type { BlockStatement } from "@/parser/nodes/IfExpression";
import type { Environment } from "./environment";
import { OBJECTS, type Object } from "./object";

export class Function implements Object {
  constructor(
    public parameters: Identifier[],
    public body: BlockStatement,
    public env: Environment,
  ) {}

  Type() {
    return OBJECTS.FUNCTION_OBJ;
  }

  Inspect(): string {
    const params = this.parameters.map((p) => p.Name).join(", ");
    return `func(${params}) { ... }`;
  }
}
