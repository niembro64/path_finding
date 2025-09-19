export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  position: Position;
  label: string;
  heuristic?: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface Graph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  adjacencyList: Map<string, Array<{ nodeId: string; weight: number }>>;
}

export enum NodeState {
  UNEXPLORED = 'unexplored',
  FRONTIER = 'frontier',
  VISITED = 'visited',
  CURRENT = 'current',
  PATH = 'path',
  BEST_PATH = 'best_path'
}

export interface NodeVisualState {
  nodeId: string;
  state: NodeState;
}

export interface AlgorithmStep {
  currentNode: string | null;
  frontier: Set<string>;
  visited: Set<string>;
  path: string[];
  bestPath?: string[];
  bestCost?: number;
  distances?: Map<string, number>;
  parents?: Map<string, string | null>;
  message: string;
}

export interface AlgorithmResult {
  steps: AlgorithmStep[];
  finalPath: string[];
  totalCost: number;
  nodesExpanded: number;
}

export type AlgorithmType = 'bfs' | 'dfs' | 'dijkstra' | 'astar' | 'greedy';

export interface AlgorithmConfig {
  type: AlgorithmType;
  name: string;
  requiresHeuristic: boolean;
  requiresWeights: boolean;
}

export interface PlaybackState {
  currentStep: number;
  isPlaying: boolean;
  speed: number;
}

export interface ComparisonState {
  algorithms: AlgorithmType[];
  results: Map<AlgorithmType, AlgorithmResult>;
  synchronizedStep: number;
}