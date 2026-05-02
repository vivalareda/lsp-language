import type { Token } from "@/lexer/token";
import type { Expression } from "@/parser/ast";

export class FunctionCallExpression implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Function: Expression,
    public Arguments: Expression[],
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    const args = this.Arguments.map((arg) => arg.toString()).join(", ");
    return `${this.Function.toString()}(${args})`;
  }
}
