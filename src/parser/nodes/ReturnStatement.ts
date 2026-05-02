import type { Token } from "@/lexer/token";
import type { Statement, Expression } from "@/parser/ast";

export class ReturnStatement implements Statement {
  statementNode = true as const;

  constructor(
    public Token: Token,
    public ReturnValue: Expression,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `${this.tokenLiteral()} ${this.ReturnValue?.toString() || ""};`;
  }
}
