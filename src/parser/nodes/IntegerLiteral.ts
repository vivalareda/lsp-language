import type { Token } from "@/lexer/token";
import type { Expression } from "@/parser/ast";

export class IntegerLiteral implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Value: number,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return this.Value.toString();
  }
}
