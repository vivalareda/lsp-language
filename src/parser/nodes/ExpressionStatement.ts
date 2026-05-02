import type { Token } from "@/lexer/token";
import type { Expression, Statement } from "@/parser/ast";

export class ExpressionStatement implements Statement {
  statementNode = true as const;

  constructor(
    public Token: Token,
    public Expression: Expression,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return this.Expression?.toString() || "";
  }
}
