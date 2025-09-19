import type { Graph, AlgorithmResult, AlgorithmStep } from '@/types/graph';

export function dfs(graph: Graph, start: string, goal: string): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const visited = new Set<string>();
  const frontier: string[] = [start];
  const parents = new Map<string, string | null>();
  parents.set(start, null);

  let nodesExpanded = 0;
  let found = false;

  while (frontier.length > 0 && !found) {
    const current = frontier.pop()!;
    
    if (visited.has(current)) continue;
    
    visited.add(current);
    nodesExpanded++;

    steps.push({
      currentNode: current,
      frontier: new Set(frontier),
      visited: new Set(visited),
      path: [],
      parents: new Map(parents),
      message: `Exploring node ${current}`
    });

    if (current === goal) {
      found = true;
      break;
    }

    const neighbors = graph.adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.nodeId)) {
        frontier.push(neighbor.nodeId);
        if (!parents.has(neighbor.nodeId)) {
          parents.set(neighbor.nodeId, current);
        }
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
  }

  steps.push({
    currentNode: null,
    frontier: new Set(),
    visited: new Set(visited),
    path: finalPath,
    parents: new Map(parents),
    message: found ? `Path found from ${start} to ${goal}` : `No path exists from ${start} to ${goal}`
  });

  return {
    steps,
    finalPath,
    totalCost: finalPath.length - 1,
    nodesExpanded
  };
}