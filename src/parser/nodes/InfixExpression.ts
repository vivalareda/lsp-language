import type { Token } from "@/lexer/token";
import type { Expression } from "@/parser/ast";

export class InfixExpression implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Left: Expression,
    public Operator: string,
    public Right: Expression,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `(${this.Left.toString()} ${this.Operator} ${this.Right.toString()})`;
  }
}
