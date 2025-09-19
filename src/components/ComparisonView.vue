<template>
  <div class="comparison-view">
    <div class="comparison-header">
      <h3>Algorithm Comparison</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="comparison-controls">
      <div class="node-selectors">
        <div class="selector-group">
          <label>Start Node:</label>
          <select v-model="startNode" class="node-select">
            <option v-for="node in availableNodes" :key="node" :value="node">
              {{ node }}
            </option>
          </select>
        </div>

        <div class="selector-group">
          <label>Goal Node:</label>
          <select v-model="goalNode" class="node-select">
            <option v-for="node in availableNodes" :key="node" :value="node">
              {{ node }}
            </option>
          </select>
        </div>
      </div>

      <button @click="runAllAlgorithms" class="run-btn">
        {{ results.size > 0 ? 'Run All Again' : 'Run All Algorithms' }}
      </button>

      <div class="speed-control" v-if="results.size > 0">
        <label>Speed:</label>
        <input
          type="range"
          min="0.25"
          max="100"
          step="0.25"
          :value="speed"
          @input="$emit('speed-change', Number($event.target.value))"
          class="speed-slider"
        />
        <span>{{ speed }}x</span>
      </div>

      <div class="playback-controls" v-if="results.size > 0">
        <button @click="$emit('toggle-play')" class="control-btn">
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>
        <button @click="$emit('step-backward')" class="control-btn">⏮️</button>
        <button @click="$emit('step-forward')" class="control-btn">⏭️</button>
        <button @click="$emit('reset')" class="control-btn">🔄</button>
      </div>
    </div>

    <div class="comparison-grid" v-if="results.size > 0">
      <div v-for="[type, result] in results" :key="type" class="algorithm-panel">
        <div class="panel-header">
          <h4>{{ getAlgorithmName(type) }}</h4>
          <div class="stats">
            <span>Nodes: {{ result.nodesExpanded }}</span>
            <span>Cost: {{ result.totalCost }}</span>
          </div>
        </div>
        
        <div class="mini-graph">
          <GraphVisualization
            :graph="graph"
            :current-step="getStepForAlgorithm(type)"
            :show-weights="false"
          />
        </div>
        
        <div class="panel-info">
          <div class="info-message">
            {{ getStepForAlgorithm(type)?.message || 'Ready' }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Graph, AlgorithmType, AlgorithmResult, AlgorithmConfig, AlgorithmStep } from '@/types/graph';
import GraphVisualization from './GraphVisualization.vue';

const props = defineProps<{
  graph: Graph;
  selectedAlgorithms: AlgorithmType[];
  results: Map<AlgorithmType, AlgorithmResult>;
  synchronizedStep: number;
  isPlaying: boolean;
  speed: number;
}>();

const emit = defineEmits<{
  'close': [];
  'run-comparison': [start: string, goal: string];
  'toggle-play': [];
  'step-forward': [];
  'step-backward': [];
  'reset': [];
  'seek': [step: number];
  'speed-change': [speed: number];
}>();

const startNode = ref('A0-0');
const goalNode = ref('A14-14');

const availableNodes = computed(() => {
  return Array.from(props.graph.nodes.keys()).sort();
});

const algorithmConfigs: AlgorithmConfig[] = [
  { type: 'bfs', name: 'BFS', requiresHeuristic: false, requiresWeights: false },
  { type: 'dfs', name: 'DFS', requiresHeuristic: false, requiresWeights: false },
  { type: 'dijkstra', name: 'Dijkstra', requiresHeuristic: false, requiresWeights: true },
  { type: 'astar', name: 'A*', requiresHeuristic: true, requiresWeights: true },
  { type: 'greedy', name: 'Greedy', requiresHeuristic: true, requiresWeights: false }
];

const maxSteps = computed(() => {
  let max = 0;
  props.results.forEach(result => {
    max = Math.max(max, result.steps.length);
  });
  return max;
});

const runAllAlgorithms = () => {
  console.log('[ComparisonView] Run All Algorithms clicked!', { start: startNode.value, goal: goalNode.value });
  emit('run-comparison', startNode.value, goalNode.value);
  console.log('[ComparisonView] Emitted run-comparison event');
};

const getAlgorithmName = (type: AlgorithmType): string => {
  const config = algorithmConfigs.find(c => c.type === type);
  return config?.name || type;
};

const getStepForAlgorithm = (type: AlgorithmType): AlgorithmStep | null => {
  const result = props.results.get(type);
  if (!result) return null;
  
  const stepIndex = Math.min(props.synchronizedStep, result.steps.length - 1);
  return result.steps[stepIndex] || null;
};

onMounted(() => {
  console.log('[ComparisonView] Component mounted with', props.graph.nodes.size, 'nodes');
  console.log('[ComparisonView] Available nodes:', availableNodes.value.slice(0, 5), '...');
});
</script>

<style scoped>
.comparison-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.comparison-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #333;
}

.algorithms-selection {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.run-btn {
  margin-left: auto;
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.run-btn:hover:not(:disabled) {
  background: #45a049;
}

.run-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comparison-controls {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
  flex-wrap: wrap;
}

.node-selectors {
  display: flex;
  gap: 16px;
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selector-group label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.node-select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 80px;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

.speed-control label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.speed-slider {
  flex: 1;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border-radius: 50%;
  cursor: pointer;
}

.speed-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #4caf50;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.speed-control span {
  font-size: 12px;
  color: #666;
  min-width: 30px;
}

.playback-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  padding: 4px 8px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.control-btn:hover {
  background: #e0e0e0;
}

.comparison-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  padding: 8px;
  overflow-y: auto;
}

.algorithm-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
}

.panel-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.mini-graph {
  height: 200px;
  position: relative;
}

.panel-info {
  padding: 12px;
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
}

.info-message {
  font-size: 13px;
  color: #666;
  text-align: center;
}

.sync-controls {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
  background: #fafafa;
}
</style>