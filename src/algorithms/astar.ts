import type { Graph, AlgorithmResult, AlgorithmStep } from '@/types/graph';

interface PriorityQueueItem {
  nodeId: string;
  fScore: number;
  gScore: number;
}

class PriorityQueue {
  private items: PriorityQueueItem[] = [];

  enqueue(nodeId: string, fScore: number, gScore: number): void {
    this.items.push({ nodeId, fScore, gScore });
    this.items.sort((a, b) => a.fScore - b.fScore);
  }

  dequeue(): PriorityQueueItem | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  has(nodeId: string): boolean {
    return this.items.some(item => item.nodeId === nodeId);
  }

  updatePriority(nodeId: string, fScore: number, gScore: number): void {
    const index = this.items.findIndex(item => item.nodeId === nodeId);
    if (index !== -1) {
      this.items[index]!.fScore = fScore;
      this.items[index]!.gScore = gScore;
      this.items.sort((a, b) => a.fScore - b.fScore);
    }
  }

  toSet(): Set<string> {
    return new Set(this.items.map(item => item.nodeId));
  }
}

export function astar(graph: Graph, start: string, goal: string): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const gScores = new Map<string, number>();
  const fScores = new Map<string, number>();
  const parents = new Map<string, string | null>();
  const visited = new Set<string>();
  const pq = new PriorityQueue();

  const goalNode = graph.nodes.get(goal);
  if (!goalNode) {
    return {
      steps: [],
      finalPath: [],
      totalCost: 0,
      nodesExpanded: 0
    };
  }

  graph.nodes.forEach((_, nodeId) => {
    gScores.set(nodeId, Infinity);
    fScores.set(nodeId, Infinity);
  });

  const startNode = graph.nodes.get(start);
  const startHeuristic = startNode?.heuristic || 0;
  
  gScores.set(start, 0);
  fScores.set(start, startHeuristic);
  parents.set(start, null);
  pq.enqueue(start, startHeuristic, 0);

  let nodesExpanded = 0;
  let found = false;

  while (!pq.isEmpty()) {
    const currentItem = pq.dequeue()!;
    const current = currentItem.nodeId;
    
    if (visited.has(current)) continue;
    
    visited.add(current);
    nodesExpanded++;

    const currentGScore = gScores.get(current)!;
    const currentFScore = fScores.get(current)!;

    steps.push({
      currentNode: current,
      frontier: pq.toSet(),
      visited: new Set(visited),
      path: [],
      distances: new Map(gScores),
      parents: new Map(parents),
      message: `Exploring node ${current} with g=${currentGScore.toFixed(2)}, f=${currentFScore.toFixed(2)}`
    });

    if (current === goal) {
      found = true;
      break;
    }

    const neighbors = graph.adjacencyList.get(current) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.nodeId)) {
        const tentativeGScore = currentGScore + neighbor.weight;
        const oldGScore = gScores.get(neighbor.nodeId)!;

        if (tentativeGScore < oldGScore) {
          const neighborNode = graph.nodes.get(neighbor.nodeId);
          const heuristic = neighborNode?.heuristic || 0;
          const fScore = tentativeGScore + heuristic;

          gScores.set(neighbor.nodeId, tentativeGScore);
          fScores.set(neighbor.nodeId, fScore);
          parents.set(neighbor.nodeId, current);
          
          if (pq.has(neighbor.nodeId)) {
            pq.updatePriority(neighbor.nodeId, fScore, tentativeGScore);
          } else {
            pq.enqueue(neighbor.nodeId, fScore, tentativeGScore);
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
    totalCost = gScores.get(goal) || 0;
  }

  steps.push({
    currentNode: null,
    frontier: new Set(),
    visited: new Set(visited),
    path: finalPath,
    distances: new Map(gScores),
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