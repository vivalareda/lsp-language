import type { Token } from "@/lexer/token";
import type { Expression } from "@/parser/ast";

export class Identifier implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Name: string,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return this.Name;
  }
}
