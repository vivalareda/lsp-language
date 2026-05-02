import type { Statement } from "@/parser/ast";
import type { Token } from "@/lexer/token";

export class BlockStatement implements Statement {
  statementNode = true as const;

  statements: Statement[];

  constructor(public Token: Token) {
    this.statements = [];
  }

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    let out = "";
    for (const stmt of this.statements) {
      out += stmt.toString();
    }
    return out;
  }
}
