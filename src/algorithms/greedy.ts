import type { Graph, AlgorithmResult, AlgorithmStep } from '@/types/graph';

interface PriorityQueueItem {
  nodeId: string;
  heuristic: number;
}

class PriorityQueue {
  private items: PriorityQueueItem[] = [];

  enqueue(nodeId: string, heuristic: number): void {
    this.items.push({ nodeId, heuristic });
    this.items.sort((a, b) => a.heuristic - b.heuristic);
  }

  dequeue(): string | undefined {
    return this.items.shift()?.nodeId;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  toSet(): Set<string> {
    return new Set(this.items.map(item => item.nodeId));
  }
}

export function greedy(graph: Graph, start: string, goal: string): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const visited = new Set<string>();
  const parents = new Map<string, string | null>();
  const pq = new PriorityQueue();
  
  const startNode = graph.nodes.get(start);
  const startHeuristic = startNode?.heuristic || 0;
  
  parents.set(start, null);
  pq.enqueue(start, startHeuristic);

  let nodesExpanded = 0;
  let found = false;
  let pathCost = 0;

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    
    if (visited.has(current)) continue;
    
    visited.add(current);
    nodesExpanded++;

    const currentNode = graph.nodes.get(current);
    const currentHeuristic = currentNode?.heuristic || 0;

    steps.push({
      currentNode: current,
      frontier: pq.toSet(),
      visited: new Set(visited),
      path: [],
      parents: new Map(parents),
      message: `Exploring node ${current} with heuristic ${currentHeuristic.toFixed(2)}`
    });

    if (current === goal) {
      found = true;
      break;
    }

    const neighbors = graph.adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.nodeId)) {
        if (!parents.has(neighbor.nodeId) || parents.get(neighbor.nodeId) === null) {
          parents.set(neighbor.nodeId, current);
        }
        const neighborNode = graph.nodes.get(neighbor.nodeId);
        const heuristic = neighborNode?.heuristic || 0;
        pq.enqueue(neighbor.nodeId, heuristic);
      }
    }
  }

  const finalPath: string[] = [];
  
  if (found) {
    let current: string | null = goal;
    while (current !== null) {
      finalPath.unshift(current);
      current = parents.get(current) || null;
    }
    
    for (let i = 0; i < finalPath.length - 1; i++) {
      const from = finalPath[i]!;
      const to = finalPath[i + 1]!;
      const neighbors = graph.adjacencyList.get(from) || [];
      const edge = neighbors.find(n => n.nodeId === to);
      if (edge) {
        pathCost += edge.weight;
      }
    }
  }

  steps.push({
    currentNode: null,
    frontier: new Set(),
    visited: new Set(visited),
    path: finalPath,
    parents: new Map(parents),
    message: found ? `Path found from ${start} to ${goal} with cost ${pathCost}` : `No path exists from ${start} to ${goal}`
  });

  return {
    steps,
    finalPath,
    totalCost: pathCost,
    nodesExpanded
  };
}