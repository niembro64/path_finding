import { bfs } from './bfs';
import { dfs } from './dfs';
import { dijkstra } from './dijkstra';
import { astar } from './astar';
import { greedy } from './greedy';
import type { Graph, AlgorithmResult, AlgorithmType } from '@/types/graph';

export const algorithms = {
  bfs,
  dfs,
  dijkstra,
  astar,
  greedy
};

export function runAlgorithm(
  type: AlgorithmType,
  graph: Graph,
  start: string,
  goal: string
): AlgorithmResult {
  return algorithms[type](graph, start, goal);
}

export { bfs, dfs, dijkstra, astar, greedy };