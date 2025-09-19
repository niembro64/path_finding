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

  // Create a much larger grid-based graph
  const rows = 15; // 15x15 grid = 225 nodes
  const cols = 15;
  const spacing = 60;
  const startX = 50;
  const startY = 50;

  // Generate nodes in a grid pattern
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nodeId = `${String.fromCharCode(65 + Math.floor(row / 26))}${row % 26}-${col}`;
      const position: Position = {
        x: startX + col * spacing,
        y: startY + row * spacing
      };
      addNode(graph, nodeId, position, nodeId);
    }
  }

  // Connect nodes in grid pattern with some randomization
  const nodeIds = Array.from(graph.nodes.keys());

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const currentId = `${String.fromCharCode(65 + Math.floor(row / 26))}${row % 26}-${col}`;

      // Connect to right neighbor
      if (col < cols - 1) {
        const rightId = `${String.fromCharCode(65 + Math.floor(row / 26))}${row % 26}-${col + 1}`;
        const weight = Math.floor(Math.random() * 9) + 1; // Random weight 1-9
        addEdge(graph, currentId, rightId, weight, true);
      }

      // Connect to bottom neighbor
      if (row < rows - 1) {
        const bottomId = `${String.fromCharCode(65 + Math.floor((row + 1) / 26))}${(row + 1) % 26}-${col}`;
        const weight = Math.floor(Math.random() * 9) + 1;
        addEdge(graph, currentId, bottomId, weight, true);
      }

      // Add diagonal connections with 30% probability for more interesting paths
      if (row < rows - 1 && col < cols - 1 && Math.random() < 0.3) {
        const diagonalId = `${String.fromCharCode(65 + Math.floor((row + 1) / 26))}${(row + 1) % 26}-${col + 1}`;
        const weight = Math.floor(Math.random() * 9) + 2; // Slightly higher weight for diagonals
        addEdge(graph, currentId, diagonalId, weight, true);
      }

      // Add other diagonal with 30% probability
      if (row < rows - 1 && col > 0 && Math.random() < 0.3) {
        const diagonalId = `${String.fromCharCode(65 + Math.floor((row + 1) / 26))}${(row + 1) % 26}-${col - 1}`;
        const weight = Math.floor(Math.random() * 9) + 2;
        addEdge(graph, currentId, diagonalId, weight, true);
      }
    }
  }

  // Set heuristics for A* and Greedy (using bottom-right corner as default goal)
  const goalId = `${String.fromCharCode(65 + Math.floor((rows - 1) / 26))}${(rows - 1) % 26}-${cols - 1}`;
  const goalNode = graph.nodes.get(goalId);
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