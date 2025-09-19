<template>
  <div ref="containerRef" class="graph-container">
    <svg ref="svgRef"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import * as d3 from 'd3';
import { NodeState } from '@/types/graph';
import type { Graph, AlgorithmStep } from '@/types/graph';

// ========== CONFIGURATION VARIABLES ==========
// Toggle this to show/hide edge weight labels
const SHOW_EDGE_WEIGHT_LABELS = true;

// Multiplier for edge thickness (INVERTED - high weight = thin line)
// Edge thickness = (10 / weight) * EDGE_THICKNESS_MULTIPLIER
// Higher weights = thinner lines (easier/faster paths)
// Lower weights = thicker lines (harder/slower paths)
// Default: 1.0, Try: 0.5 (thinner overall), 2.0 (thicker overall)
const EDGE_THICKNESS_MULTIPLIER = 3.0;
// ==============================================

const props = defineProps<{
  graph: Graph;
  currentStep: AlgorithmStep | null;
  showWeights: boolean;
}>();

const containerRef = ref<HTMLDivElement>();
const svgRef = ref<SVGElement>();

const nodeStates = computed(() => {
  const states = new Map<string, NodeState>();

  if (!props.currentStep) {
    props.graph.nodes.forEach((_, nodeId) => {
      states.set(nodeId, NodeState.UNEXPLORED);
    });
    return states;
  }

  // Debug logging
  if (props.currentStep?.bestPath?.length) {
    console.log(`[GraphViz] Current step has best path: ${props.currentStep.bestPath.join(' → ')} (Cost: ${props.currentStep.bestCost})`);
  }

  let bestPathCount = 0;

  props.graph.nodes.forEach((_, nodeId) => {
    // Priority order: final path > current node > best path > visited > frontier > unexplored
    if (props.currentStep?.path?.length && props.currentStep.path.includes(nodeId)) {
      states.set(nodeId, NodeState.PATH);
    } else if (nodeId === props.currentStep?.currentNode) {
      states.set(nodeId, NodeState.CURRENT);
    } else if (props.currentStep?.bestPath?.includes(nodeId)) {
      states.set(nodeId, NodeState.BEST_PATH);
      bestPathCount++;
      console.log(`[GraphViz] Setting node ${nodeId} to BEST_PATH`);
    } else if (props.currentStep?.visited?.has(nodeId)) {
      states.set(nodeId, NodeState.VISITED);
    } else if (props.currentStep?.frontier?.has(nodeId)) {
      states.set(nodeId, NodeState.FRONTIER);
    } else {
      states.set(nodeId, NodeState.UNEXPLORED);
    }
  });

  if (bestPathCount > 0) {
    console.log(`[GraphViz] Total nodes set to BEST_PATH: ${bestPathCount}`);
  }

  return states;
});

const getNodeColor = (state: NodeState): string => {
  switch (state) {
    case NodeState.UNEXPLORED:
      return '#e0e0e0';
    case NodeState.FRONTIER:
      return '#42a5f5';
    case NodeState.VISITED:
      return '#66bb6a';
    case NodeState.CURRENT:
      return '#ffca28';
    case NodeState.PATH:
      return '#f44336'; // Red for final path
    case NodeState.BEST_PATH:
      return '#f44336'; // Red for current best path
    default:
      return '#e0e0e0';
  }
};

// Helper function to calculate edge thickness based on weight
const calculateEdgeThickness = (weight: number): number => {
  // Inverted relationship: higher weight = thinner line
  // Using 10 as a baseline for good visual range
  return (10 / weight) * EDGE_THICKNESS_MULTIPLIER;
};

const drawGraph = () => {
  if (!svgRef.value || !containerRef.value) return;

  const drawStartTime = performance.now();
  console.log('[GraphViz] Starting drawGraph...');

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height);

  svg.selectAll('*').remove();

  const g = svg.append('g');

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 5])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  (svg as any).call(zoom);

  // Initial zoom out to fit the large graph - extra zoom out for comparison view
  (svg as any).call(zoom.scaleTo, 0.15);

  const edges = Array.from(props.graph.edges.values());
  const nodes = Array.from(props.graph.nodes.values());

  const links = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(edges)
    .enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-width', (d: unknown) => {
      const edge = d as { weight: number };
      return calculateEdgeThickness(edge.weight);
    })
    .attr('opacity', 0.6)
    .attr('x1', (d: unknown) => {
      const edge = d as { source: string };
      return props.graph.nodes.get(edge.source)?.position.x || 0;
    })
    .attr('y1', (d: unknown) => {
      const edge = d as { source: string };
      return props.graph.nodes.get(edge.source)?.position.y || 0;
    })
    .attr('x2', (d: unknown) => {
      const edge = d as { target: string };
      return props.graph.nodes.get(edge.target)?.position.x || 0;
    })
    .attr('y2', (d: unknown) => {
      const edge = d as { target: string };
      return props.graph.nodes.get(edge.target)?.position.y || 0;
    });

  // Show edge weight labels based on configuration variable
  if (props.showWeights && SHOW_EDGE_WEIGHT_LABELS) {
    const edgeLabelGroups = g.append('g')
      .attr('class', 'edge-labels')
      .selectAll('g')
      .data(edges)
      .enter()
      .append('g')
      .attr('transform', (d: unknown) => {
        const edge = d as { source: string; target: string };
        const sourceNode = props.graph.nodes.get(edge.source);
        const targetNode = props.graph.nodes.get(edge.target);
        if (!sourceNode || !targetNode) return 'translate(0, 0)';
        const x = (sourceNode.position.x + targetNode.position.x) / 2;
        const y = (sourceNode.position.y + targetNode.position.y) / 2;
        return `translate(${x}, ${y})`;
      });

    // Add white background circle for better readability
    edgeLabelGroups.append('circle')
      .attr('r', 8)
      .attr('fill', 'white')
      .attr('opacity', 0.9);

    edgeLabelGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#333')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: unknown) => {
        const edge = d as { weight: number };
        return edge.weight.toString();
      });
  }

  const nodeGroups = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('transform', (d: unknown) => {
      const node = d as { position: { x: number; y: number } };
      return `translate(${node.position.x}, ${node.position.y})`;
    });

  const circles = nodeGroups.append('circle')
    .attr('r', 15)
    .attr('fill', (d: unknown) => {
      const node = d as { id: string };
      return getNodeColor(nodeStates.value.get(node.id) || NodeState.UNEXPLORED);
    })
    .attr('stroke', '#333')
    .attr('stroke-width', 1)
    .attr('class', (d: unknown) => {
      const node = d as { id: string };
      const state = nodeStates.value.get(node.id);
      return state === NodeState.CURRENT ? 'pulse-animation' : '';
    })
    .style('cursor', 'pointer')
    .style('transition', 'fill 0.3s ease');

  // Don't show labels for large graphs - too cluttered
  // const labels = nodeGroups.append('text')
  //   .attr('text-anchor', 'middle')
  //   .attr('dominant-baseline', 'middle')
  //   .attr('fill', 'white')
  //   .attr('font-weight', 'bold')
  //   .attr('font-size', '8px')
  //   .attr('pointer-events', 'none')
  //   .text(d => d.label);

  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(0, 0, 0, 0.8)')
    .style('color', 'white')
    .style('padding', '8px')
    .style('border-radius', '4px')
    .style('font-size', '12px');

  nodeGroups
    .on('mouseover', (event: MouseEvent, d: unknown) => {
      const node = d as { id: string; label: string; heuristic?: number };
      const distance = props.currentStep?.distances?.get(node.id);
      const heuristic = node.heuristic;
      let text = `Node: ${node.label}`;
      if (distance !== undefined && distance !== Infinity) {
        text += `\nDistance: ${distance}`;
      }
      if (heuristic !== undefined) {
        text += `\nHeuristic: ${heuristic.toFixed(2)}`;
      }
      tooltip
        .style('visibility', 'visible')
        .text(text);
    })
    .on('mousemove', (event: MouseEvent) => {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', () => {
      tooltip.style('visibility', 'hidden');
    });

  const drawEndTime = performance.now();
  console.log(`[GraphViz] drawGraph completed in ${(drawEndTime - drawStartTime).toFixed(2)}ms`);

  // Ensure colors are updated after drawing
  setTimeout(() => updateNodeColors(), 50);
};

const updateNodeColors = () => {
  if (!svgRef.value) return;

  const updateStartTime = performance.now();

  d3.select(svgRef.value)
    .selectAll('.nodes circle')
    .transition()
    .duration(300)
    .attr('fill', (d: unknown) => {
      const node = d as { id: string };
      const state = nodeStates.value.get(node.id) || NodeState.UNEXPLORED;
      return getNodeColor(state);
    })
    .attr('class', (d: unknown) => {
      const node = d as { id: string };
      const state = nodeStates.value.get(node.id);
      return state === NodeState.CURRENT ? 'pulse-animation' : '';
    });

  const pathEdges = new Set<string>();
  const bestPathEdges = new Set<string>();

  // Final path edges (green)
  if (props.currentStep?.path?.length) {
    for (let i = 0; i < props.currentStep.path.length - 1; i++) {
      const source = props.currentStep.path[i];
      const target = props.currentStep.path[i + 1];
      if (source && target) {
        pathEdges.add(`${source}-${target}`);
        pathEdges.add(`${target}-${source}`);
      }
    }
  }

  // Best path edges (red)
  if (props.currentStep?.bestPath?.length) {
    console.log(`[GraphViz] Processing best path edges for: ${props.currentStep.bestPath.join(' → ')}`);
    for (let i = 0; i < props.currentStep.bestPath.length - 1; i++) {
      const source = props.currentStep.bestPath[i];
      const target = props.currentStep.bestPath[i + 1];
      if (source && target) {
        const edgeId = `${source}-${target}`;
        const reverseEdgeId = `${target}-${source}`;
        bestPathEdges.add(edgeId);
        bestPathEdges.add(reverseEdgeId);
        console.log(`[GraphViz] Added best path edge: ${edgeId}`);
      }
    }
    console.log(`[GraphViz] Total best path edges: ${bestPathEdges.size}`);
  }

  d3.select(svgRef.value)
    .selectAll('.links line')
    .transition()
    .duration(300)
    .attr('stroke', (d: unknown) => {
      const edge = d as { id: string };
      if (pathEdges.has(edge.id)) return '#f44336'; // Red for final path
      if (bestPathEdges.has(edge.id)) return '#f44336'; // Red for best path
      return '#999'; // Default gray
    })
    .attr('stroke-width', (d: unknown) => {
      const edge = d as { id: string; weight: number };
      return calculateEdgeThickness(edge.weight);
    })
    .attr('opacity', (d: unknown) => {
      const edge = d as { id: string };
      if (pathEdges.has(edge.id) || bestPathEdges.has(edge.id)) return 1;
      return 0.6;
    });

  const updateEndTime = performance.now();
  console.log(`[GraphViz] updateNodeColors completed in ${(updateEndTime - updateStartTime).toFixed(2)}ms`);
};

onMounted(() => {
  drawGraph();
  window.addEventListener('resize', drawGraph);
});

watch(() => props.currentStep, () => {
  updateNodeColors();
}, { deep: true, immediate: true });

watch(() => props.graph, () => {
  drawGraph();
}, { deep: true });

watch(() => props.showWeights, () => {
  drawGraph();
});
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

svg {
  width: 100%;
  height: 100%;
}

@keyframes pulse {
  0% {
    stroke-width: 2;
    stroke-opacity: 1;
  }
  50% {
    stroke-width: 6;
    stroke-opacity: 0.7;
  }
  100% {
    stroke-width: 2;
    stroke-opacity: 1;
  }
}

:global(.pulse-animation) {
  animation: pulse 1.5s ease-in-out infinite;
  stroke: #ff9800 !important;
}
</style>