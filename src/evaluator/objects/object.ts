import { Boolean } from "./boolean";
import { Null } from "./null";

export const OBJECTS = {
  INTEGER_OBJ: "INTEGER",
  BOOLEAN_OBJ: "BOOLEAN",
  NULL_OBJ: "NULL",
  RETURN_VALUE_OBJ: "RETURN_VALUE",
  ERROR_OBJ: "ERROR",
  FUNCTION_OBJ: "FUNCTION",
  BUILTIN_OBJ: "BUILTIN",
} as const;

export interface Object {
  Type(): (typeof OBJECTS)[keyof typeof OBJECTS];
  Inspect(): string;
}

export const CONSTANT_OBJECTS = {
  true: new Boolean(true),
  false: new Boolean(false),
  null: new Null(),
};
