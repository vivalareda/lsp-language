import { OBJECTS, type Object } from "./object";

export class Integer implements Object {
  constructor(public Value: number) {}

  Type() {
    return OBJECTS.INTEGER_OBJ;
  }

  Inspect() {
    return this.Value.toString();
  }
}
