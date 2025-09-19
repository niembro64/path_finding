<template>
  <div ref="containerRef" class="graph-container">
    <svg ref="svgRef"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import * as d3 from 'd3';
import type { Graph, NodeState, AlgorithmStep } from '@/types/graph';

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

  props.graph.nodes.forEach((_, nodeId) => {
    if (props.currentStep.path.includes(nodeId)) {
      states.set(nodeId, NodeState.PATH);
    } else if (nodeId === props.currentStep.currentNode) {
      states.set(nodeId, NodeState.CURRENT);
    } else if (props.currentStep.visited.has(nodeId)) {
      states.set(nodeId, NodeState.VISITED);
    } else if (props.currentStep.frontier.has(nodeId)) {
      states.set(nodeId, NodeState.FRONTIER);
    } else {
      states.set(nodeId, NodeState.UNEXPLORED);
    }
  });

  return states;
});

const getNodeColor = (state: NodeState): string => {
  switch (state) {
    case NodeState.UNEXPLORED:
      return '#e0e0e0';
    case NodeState.FRONTIER:
      return '#2196f3';
    case NodeState.VISITED:
      return '#4caf50';
    case NodeState.CURRENT:
      return '#ffc107';
    case NodeState.PATH:
      return '#f44336';
    default:
      return '#e0e0e0';
  }
};

const drawGraph = () => {
  if (!svgRef.value || !containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height);

  svg.selectAll('*').remove();

  const g = svg.append('g');

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  const edges = Array.from(props.graph.edges.values());
  const nodes = Array.from(props.graph.nodes.values());

  const links = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(edges)
    .enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-width', 2)
    .attr('x1', d => props.graph.nodes.get(d.source)?.position.x || 0)
    .attr('y1', d => props.graph.nodes.get(d.source)?.position.y || 0)
    .attr('x2', d => props.graph.nodes.get(d.target)?.position.x || 0)
    .attr('y2', d => props.graph.nodes.get(d.target)?.position.y || 0);

  if (props.showWeights) {
    const edgeLabels = g.append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .attr('x', d => {
        const sourceNode = props.graph.nodes.get(d.source);
        const targetNode = props.graph.nodes.get(d.target);
        if (!sourceNode || !targetNode) return 0;
        return (sourceNode.position.x + targetNode.position.x) / 2;
      })
      .attr('y', d => {
        const sourceNode = props.graph.nodes.get(d.source);
        const targetNode = props.graph.nodes.get(d.target);
        if (!sourceNode || !targetNode) return 0;
        return (sourceNode.position.y + targetNode.position.y) / 2;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => d.weight.toString());
  }

  const nodeGroups = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('transform', d => `translate(${d.position.x}, ${d.position.y})`);

  const circles = nodeGroups.append('circle')
    .attr('r', 25)
    .attr('fill', d => getNodeColor(nodeStates.value.get(d.id) || NodeState.UNEXPLORED))
    .attr('stroke', '#333')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');

  const labels = nodeGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', 'white')
    .attr('font-weight', 'bold')
    .attr('font-size', '16px')
    .attr('pointer-events', 'none')
    .text(d => d.label);

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
    .on('mouseover', (event, d) => {
      const distance = props.currentStep?.distances?.get(d.id);
      const heuristic = d.heuristic;
      let text = `Node: ${d.label}`;
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
    .on('mousemove', (event) => {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', () => {
      tooltip.style('visibility', 'hidden');
    });

  updateNodeColors();
};

const updateNodeColors = () => {
  if (!svgRef.value) return;

  d3.select(svgRef.value)
    .selectAll('.nodes circle')
    .transition()
    .duration(300)
    .attr('fill', (d: any) => getNodeColor(nodeStates.value.get(d.id) || NodeState.UNEXPLORED));

  if (props.currentStep?.path.length) {
    const pathEdges = new Set<string>();
    for (let i = 0; i < props.currentStep.path.length - 1; i++) {
      const source = props.currentStep.path[i];
      const target = props.currentStep.path[i + 1];
      pathEdges.add(`${source}-${target}`);
      pathEdges.add(`${target}-${source}`);
    }

    d3.select(svgRef.value)
      .selectAll('.links line')
      .transition()
      .duration(300)
      .attr('stroke', (d: any) => pathEdges.has(d.id) ? '#f44336' : '#999')
      .attr('stroke-width', (d: any) => pathEdges.has(d.id) ? 4 : 2);
  } else {
    d3.select(svgRef.value)
      .selectAll('.links line')
      .transition()
      .duration(300)
      .attr('stroke', '#999')
      .attr('stroke-width', 2);
  }
};

onMounted(() => {
  drawGraph();
  window.addEventListener('resize', drawGraph);
});

watch(() => props.currentStep, () => {
  updateNodeColors();
}, { deep: true });

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
</style>