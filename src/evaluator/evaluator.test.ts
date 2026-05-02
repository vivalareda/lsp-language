import { describe, expect, test } from "bun:test";
import { Eval } from "@/evaluator/evaluator";
import { Boolean } from "@/evaluator/objects/boolean";
import { Environment } from "@/evaluator/objects/environment";
import { Error as EvalError } from "@/evaluator/objects/error";
import { Integer } from "@/evaluator/objects/integer";
import { type Object } from "@/evaluator/objects/object";
import { Lexer } from "@/lexer/lexer";
import { Parser } from "@/parser/parser";

describe("evaluator tests", () => {
  describe("eval integer literal", () => {
    const tests = [
      { input: "5", expected: 5 },
      { input: "10", expected: 10 },
      { input: "-5", expected: -5 },
      { input: "-10", expected: -10 },
      { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
      { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
      { input: "-50 + 100 + -50", expected: 0 },
      { input: "5 * 2 + 10", expected: 20 },
      { input: "5 + 2 * 10", expected: 25 },
      { input: "20 + 2 * -10", expected: 0 },
      { input: "50 / 2 * 2 + 10", expected: 60 },
      { input: "2 * (5 + 10)", expected: 30 },
      { input: "3 * 3 * 3 + 10", expected: 37 },
      { input: "3 * (3 * 3) + 10", expected: 37 },
      { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
    ];

    for (const testCase of tests) {
      test(`eval integer: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("eval boolean literal", () => {
    const tests = [
      { input: "true", expected: true },
      { input: "false", expected: false },
      { input: "!true", expected: false },
      { input: "!false", expected: true },
      { input: "!5", expected: false },
      { input: "!!true", expected: true },
      { input: "!!false", expected: false },
      { input: "!!5", expected: true },
      { input: "1 < 2", expected: true },
      { input: "1 > 2", expected: false },
      { input: "1 < 1", expected: false },
      { input: "1 > 1", expected: false },
      { input: "1 == 1", expected: true },
      { input: "1 != 2", expected: true },
      { input: "1 == 2", expected: false },
      { input: "true == true", expected: true },
      { input: "false == false", expected: true },
      { input: "true == false", expected: false },
      { input: "true != false", expected: true },
      { input: "false != true", expected: true },
      { input: "(1 < 2) == true", expected: true },
      { input: "(1 < 2) == false", expected: false },
      { input: "(1 > 2) == true", expected: false },
      { input: "(1 > 2) == false", expected: true },
    ];

    for (const testCase of tests) {
      test(`eval boolean: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testBooleanObject(evaluated, testCase.expected);
      });
    }
  });

  describe("return statements", () => {
    const tests = [
      { input: "return 10;", expected: 10 },
      { input: "return 10; 9;", expected: 10 },
      { input: "return 2 * 5; 9;", expected: 10 },
      { input: "9; return 2 * 5; 9;", expected: 10 },
    ];

    for (const testCase of tests) {
      test(`return: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("error handling", () => {
    const tests = [
      {
        input: "5 + true;",
        expected:
          "type mismatch: INTEGER + BOOLEAN",
      },
      {
        input: "5 + true; 5;",
        expected:
          "type mismatch: INTEGER + BOOLEAN",
      },
      {
        input: "-true",
        expected: "unsupported operand type for -: BOOLEAN",
      },
      {
        input: "true + false;",
        expected: "unsupported operator for booleans: +",
      },
      {
        input: "5; true + false; 5",
        expected: "unsupported operator for booleans: +",
      },
      {
        input: "foobar",
        expected: "unknown identifier \"foobar\"",
      },
      {
        input: "10 / 0",
        expected: "division by zero",
      },
    ];

    for (const testCase of tests) {
      test(`error: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        expect(evaluated.Type()).toBe("ERROR");
        expect((evaluated as any).Message).toContain(testCase.expected);
      });
    }
  });

  describe("let statements", () => {
    const tests: { input: string; expected: number }[] = [
      { input: "let x = 5; x;", expected: 5 },
      { input: "let x = 5 * 5; x;", expected: 25 },
      {
        input: "let x = 5; let y = x; y;",
        expected: 5,
      },
      {
        input:
          "let x = 5; let y = x; let z = x + y + 5; z;",
        expected: 15,
      },
    ];

    for (const testCase of tests) {
      test(`let: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("function object", () => {
    test("function literal", () => {
      const input = "func(x) { x + 2; }";
      const evaluated = testEval(input);
      expect(evaluated.Type()).toBe("FUNCTION");
    });
  });

  describe("function application", () => {
    const tests: { input: string; expected: number }[] = [
      {
        input:
          "let identity = func(x) { return x; }; identity(5);",
        expected: 5,
      },
      {
        input:
          "let identity = func(x) { return x; }; identity(5);",
        expected: 5,
      },
      {
        input:
          "let double = func(x) { return x * 2; }; double(5);",
        expected: 10,
      },
      {
        input:
          "let add = func(x, y) { return x + y; }; add(5, 5);",
        expected: 10,
      },
      {
        input: "func(x) { return x; }(5)",
        expected: 5,
      },
    ];

    for (const testCase of tests) {
      test(`call: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("closures", () => {
    test("closure", () => {
      const input = `
        let newAdder = func(x) {
          return func(y) {
            return x + y;
          };
        };
        let addTwo = newAdder(2);
        addTwo(2);
      `;
      const evaluated = testEval(input);
      testIntegerObject(evaluated, 4);
    });
  });
});

function testEval(input: string) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  const env = new Environment();

  return Eval(program, env);
}

function testIntegerObject(obj: Object, expected: number) {
  expect(obj).toBeInstanceOf(Integer);
  expect((obj as Integer).Value).toBe(expected);
}

function testBooleanObject(obj: Object, expected: boolean) {
  expect(obj).toBeInstanceOf(Boolean);
  expect((obj as Boolean).Value).toBe(expected);
}

function testNullObject(obj: Object) {
  expect(obj.Type()).toBe("NULL");
}
