import { OBJECTS, type Object } from "./object";

export class Null implements Object {
  Inspect() {
    return "null";
  }

  Type() {
    return OBJECTS.NULL_OBJ;
  }
}
