import { describe, expect, it } from "bun:test";
import { Lexer } from "./lexer";
import { TOKENS, type TokenType } from "./token";

describe("lexer", () => {
  it("should lex symbols correctly", () => {
    const input = "=+(){},;";
    const tests = [
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.PLUS, expectedLiteral: "+" },
      { expectedType: TOKENS.LPAREN, expectedLiteral: "(" },
      { expectedType: TOKENS.RPAREN, expectedLiteral: ")" },
      { expectedType: TOKENS.LBRACE, expectedLiteral: "{" },
      { expectedType: TOKENS.RBRACE, expectedLiteral: "}" },
      { expectedType: TOKENS.COMMA, expectedLiteral: "," },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.EOF, expectedLiteral: "" },
    ];

    const lexer = new Lexer(input);

    for (const test of tests) {
      const token = lexer.nextToken();
      expect(token.Type).toBe(test.expectedType as TokenType);
      expect(token.Literal).toBe(test.expectedLiteral);
    }
  });

  it("should lex source code correctly", () => {
    const input = `let five = 5;
let add = func(a, b) {
  return a + b;
}
!-/*5;
5 < 10 > 5;
`;

    const tests = [
      { expectedType: TOKENS.LET, expectedLiteral: "let" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "five" },
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.LET, expectedLiteral: "let" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "add" },
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.FUNC, expectedLiteral: "func" },
      { expectedType: TOKENS.LPAREN, expectedLiteral: "(" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "a" },
      { expectedType: TOKENS.COMMA, expectedLiteral: "," },
      { expectedType: TOKENS.IDENT, expectedLiteral: "b" },
      { expectedType: TOKENS.RPAREN, expectedLiteral: ")" },
      { expectedType: TOKENS.LBRACE, expectedLiteral: "{" },
      { expectedType: TOKENS.RETURN, expectedLiteral: "return" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "a" },
      { expectedType: TOKENS.PLUS, expectedLiteral: "+" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "b" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.RBRACE, expectedLiteral: "}" },
      { expectedType: TOKENS.BANG, expectedLiteral: "!" },
      { expectedType: TOKENS.MINUS, expectedLiteral: "-" },
      { expectedType: TOKENS.SLASH, expectedLiteral: "/" },
      { expectedType: TOKENS.ASTERISK, expectedLiteral: "*" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.LT, expectedLiteral: "<" },
      { expectedType: TOKENS.INT, expectedLiteral: "10" },
      { expectedType: TOKENS.GT, expectedLiteral: ">" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.EOF, expectedLiteral: "" },
    ];

    const lexer = new Lexer(input);

    for (const test of tests) {
      const token = lexer.nextToken();
      expect(token.Type).toBe(test.expectedType as TokenType);
      expect(token.Literal).toBe(test.expectedLiteral);
    }
  });

  it("should skip comments", () => {
    const input = "let x = 5; // this is a comment\nlet y = 10;";
    const tests = [
      { expectedType: TOKENS.LET, expectedLiteral: "let" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "x" },
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.LET, expectedLiteral: "let" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "y" },
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.INT, expectedLiteral: "10" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.EOF, expectedLiteral: "" },
    ];

    const lexer = new Lexer(input);

    for (const test of tests) {
      const token = lexer.nextToken();
      expect(token.Type).toBe(test.expectedType as TokenType);
      expect(token.Literal).toBe(test.expectedLiteral);
    }
  });

  it("should track line and column", () => {
    const input = "let x = 5;\nlet y = 10;";
    const lexer = new Lexer(input);

    const token = lexer.nextToken(); // let
    expect(token.Line).toBe(1);
    expect(token.Column).toBe(1);

    lexer.nextToken(); // x
    lexer.nextToken(); // =
    lexer.nextToken(); // 5
    const semi = lexer.nextToken(); // ;
    expect(semi.Line).toBe(1);
    expect(semi.Column).toBe(10);

    const let2 = lexer.nextToken(); // let
    expect(let2.Line).toBe(2);
    expect(let2.Column).toBe(1);
  });
});
