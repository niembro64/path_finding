import type { Graph, AlgorithmResult, AlgorithmStep } from '@/types/graph';

interface PriorityQueueItem {
  nodeId: string;
  priority: number;
}

class PriorityQueue {
  private items: PriorityQueueItem[] = [];

  enqueue(nodeId: string, priority: number): void {
    this.items.push({ nodeId, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): string | undefined {
    return this.items.shift()?.nodeId;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  has(nodeId: string): boolean {
    return this.items.some(item => item.nodeId === nodeId);
  }

  updatePriority(nodeId: string, newPriority: number): void {
    const index = this.items.findIndex(item => item.nodeId === nodeId);
    if (index !== -1) {
      this.items[index]!.priority = newPriority;
      this.items.sort((a, b) => a.priority - b.priority);
    }
  }

  toSet(): Set<string> {
    return new Set(this.items.map(item => item.nodeId));
  }
}

export function dijkstra(graph: Graph, start: string, goal: string): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const distances = new Map<string, number>();
  const parents = new Map<string, string | null>();
  const visited = new Set<string>();
  const pq = new PriorityQueue();

  graph.nodes.forEach((_, nodeId) => {
    distances.set(nodeId, Infinity);
  });
  distances.set(start, 0);
  parents.set(start, null);
  pq.enqueue(start, 0);

  let nodesExpanded = 0;
  let found = false;

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;

    if (visited.has(current)) continue;

    visited.add(current);
    nodesExpanded++;

    // Build current best path to goal if reachable
    let bestPath: string[] = [];
    let bestCost: number | undefined;
    if (distances.get(goal) !== Infinity && parents.get(goal) !== undefined) {
      let pathNode: string | null = goal;
      const tempPath: string[] = [];

      // Reconstruct path from goal back to start
      while (pathNode !== null) {
        tempPath.unshift(pathNode);
        pathNode = parents.get(pathNode) || null;
      }

      // Only use if we have a complete path from start to goal
      if (tempPath.length > 1 && tempPath[0] === start && tempPath[tempPath.length - 1] === goal) {
        bestPath = tempPath;
        bestCost = distances.get(goal);
      }
    }

    steps.push({
      currentNode: current,
      frontier: pq.toSet(),
      visited: new Set(visited),
      path: [],
      bestPath: bestPath.length > 0 ? bestPath : undefined,
      bestCost,
      distances: new Map(distances),
      parents: new Map(parents),
      message: `Exploring node ${current} with distance ${distances.get(current)}`
    });

    if (current === goal) {
      found = true;
      break;
    }

    const currentDistance = distances.get(current)!;
    const neighbors = graph.adjacencyList.get(current) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.nodeId)) {
        const newDistance = currentDistance + neighbor.weight;
        const oldDistance = distances.get(neighbor.nodeId)!;

        if (newDistance < oldDistance) {
          distances.set(neighbor.nodeId, newDistance);
          parents.set(neighbor.nodeId, current);
          
          if (pq.has(neighbor.nodeId)) {
            pq.updatePriority(neighbor.nodeId, newDistance);
          } else {
            pq.enqueue(neighbor.nodeId, newDistance);
          }
        }
      }
    }
  }

  const finalPath: string[] = [];
  let totalCost = 0;
  
  if (found) {
    let current: string | null = goal;
    while (current !== null) {
      finalPath.unshift(current);
      current = parents.get(current) || null;
    }
    totalCost = distances.get(goal) || 0;
  }

  steps.push({
    currentNode: null,
    frontier: new Set(),
    visited: new Set(visited),
    path: finalPath,
    distances: new Map(distances),
    parents: new Map(parents),
    message: found ? `Path found from ${start} to ${goal} with cost ${totalCost}` : `No path exists from ${start} to ${goal}`
  });

  return {
    steps,
    finalPath,
    totalCost,
    nodesExpanded
  };
}