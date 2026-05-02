export * from "@/parser/nodes/BlockStatement";
export * from "@/parser/nodes/ExpressionStatement";
export * from "@/parser/nodes/Identifier";
export * from "@/parser/nodes/LetStatement";
export * from "@/parser/nodes/PrefixExpression";
export * from "@/parser/nodes/ReturnStatement";

export type Node = Statement | Expression | Program;

export interface Statement {
  tokenLiteral: () => string;
  statementNode: true;
}

export interface Expression {
  tokenLiteral: () => String;
  expressionNode: true;
}

export class Program {
  statements: Statement[];
  constructor() {
    this.statements = [];
  }

  toString(): string {
    let out = "";
    for (const stmt of this.statements) {
      out += stmt.toString();
    }
    return out;
  }
}
