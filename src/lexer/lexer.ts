import type { Token, TokenType } from "./token";
import { TOKENS } from "./token";

export class Lexer {
  private currPosition: number;
  private nextPosition: number;
  private currChar: string | null;
  private line: number;
  private column: number;

  constructor(public input: string) {
    this.currPosition = 0;
    this.nextPosition = 0;
    this.currChar = null;
    this.line = 1;
    this.column = 0;

    this.readChar();
  }

  nextToken(): Token {
    this.skipWhitespace();

    const line = this.line;
    const column = this.column;
    let token: Token;

    switch (this.currChar) {
      case "=":
        if (this.peek() === "=") {
          const literal = this.input[this.currPosition];
          this.readChar();
          token = {
            Type: TOKENS.EQ,
            Literal: literal + this.currChar,
            Line: line,
            Column: column,
          };
        } else {
          token = {
            Type: TOKENS.ASSIGN,
            Literal: this.currChar,
            Line: line,
            Column: column,
          };
        }
        break;
      case "!":
        if (this.peek() === "=") {
          const literal = this.input[this.currPosition];
          this.readChar();
          token = {
            Type: TOKENS.NEQ,
            Literal: literal + this.currChar,
            Line: line,
            Column: column,
          };
        } else {
          token = {
            Type: TOKENS.BANG,
            Literal: this.currChar,
            Line: line,
            Column: column,
          };
        }
        break;
      case "<":
        token = {
          Type: TOKENS.LT,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ">":
        token = {
          Type: TOKENS.GT,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "(":
        token = {
          Type: TOKENS.LPAREN,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ")":
        token = {
          Type: TOKENS.RPAREN,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "{":
        token = {
          Type: TOKENS.LBRACE,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "}":
        token = {
          Type: TOKENS.RBRACE,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ",":
        token = {
          Type: TOKENS.COMMA,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ";":
        token = {
          Type: TOKENS.SEMICOLON,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "/":
        if (this.peek() === "/") {
          this.skipComment();
          return this.nextToken();
        }
        token = {
          Type: TOKENS.SLASH,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "*":
        token = {
          Type: TOKENS.ASTERISK,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "+":
        token = {
          Type: TOKENS.PLUS,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "-":
        token = {
          Type: TOKENS.MINUS,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case null:
        token = { Type: TOKENS.EOF, Literal: "", Line: line, Column: column };
        break;
      default:
        if (this.isLetter(this.currChar)) {
          const literal = this.readIdentifier();
          const type = this.identifierType(literal);
          token = {
            Type: type,
            Literal: literal,
            Line: line,
            Column: column,
          };
          return token;
        } else if (this.isDigit(this.currChar)) {
          const literal = this.readNumber();
          token = {
            Type: TOKENS.INT,
            Literal: literal,
            Line: line,
            Column: column,
          };
          return token;
        } else {
          token = {
            Type: TOKENS.ILLEGAL,
            Literal: this.currChar,
            Line: line,
            Column: column,
          };
        }
    }

    this.readChar();
    return token;
  }

  skipComment() {
    while (this.currChar !== null && this.currChar !== "\n") {
      this.readChar();
    }
  }

  peek(): string {
    if (this.currPosition >= this.input.length) {
      return "";
    }
    const peekChar = this.input[this.nextPosition];
    if (!peekChar) return "";
    return peekChar;
  }

  readIdentifier(): string {
    let startingPosition = this.currPosition;
    while (this.isLetter(this.currChar)) {
      this.readChar();
    }
    return this.input.slice(startingPosition, this.currPosition);
  }

  readNumber(): string {
    let startingPosition = this.currPosition;
    while (this.isDigit(this.currChar)) {
      this.readChar();
    }
    return this.input.slice(startingPosition, this.currPosition);
  }

  identifierType(ident: string): TokenType {
    switch (ident) {
      case "let":
        return TOKENS.LET;
      case "func":
        return TOKENS.FUNC;
      case "return":
        return TOKENS.RETURN;
      case "true":
        return TOKENS.TRUE;
      case "false":
        return TOKENS.FALSE;
      default:
        return TOKENS.IDENT;
    }
  }

  readChar() {
    if (this.nextPosition >= this.input.length) {
      this.currChar = null;
    } else {
      const input = this.input[this.nextPosition];
      if (!input) throw new Error("expected a value but got nothing");
      this.currChar = input;
    }
    this.currPosition = this.nextPosition;
    this.nextPosition++;

    this.updatePosition(this.currChar);
  }

  updatePosition(ch: string | null) {
    if (ch === "\n") {
      this.line++;
      this.column = 0;
    } else if (ch !== null) {
      this.column++;
    }
  }

  isLetter(ch: string | null): boolean {
    if (ch === null) return false;
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  isDigit(ch: string | null): boolean {
    if (ch === null) return false;
    return ch >= "0" && ch <= "9";
  }

  skipWhitespace() {
    while (
      this.currChar === " " ||
      this.currChar === "\t" ||
      this.currChar === "\n" ||
      this.currChar === "\r"
    ) {
      this.readChar();
    }
  }
}
