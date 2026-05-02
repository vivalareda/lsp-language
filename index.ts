import { Eval } from "@/evaluator/evaluator";
import { Environment } from "@/evaluator/objects/environment";
import { OBJECTS } from "@/evaluator/objects/object";
import { Lexer } from "@/lexer/lexer";
import { type ParseError, Parser } from "@/parser/parser";
import { start } from "@/repl/repl";

async function evaluateFile(filePath: string) {
  try {
    const file = Bun.file(filePath);
    const text = await file.text();

    const l = new Lexer(text);
    const p = new Parser(l);
    const program = p.parseProgram();

    if (p.errors.length !== 0) {
      printParserErrors(p.errors);
      process.exit(1);
    }

    const env = new Environment();
    for (const stmt of program.statements) {
      const result = Eval(stmt, env);
      if (result) {
        if (result.Type() === OBJECTS.ERROR_OBJ) {
          console.log(result.Inspect());
          process.exit(1);
        }
        if (result.Type() !== OBJECTS.NULL_OBJ) {
          console.log(result.Inspect());
        }
      }
    }
    process.exit(0);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`);
    console.error(error);
    process.exit(1);
  }
}

function printParserErrors(errors: ParseError[]) {
  console.log("Parser errors:\n");
  for (const err of errors) {
    console.log(`\t${err.message}\n`);
  }
}

const args = Bun.argv.slice(2);
const isRepl = args.length === 0 || args[0] === "repl";

if (isRepl) {
  start(process.stdin, process.stdout);
} else {
  await evaluateFile(args[0]);
}
