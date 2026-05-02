import { OBJECTS, type Object } from "./object";

export class Boolean implements Object {
  constructor(public Value: boolean) {}

  Type() {
    return OBJECTS.BOOLEAN_OBJ;
  }

  Inspect() {
    return this.Value.toString();
  }
}
