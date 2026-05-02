import type { Lexer } from "@/lexer/lexer";
import { TOKENS, type Token, type TokenType } from "@/lexer/token";
import {
  type Expression,
  ExpressionStatement,
  ReturnStatement,
} from "@/parser/ast";
import { LetStatement } from "@/parser/nodes/LetStatement";
import { Identifier, PrefixExpression, Program } from "./ast";
import { BooleanLiteral } from "./nodes/BooleanLiteral";
import { FunctionCallExpression } from "./nodes/CallExpression";
import { FunctionLiteral } from "./nodes/FunctionLiteral";
import { BlockStatement } from "./nodes/BlockStatement";
import { InfixExpression } from "./nodes/InfixExpression";
import { IntegerLiteral } from "./nodes/IntegerLiteral";

export type PrefixParseFn = () => Expression;
export type InfixParseFns = (exp: Expression) => Expression;

const PRECEDENCE = {
  LOWEST: 1,
  EQUALS: 2,
  LESSGREATER: 3,
  SUM: 4,
  PRODUCT: 5,
  PREFIX: 6,
  CALL: 7,
} as const;

type PRECEDENCES = (typeof PRECEDENCE)[keyof typeof PRECEDENCE];

const precedenceMap: Map<string, PRECEDENCES> = new Map([
  [TOKENS.LPAREN, PRECEDENCE.CALL],
  [TOKENS.EQ, PRECEDENCE.EQUALS],
  [TOKENS.NEQ, PRECEDENCE.EQUALS],
  [TOKENS.LT, PRECEDENCE.LESSGREATER],
  [TOKENS.GT, PRECEDENCE.LESSGREATER],
  [TOKENS.PLUS, PRECEDENCE.SUM],
  [TOKENS.MINUS, PRECEDENCE.SUM],
  [TOKENS.SLASH, PRECEDENCE.PRODUCT],
  [TOKENS.ASTERISK, PRECEDENCE.PRODUCT],
]);

export type ParseError = {
  message: string;
  token: Token;
};

export class Parser {
  currToken: Token;
  peekToken: Token;
  errors: ParseError[] = [];
  prefixParseFn: Map<TokenType, PrefixParseFn> = new Map();
  infixParseFn: Map<TokenType, InfixParseFns> = new Map();

  constructor(public lexer: Lexer) {
    this.lexer = lexer;
    this.registerFnMaps();

    this.nextToken();
    this.nextToken();
  }

  registerFnMaps() {
    this.registerPrefixFn(TOKENS.IDENT, this.parseIdentifier.bind(this));
    this.registerPrefixFn(TOKENS.INT, this.parseIntegerExpression.bind(this));
    this.registerPrefixFn(
      TOKENS.LPAREN,
      this.parseGroupedExpression.bind(this),
    );
    this.registerPrefixFn(TOKENS.TRUE, this.parseBoolean.bind(this));
    this.registerPrefixFn(TOKENS.FALSE, this.parseBoolean.bind(this));
    this.registerPrefixFn(TOKENS.BANG, this.parsePrefixExpression.bind(this));
    this.registerPrefixFn(TOKENS.MINUS, this.parsePrefixExpression.bind(this));
    this.registerPrefixFn(
      TOKENS.FUNC,
      this.parseFunctionExpression.bind(this),
    );

    this.registerInfixFn(
      TOKENS.LPAREN,
      this.parseFunctionCallExpression.bind(this),
    );
    this.registerInfixFn(TOKENS.PLUS, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.MINUS, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.ASTERISK, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.SLASH, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.GT, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.LT, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.EQ, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.NEQ, this.parseInfixExpression.bind(this));
  }

  registerPrefixFn(type: TokenType, fn: PrefixParseFn) {
    this.prefixParseFn.set(type, fn);
  }

  registerInfixFn(type: TokenType, fn: InfixParseFns) {
    this.infixParseFn.set(type, fn);
  }

  expectPeekAndAdvance(expected: string) {
    if (this.peekToken.Type !== expected) {
      this.peekError(expected);
      return false;
    }
    this.nextToken();
    return true;
  }

  peekError(expectedType: string) {
    const msg = `expected "${expectedType}" but got "${this.peekToken.Type}" at line ${this.peekToken.Line}, column ${this.peekToken.Column}`;
    this.errors.push({
      message: msg,
      token: this.peekToken,
    });
  }

  parseFunctionParams() {
    let params: Identifier[] = [];

    if (this.peekTokenIs(TOKENS.RPAREN)) {
      this.nextToken();
      return params;
    }

    this.nextToken();
    const ident = new Identifier(this.currToken, this.currToken.Literal);
    params.push(ident);

    while (this.peekTokenIs(TOKENS.COMMA)) {
      this.nextToken();
      this.nextToken();
      const ident = new Identifier(this.currToken, this.currToken.Literal);
      params.push(ident);
    }

    if (!this.expectPeekAndAdvance(TOKENS.RPAREN)) {
      return [];
    }

    return params;
  }

  parseFunctionExpression() {
    const token = this.currToken;

    if (!this.expectPeekAndAdvance(TOKENS.LPAREN)) {
      return null;
    }

    const params = this.parseFunctionParams();

    if (!this.expectPeekAndAdvance(TOKENS.LBRACE)) {
      return null;
    }

    const body = this.parseBlockStatement();

    return new FunctionLiteral(token, params, body);
  }

  parseFunctionCallExpression(func: Expression) {
    const args = this.parseExpressionList(TOKENS.RPAREN);
    return new FunctionCallExpression(this.currToken, func, args);
  }

  parseExpressionList(endToken: string) {
    const elements: Expression[] = [];

    if (this.peekTokenIs(endToken)) {
      this.nextToken();
      return elements;
    }

    this.nextToken();
    const first = this.parseExpression(PRECEDENCE.LOWEST);
    if (!first) {
      this.unexpectedTokenError(this.currToken, "expression");
      return elements;
    }
    elements.push(first);

    while (this.peekTokenIs(TOKENS.COMMA)) {
      this.nextToken();
      this.nextToken();
      const expr = this.parseExpression(PRECEDENCE.LOWEST);
      if (!expr) {
        this.unexpectedTokenError(this.currToken, "expression");
        return elements;
      }
      elements.push(expr);
    }

    if (!this.expectPeekAndAdvance(endToken)) {
      return [];
    }

    return elements;
  }

  parseBlockStatement() {
    const openingToken = this.currToken;
    const blockStatement = new BlockStatement(this.currToken);

    this.nextToken();

    while (!this.currTokenIs(TOKENS.RBRACE) && !this.currTokenIs(TOKENS.EOF)) {
      const stmt = this.parseStatement();
      if (stmt) {
        blockStatement.statements.push(stmt);
      }
      this.nextToken();
    }

    if (this.currTokenIs(TOKENS.EOF)) {
      this.errors.push({
        message: `expected "}" but reached end of file at line ${openingToken.Line}, column ${openingToken.Column}`,
        token: openingToken,
      });
    }

    return blockStatement;
  }

  parseGroupedExpression() {
    this.nextToken();

    const exp = this.parseExpression(PRECEDENCE.LOWEST);
    if (!exp) {
      this.unexpectedTokenError(this.currToken, "expression");
      return null;
    }

    if (!this.expectPeekAndAdvance(TOKENS.RPAREN)) {
      return null;
    }

    return exp;
  }

  parseInfixExpression(leftExp: Expression) {
    const token = this.currToken;
    const precedence = this.currPrecedence();

    this.nextToken();
    const rightExp = this.parseExpression(precedence);
    if (!rightExp) {
      this.unexpectedTokenError(this.currToken, "expression");
      return leftExp;
    }

    return new InfixExpression(token, leftExp, token.Literal, rightExp);
  }

  parseIntegerExpression() {
    return new IntegerLiteral(
      this.currToken,
      Number.parseInt(this.currToken.Literal, 10),
    );
  }

  parseBoolean() {
    return new BooleanLiteral(this.currToken, this.currTokenIs(TOKENS.TRUE));
  }

  parsePrefixExpression() {
    const token = this.currToken;

    this.nextToken();

    const expr = this.parseExpression(PRECEDENCE.PREFIX);
    if (!expr) {
      this.unexpectedTokenError(this.currToken, "expression");
      return null;
    }

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new PrefixExpression(token, token.Literal, expr);
  }

  parseIdentifier() {
    return new Identifier(this.currToken, this.currToken.Literal);
  }

  parseStatement() {
    switch (this.currToken.Type) {
      case TOKENS.LET:
        return this.parseDeclaration();
      case TOKENS.RETURN:
        return this.parseReturn();
      default:
        return this.parseExpressionStatement();
    }
  }

  parseExpression(precedence: PRECEDENCES) {
    const prefix = this.prefixParseFn.get(this.currToken.Type);
    if (!prefix) {
      return null;
    }

    let leftExp = prefix();

    while (
      this.peekPrecedence() > precedence &&
      !this.peekTokenIs(TOKENS.SEMICOLON)
    ) {
      const infix = this.infixParseFn.get(this.peekToken.Type);
      if (!infix) {
        return leftExp;
      }

      this.nextToken();
      leftExp = infix(leftExp);
    }

    return leftExp;
  }

  unexpectedTokenError(token: Token, expected: string) {
    this.errors.push({
      message: `expected ${expected} but got "${token.Type}" at line ${token.Line}, column ${token.Column}`,
      token,
    });
  }

  peekPrecedence() {
    if (this.peekToken && precedenceMap.has(this.peekToken.Type)) {
      return precedenceMap.get(this.peekToken.Type)!;
    }

    return PRECEDENCE.LOWEST;
  }

  currPrecedence() {
    if (this.currToken && precedenceMap.has(this.currToken.Type)) {
      return precedenceMap.get(this.currToken.Type)!;
    }

    return PRECEDENCE.LOWEST;
  }

  parseExpressionStatement() {
    const token = this.currToken;

    const stmt = this.parseExpression(PRECEDENCE.LOWEST);

    if (!stmt) {
      this.unexpectedTokenError(this.currToken, "expression");
      return null;
    }

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new ExpressionStatement(token, stmt);
  }

  parseReturn() {
    const returnToken = this.currToken;

    this.nextToken();

    const value = this.parseExpression(PRECEDENCE.LOWEST);
    if (!value) {
      this.unexpectedTokenError(this.currToken, "expression");
      return null;
    }

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new ReturnStatement(returnToken, value);
  }

  parseDeclaration() {
    const declarationToken = this.currToken;

    if (!this.expectPeekAndAdvance(TOKENS.IDENT)) {
      return null;
    }

    const ident = new Identifier(this.currToken, this.currToken.Literal);

    if (!this.expectPeekAndAdvance(TOKENS.ASSIGN)) {
      return null;
    }

    this.nextToken();

    const value = this.parseExpression(PRECEDENCE.LOWEST);
    if (!value) {
      this.unexpectedTokenError(this.currToken, "expression");
      return null;
    }

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new LetStatement(declarationToken, ident, value);
  }

  currTokenIs(tokenType: string) {
    return this.currToken.Type === tokenType;
  }

  peekTokenIs(tokenType: string) {
    return this.peekToken.Type === tokenType;
  }

  nextToken() {
    this.currToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram() {
    const program = new Program();

    while (this.currToken.Type !== TOKENS.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        program.statements.push(stmt);
      }
      this.nextToken();
    }

    return program;
  }
}
