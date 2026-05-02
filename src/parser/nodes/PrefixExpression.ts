import type { Token } from "@/lexer/token";
import type { Expression } from "@/parser/ast";

export class PrefixExpression implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Operator: string,
    public Right: Expression,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `(${this.Operator}${this.Right.toString()})`;
  }
}
