import * as readline from "node:readline";
import { Eval } from "@/evaluator/evaluator";
import { Environment } from "@/evaluator/objects/environment";
import { OBJECTS } from "@/evaluator/objects/object";
import { Lexer } from "@/lexer/lexer";
import { Parser } from "@/parser/parser";

const PROMPT = ">> ";

export function start(
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
) {
  const rl = readline.createInterface({ input, output });
  const env = new Environment();

  const askQuestion = () => {
    rl.question(PROMPT, (line) => {
      if (!line) {
        rl.close();
        return;
      }

      const l = new Lexer(line);
      const parser = new Parser(l);
      const program = parser.parseProgram();

      if (parser.errors.length !== 0) {
        for (const err of parser.errors) {
          console.error(`\t${err.message}`);
        }
        return askQuestion();
      }

      for (const stmt of program.statements) {
        const result = Eval(stmt, env);
        if (result) {
          if (result.Type() === OBJECTS.ERROR_OBJ) {
            console.log(result.Inspect());
            return askQuestion();
          }
          if (result.Type() !== OBJECTS.NULL_OBJ) {
            console.log(result.Inspect());
          }
        }
      }

      askQuestion();
    });
  };

  askQuestion();
}
