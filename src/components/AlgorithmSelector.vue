<template>
  <div class="algorithm-selector">
    <h3>Select Algorithm</h3>
    <div class="algorithm-grid">
      <button
        v-for="algo in algorithmConfigs"
        :key="algo.type"
        @click="$emit('select', algo.type)"
        :class="{ active: selectedAlgorithm === algo.type }"
        class="algorithm-btn"
      >
        {{ algo.name }}
      </button>
    </div>

    <div class="node-selectors">
      <div class="selector-group">
        <label>Start Node:</label>
        <select v-model="localStartNode" @change="updateNodes" class="node-select">
          <option v-for="node in availableNodes" :key="node" :value="node">
            {{ node }}
          </option>
        </select>
      </div>
      
      <div class="selector-group">
        <label>Goal Node:</label>
        <select v-model="localGoalNode" @change="updateNodes" class="node-select">
          <option v-for="node in availableNodes" :key="node" :value="node">
            {{ node }}
          </option>
        </select>
      </div>
    </div>

    <div class="options">
      <label class="checkbox-label">
        <input type="checkbox" v-model="localShowWeights" @change="$emit('toggle-weights', localShowWeights)" />
        Show Edge Weights
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { AlgorithmType, AlgorithmConfig } from '@/types/graph';

const props = defineProps<{
  selectedAlgorithm: AlgorithmType | null;
  availableNodes: string[];
  startNode: string;
  goalNode: string;
  showWeights: boolean;
}>();

const emit = defineEmits<{
  'select': [algorithm: AlgorithmType];
  'update-nodes': [start: string, goal: string];
  'toggle-weights': [show: boolean];
}>();

const algorithmConfigs: AlgorithmConfig[] = [
  { type: 'bfs', name: 'BFS', requiresHeuristic: false, requiresWeights: false },
  { type: 'dfs', name: 'DFS', requiresHeuristic: false, requiresWeights: false },
  { type: 'dijkstra', name: 'Dijkstra', requiresHeuristic: false, requiresWeights: true },
  { type: 'astar', name: 'A*', requiresHeuristic: true, requiresWeights: true },
  { type: 'greedy', name: 'Greedy', requiresHeuristic: true, requiresWeights: false }
];

const localStartNode = ref(props.startNode);
const localGoalNode = ref(props.goalNode);
const localShowWeights = ref(props.showWeights);

watch(() => props.startNode, (newVal) => {
  localStartNode.value = newVal;
});

watch(() => props.goalNode, (newVal) => {
  localGoalNode.value = newVal;
});

const updateNodes = () => {
  emit('update-nodes', localStartNode.value, localGoalNode.value);
};
</script>

<style scoped>
.algorithm-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.algorithm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.algorithm-btn {
  padding: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  transition: all 0.2s;
}

.algorithm-btn:hover {
  background: #f5f5f5;
}

.algorithm-btn.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.node-selectors {
  display: flex;
  gap: 12px;
}

.selector-group {
  flex: 1;
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
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.node-select:focus {
  outline: none;
  border-color: #2196f3;
}

.options {
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
</style>