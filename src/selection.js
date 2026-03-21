export function isAdjacent(first, second) {
  const rowDistance = Math.abs(first.row - second.row);
  const colDistance = Math.abs(first.col - second.col);
  return rowDistance <= 1 && colDistance <= 1 && !(rowDistance === 0 && colDistance === 0);
}

export function directionBetween(first, second) {
  return {
    row: Math.sign(second.row - first.row),
    col: Math.sign(second.col - first.col),
  };
}

export class SelectionTracker {
  constructor() {
    this.path = [];
    this.direction = null;
  }

  reset() {
    this.path = [];
    this.direction = null;
  }

  start(cell) {
    this.path = [cell];
    this.direction = null;
  }

  canExtend(cell) {
    if (this.path.length === 0) {
      return true;
    }
    const previous = this.path[this.path.length - 1];
    if (!isAdjacent(previous, cell)) {
      return false;
    }
    if (this.path.length === 1) {
      return true;
    }
    const nextDirection = directionBetween(previous, cell);
    return nextDirection.row === this.direction.row && nextDirection.col === this.direction.col;
  }

  extend(cell) {
    if (this.path.length === 0) {
      this.start(cell);
      return true;
    }
    if (!this.canExtend(cell)) {
      return false;
    }
    const previous = this.path[this.path.length - 1];
    this.path.push(cell);
    if (this.path.length === 2) {
      this.direction = directionBetween(previous, cell);
    }
    return true;
  }

  dragTo(cell) {
    if (this.path.length === 0) {
      this.start(cell);
      return true;
    }

    const start = this.path[0];
    const rowDelta = cell.row - start.row;
    const colDelta = cell.col - start.col;

    if (rowDelta === 0 && colDelta === 0) {
      this.path = [start];
      this.direction = null;
      return true;
    }

    let stepRow = 0;
    let stepCol = 0;
    let steps = 0;

    if (rowDelta === 0) {
      stepCol = Math.sign(colDelta);
      steps = Math.abs(colDelta);
    } else if (colDelta === 0) {
      stepRow = Math.sign(rowDelta);
      steps = Math.abs(rowDelta);
    } else {
      // Favor diagonal intent when both axes are moving.
      stepRow = Math.sign(rowDelta);
      stepCol = Math.sign(colDelta);
      steps = Math.min(Math.abs(rowDelta), Math.abs(colDelta));
    }

    const nextPath = [];
    for (let i = 0; i <= steps; i += 1) {
      nextPath.push({
        row: start.row + stepRow * i,
        col: start.col + stepCol * i,
      });
    }

    this.path = nextPath;
    this.direction = nextPath.length > 1 ? { row: stepRow, col: stepCol } : null;
    return true;
  }
}
