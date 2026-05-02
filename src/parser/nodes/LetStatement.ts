import type { Token } from "@/lexer/token";
import type { Expression, Statement } from "@/parser/ast";

export class LetStatement implements Statement {
  statementNode = true as const;

  constructor(
    public Token: Token,
    public Identifier: Identifier,
    public Value: Expression,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `${this.tokenLiteral()} ${this.Identifier.Name} = ${this.Value.toString()};`;
  }
}
