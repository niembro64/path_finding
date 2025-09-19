import type { Graph, Node, Edge, Position } from '@/types/graph';

export function createGraph(): Graph {
  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();
  const adjacencyList = new Map<string, Array<{ nodeId: string; weight: number }>>();

  return { nodes, edges, adjacencyList };
}

export function addNode(graph: Graph, id: string, position: Position, label?: string): void {
  const node: Node = {
    id,
    position,
    label: label || id
  };
  graph.nodes.set(id, node);
  if (!graph.adjacencyList.has(id)) {
    graph.adjacencyList.set(id, []);
  }
}

export function addEdge(graph: Graph, source: string, target: string, weight: number = 1, bidirectional: boolean = true): void {
  const edgeId = `${source}-${target}`;
  const edge: Edge = {
    id: edgeId,
    source,
    target,
    weight
  };
  graph.edges.set(edgeId, edge);

  const sourceAdjList = graph.adjacencyList.get(source) || [];
  sourceAdjList.push({ nodeId: target, weight });
  graph.adjacencyList.set(source, sourceAdjList);

  if (bidirectional) {
    const reverseEdgeId = `${target}-${source}`;
    const reverseEdge: Edge = {
      id: reverseEdgeId,
      source: target,
      target: source,
      weight
    };
    graph.edges.set(reverseEdgeId, reverseEdge);

    const targetAdjList = graph.adjacencyList.get(target) || [];
    targetAdjList.push({ nodeId: source, weight });
    graph.adjacencyList.set(target, targetAdjList);
  }
}

export function generateSampleGraph(): Graph {
  const graph = createGraph();

  const positions: Record<string, Position> = {
    'A': { x: 100, y: 100 },
    'B': { x: 250, y: 50 },
    'C': { x: 400, y: 100 },
    'D': { x: 550, y: 150 },
    'E': { x: 100, y: 250 },
    'F': { x: 250, y: 200 },
    'G': { x: 400, y: 250 },
    'H': { x: 550, y: 300 },
    'I': { x: 250, y: 350 },
    'J': { x: 400, y: 400 }
  };

  Object.entries(positions).forEach(([id, pos]) => {
    addNode(graph, id, pos);
  });

  const edges: Array<[string, string, number]> = [
    ['A', 'B', 4],
    ['A', 'E', 3],
    ['B', 'C', 5],
    ['B', 'F', 2],
    ['C', 'D', 6],
    ['C', 'G', 4],
    ['D', 'H', 3],
    ['E', 'F', 3],
    ['E', 'I', 5],
    ['F', 'G', 3],
    ['F', 'I', 4],
    ['G', 'H', 4],
    ['G', 'J', 3],
    ['H', 'J', 5],
    ['I', 'J', 4]
  ];

  edges.forEach(([source, target, weight]) => {
    addEdge(graph, source, target, weight, true);
  });

  const goalNode = graph.nodes.get('J');
  if (goalNode) {
    graph.nodes.forEach((node) => {
      const dx = goalNode.position.x - node.position.x;
      const dy = goalNode.position.y - node.position.y;
      node.heuristic = Math.sqrt(dx * dx + dy * dy) / 50;
    });
  }

  return graph;
}

export function calculateHeuristic(node: Node, goal: Node): number {
  const dx = goal.position.x - node.position.x;
  const dy = goal.position.y - node.position.y;
  return Math.sqrt(dx * dx + dy * dy) / 50;
}