import { describe, expect, test } from "bun:test";
import { Lexer } from "@/lexer/lexer";
import {
  type Expression,
  ExpressionStatement,
  Identifier,
  LetStatement,
  PrefixExpression,
  ReturnStatement,
} from "@/parser/ast";
import { Parser } from "@/parser/parser";
import { BooleanLiteral } from "./nodes/BooleanLiteral";
import { FunctionCallExpression } from "./nodes/CallExpression";
import { FunctionLiteral } from "./nodes/FunctionLiteral";
import { BlockStatement } from "./nodes/BlockStatement";
import { InfixExpression } from "./nodes/InfixExpression";
import { IntegerLiteral } from "./nodes/IntegerLiteral";

describe("parser", () => {
  test("let statements", () => {
    const input = `
let x = 5;
let y = 10;
let foobar = 838383;
`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    expect(program.statements.length).toBe(3);

    const tests = [
      { expectedIdentifier: "x", expectedValue: 5 },
      { expectedIdentifier: "y", expectedValue: 10 },
      { expectedIdentifier: "foobar", expectedValue: 838383 },
    ];

    for (let i = 0; i < tests.length; i++) {
      const stmt = program.statements[i];
      testLetStatement(stmt, tests[i].expectedIdentifier, tests[i].expectedValue);
    }
  });

  test("return statements", () => {
    const input = `
return 5;
return 10;
return 993322;
`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    expect(program.statements.length).toBe(3);
    checkParserErrors(parser);
    for (const stmt of program.statements) {
      expect(stmt).toBeInstanceOf(ReturnStatement);
      expect(stmt.tokenLiteral()).toBe("return");
    }
  });

  test("expression statements", () => {
    const input = "foobar;";

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    expect(program.statements.length).toBe(1);

    const stmt = program.statements[0];
    expect(stmt).toBeInstanceOf(ExpressionStatement);

    const expr = (stmt as ExpressionStatement).Expression;
    expect(expr).toBeInstanceOf(Identifier);

    expect((expr as Identifier).Name).toBe("foobar");
    expect(expr.tokenLiteral()).toBe("foobar");
  });

  test("integer expression", () => {
    const input = "5;";

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0]).toBeInstanceOf(ExpressionStatement);

    const stmt = program.statements[0] as ExpressionStatement;
    const literal = stmt.Expression as IntegerLiteral;
    expect(literal).toBeInstanceOf(IntegerLiteral);
    expect(literal.Value).toBe(5);
    expect(literal.tokenLiteral()).toBe("5");
  });

  describe("prefix expressions", () => {
    const prefixTests = [
      { input: "!5;", operator: "!", value: 5 },
      { input: "-15;", operator: "-", value: 15 },
    ];

    for (const tt of prefixTests) {
      test(`prefix expression: ${tt.operator}${tt.value}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        expect(program.statements).toHaveLength(1);
        const stmt = program.statements[0] as ExpressionStatement;
        const exp = stmt.Expression as PrefixExpression;

        expect(exp).toBeInstanceOf(PrefixExpression);
        expect(exp.Operator).toBe(tt.operator);
        testLiteralExpression(exp.Right, tt.value);
      });
    }
  });

  describe("infix expressions", () => {
    const infixTests = [
      { input: "5 + 5;", left: 5, operator: "+", right: 5 },
      { input: "5 - 5;", left: 5, operator: "-", right: 5 },
      { input: "5 * 5;", left: 5, operator: "*", right: 5 },
      { input: "5 / 5;", left: 5, operator: "/", right: 5 },
      { input: "5 > 5;", left: 5, operator: ">", right: 5 },
      { input: "5 < 5;", left: 5, operator: "<", right: 5 },
      { input: "5 == 5;", left: 5, operator: "==", right: 5 },
      { input: "5 != 5;", left: 5, operator: "!=", right: 5 },
      { input: "true == true", left: true, operator: "==", right: true },
      { input: "true != false", left: true, operator: "!=", right: false },
      { input: "false == false", left: false, operator: "==", right: false },
    ];

    for (const testCase of infixTests) {
      test(`infix expression: ${testCase.input}`, () => {
        const lexer = new Lexer(testCase.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        expect(program.statements).toHaveLength(1);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.Expression).toBeInstanceOf(InfixExpression);

        const exp = stmt.Expression as InfixExpression;
        testInfixExpression(
          exp,
          testCase.left,
          testCase.operator,
          testCase.right,
        );
      });
    }
  });

  describe("operator precedence parsing", () => {
    const tests = [
      { input: "-a * b", expected: "((-a) * b)" },
      { input: "!-a", expected: "(!(-a))" },
      { input: "a + b + c", expected: "((a + b) + c)" },
      { input: "a + b - c", expected: "((a + b) - c)" },
      { input: "a * b + c", expected: "((a * b) + c)" },
      { input: "a + b * c", expected: "(a + (b * c))" },
      { input: "a * b * c", expected: "((a * b) * c)" },
      { input: "a * b / c", expected: "((a * b) / c)" },
      { input: "a + b / c", expected: "(a + (b / c))" },
      { input: "a / b * c", expected: "((a / b) * c)" },
      {
        input: "a + b * c + d / e - f",
        expected: "(((a + (b * c)) + (d / e)) - f)",
      },
      { input: "5 > 4 == 3 < 4", expected: "((5 > 4) == (3 < 4))" },
      { input: "5 < 4 != 3 > 4", expected: "((5 < 4) != (3 > 4))" },
      {
        input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
        expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
      },
    ];

    for (const tt of tests) {
      test(`precedence: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  });

  describe("boolean expressions", () => {
    const tests = [
      { input: "true", expected: "true" },
      { input: "false", expected: "false" },
      { input: "3 > 5 == false", expected: "((3 > 5) == false)" },
    ];

    for (const tt of tests) {
      test(`boolean: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  });

  describe("grouped operator", () => {
    const tests = [
      { input: "1 + (2 + 3) + 4", expected: "((1 + (2 + 3)) + 4)" },
      { input: "(5 + 5) * 2", expected: "((5 + 5) * 2)" },
      { input: "2 / (5 + 5)", expected: "(2 / (5 + 5))" },
      { input: "-(5 + 5)", expected: "(-(5 + 5))" },
      { input: "!(true == true)", expected: "(!(true == true))" },
    ];

    for (const tt of tests) {
      test(`grouped: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  });

  test("function literal", () => {
    const input = `
func(a, b) {
  x + y;
}
func() {}
`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    const expr = (program.statements[0] as ExpressionStatement).Expression;
    const blockBody = (expr as FunctionLiteral).Body as BlockStatement;

    expect(program.statements.length).toBe(2);

    expect(expr).toBeInstanceOf(FunctionLiteral);
    expect(blockBody.statements.length).toBe(1);
    expect(
      (blockBody.statements[0] as ExpressionStatement).Expression,
    ).toBeInstanceOf(InfixExpression);
  });

  describe("function parameter parsing", () => {
    const tests = [
      {
        input: "func() {};",
        expectedParams: [],
      },
      {
        input: "func(x) {};",
        expectedParams: ["x"],
      },
      {
        input: "func(x, y, z) {};",
        expectedParams: ["x", "y", "z"],
      },
    ];

    for (const tt of tests) {
      test(`function parameters: ${tt.expectedParams.length} params`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const stmt = program.statements[0] as ExpressionStatement;
        const fn = stmt.Expression as FunctionLiteral;

        expect(fn.Params.length).toBe(tt.expectedParams.length);

        for (let i = 0; i < tt.expectedParams.length; i++) {
          expect(fn.Params[i]).toBeInstanceOf(Identifier);
          expect((fn.Params[i] as Identifier).Name).toBe(tt.expectedParams[i]);
        }
      });
    }
  });

  describe("call expression operator precedence parsing", () => {
    const tests = [
      {
        input: "add(b * c)",
        expected: "add((b * c))",
      },
      {
        input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
        expected: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
      },
      {
        input: "add(a + b + c * d / f + g)",
        expected: "add((((a + b) + ((c * d) / f)) + g))",
      },
    ];

    for (const tt of tests) {
      test(`call precedence: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  });

  test("parser errors are descriptive", () => {
    const input = "let x = ;";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    parser.parseProgram();

    expect(parser.errors.length).toBeGreaterThan(0);
    expect(parser.errors[0].message).toContain("expected expression but got \";\"");
    expect(parser.errors[0].message).toContain("line");
    expect(parser.errors[0].message).toContain("column");
  });
});

function testLetStatement(stmt: any, name: string, value: any) {
  expect(stmt.tokenLiteral()).toBe("let");
  expect(stmt).toBeInstanceOf(LetStatement);
  expect(stmt.Identifier.Name).toBe(name);
  expect(stmt.Identifier.tokenLiteral()).toBe(name);

  testLiteralExpression(stmt.Value, value);
}

function checkParserErrors(parser: Parser) {
  const errors = parser.errors;

  if (errors.length === 0) {
    return;
  }

  console.error(`parser has ${parser.errors.length} errors`);
  for (const error of parser.errors) {
    console.error(`parser error: ${error.message}`);
  }

  throw new Error(`parser had ${parser.errors.length} errors`);
}

function testLiteralExpression(
  expr: Expression,
  expected: number | boolean | string,
): void {
  if (typeof expected === "number") {
    expect(expr).toBeInstanceOf(IntegerLiteral);
    const intLit = expr as IntegerLiteral;
    expect(intLit.Value).toBe(expected);
  } else if (typeof expected === "boolean") {
    expect(expr).toBeInstanceOf(BooleanLiteral);
    const boolLit = expr as BooleanLiteral;
    expect(boolLit.Value).toBe(expected);
  } else if (typeof expected === "string") {
    expect(expr).toBeInstanceOf(Identifier);
    const ident = expr as Identifier;
    expect(ident.Name).toBe(expected);
  }
}

function testInfixExpression(
  expr: InfixExpression,
  leftValue: number | boolean | string,
  operator: string,
  rightValue: number | boolean | string,
): void {
  expect(expr.Operator).toBe(operator);
  testLiteralExpression(expr.Left, leftValue);
  testLiteralExpression(expr.Right, rightValue);
}

function astToString(stmt: ExpressionStatement): string {
  return expressionToString(stmt.Expression);
}

function expressionToString(expr: Expression): string {
  if (expr instanceof IntegerLiteral) {
    return expr.Value.toString();
  }
  if (expr instanceof BooleanLiteral) {
    return expr.Value.toString();
  }
  if (expr instanceof Identifier) {
    return expr.Name;
  }
  if (expr instanceof PrefixExpression) {
    return `(${expr.Operator}${expressionToString(expr.Right)})`;
  }
  if (expr instanceof InfixExpression) {
    return `(${expressionToString(expr.Left)} ${expr.Operator} ${expressionToString(expr.Right)})`;
  }
  if (expr instanceof FunctionCallExpression) {
    const args = expr.Arguments.map((arg) => expressionToString(arg)).join(", ");
    return `${expressionToString(expr.Function)}(${args})`;
  }
  return "";
}
