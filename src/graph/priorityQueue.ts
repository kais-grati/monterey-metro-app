/**
 * Binary min-heap keyed on `priority`.
 *
 * A* pops the open node with the lowest f = g + h, so the open set needs to
 * hand back its minimum quickly. The network here is tiny enough that a linear
 * scan would do, but the heap keeps the search honest about what it is doing
 * and stays correct if the graph ever grows.
 */
export class PriorityQueue<T> {
  private heap: { item: T; priority: number }[] = [];

  get size(): number {
    return this.heap.length;
  }

  push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    const { heap } = this;
    if (heap.length === 0) return undefined;

    const top = heap[0];
    const last = heap.pop()!;

    if (heap.length > 0) {
      heap[0] = last;
      this.sinkDown(0);
    }

    return top.item;
  }

  private bubbleUp(index: number): void {
    const { heap } = this;
    const entry = heap[index];

    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (heap[parentIndex].priority <= entry.priority) break;
      heap[index] = heap[parentIndex];
      index = parentIndex;
    }

    heap[index] = entry;
  }

  private sinkDown(index: number): void {
    const { heap } = this;
    const length = heap.length;
    const entry = heap[index];

    for (;;) {
      const left = 2 * index + 1;
      if (left >= length) break;

      const right = left + 1;
      // Pick the smaller of the two children by comparing them to each other.
      // Comparing them against `heap[index]` instead would be wrong: this loop
      // moves children up into the hole as it descends, so from the second
      // iteration on `heap[index]` holds a value that has already been copied
      // to the parent — not `entry` — and the descent can stop a level early,
      // leaving a smaller child underneath a larger parent.
      const child = right < length && heap[right].priority < heap[left].priority ? right : left;

      if (entry.priority <= heap[child].priority) break;

      heap[index] = heap[child];
      index = child;
    }

    heap[index] = entry;
  }
}
