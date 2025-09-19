<template>
  <div class="comparison-view">
    <div class="comparison-header">
      <h3>Algorithm Comparison</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="algorithms-selection">
      <label class="checkbox-label" v-for="algo in algorithmConfigs" :key="algo.type">
        <input
          type="checkbox"
          :checked="selectedAlgorithms.includes(algo.type)"
          @change="toggleAlgorithm(algo.type)"
        />
        {{ algo.name }}
      </label>
      <button @click="$emit('run-comparison')" class="run-btn" :disabled="selectedAlgorithms.length < 2">
        Run Comparison
      </button>
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

    <div class="sync-controls" v-if="results.size > 0">
      <PlaybackControls
        :current-step="synchronizedStep"
        :total-steps="maxSteps"
        :is-playing="isPlaying"
        :speed="speed"
        :message="`Synchronized Step ${synchronizedStep + 1} / ${maxSteps}`"
        @toggle-play="$emit('toggle-play')"
        @step-forward="$emit('step-forward')"
        @step-backward="$emit('step-backward')"
        @reset="$emit('reset')"
        @seek="$emit('seek', $event)"
        @speed-change="$emit('speed-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Graph, AlgorithmType, AlgorithmResult, AlgorithmConfig, AlgorithmStep } from '@/types/graph';
import GraphVisualization from './GraphVisualization.vue';
import PlaybackControls from './PlaybackControls.vue';

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
  'toggle-algorithm': [algorithm: AlgorithmType];
  'run-comparison': [];
  'toggle-play': [];
  'step-forward': [];
  'step-backward': [];
  'reset': [];
  'seek': [step: number];
  'speed-change': [speed: number];
}>();

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

const toggleAlgorithm = (algorithm: AlgorithmType) => {
  emit('toggle-algorithm', algorithm);
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

.comparison-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
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
  height: 300px;
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