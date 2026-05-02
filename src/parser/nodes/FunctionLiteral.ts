import type { Token } from "@/lexer/token";
import type { Expression } from "@/parser/ast";
import type { BlockStatement } from "./BlockStatement";

export class FunctionLiteral implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Params: Identifier[],
    public Body: BlockStatement,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    const params = this.Params.map((p) => p.Name).join(", ");
    return `${this.tokenLiteral()}(${params}) ${this.Body.toString()}`;
  }
}

import { Identifier } from "./Identifier";
