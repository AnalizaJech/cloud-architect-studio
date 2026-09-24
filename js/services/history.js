/** Bounded snapshot history. Changes are committed only at interaction boundaries. */
export class History {
  constructor(initial, limit = 60) {
    this.states = [structuredClone(initial)];
    this.index = 0;
    this.limit = limit;
  }
  get current() {
    return structuredClone(this.states[this.index]);
  }
  get canUndo() {
    return this.index > 0;
  }
  get canRedo() {
    return this.index < this.states.length - 1;
  }
  push(value) {
    const next = JSON.stringify(value);
    if (next === JSON.stringify(this.states[this.index])) return false;
    this.states = this.states.slice(0, this.index + 1);
    this.states.push(JSON.parse(next));
    if (this.states.length > this.limit) this.states.shift();
    this.index = this.states.length - 1;
    return true;
  }
  undo() {
    if (this.canUndo) this.index--;
    return this.current;
  }
  redo() {
    if (this.canRedo) this.index++;
    return this.current;
  }
}
