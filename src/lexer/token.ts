export type Token = {
  Type: TokenType;
  Literal: string;
  Line: number;
  Column: number;
};

export type TokenType = (typeof TOKENS)[keyof typeof TOKENS];

export const TOKENS = {
  ASSIGN: "=",
  PLUS: "+",
  MINUS: "-",
  BANG: "!",
  ASTERISK: "*",
  SLASH: "/",

  INT: "INT",
  IDENT: "IDENT",
  LET: "let",
  RETURN: "return",
  TRUE: "true",
  FALSE: "false",
  FUNC: "func",

  LT: "<",
  GT: ">",
  EQ: "==",
  NEQ: "!=",
  EOF: "EOF",

  COMMA: ",",
  SEMICOLON: ";",
  LPAREN: "(",
  RPAREN: ")",
  LBRACE: "{",
  RBRACE: "}",
  COMMENT: "//",

  ILLEGAL: "ILLEGAL",
} as const;
