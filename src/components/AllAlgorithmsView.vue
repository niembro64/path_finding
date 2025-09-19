<template>
  <div class="all-algorithms-view">
    <div class="controls-header">
      <h2>All Algorithms Comparison</h2>

      <div class="global-controls">
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

        <div class="control-buttons">
          <button
            @click="runAllAlgorithms"
            class="start-all-btn"
            :disabled="isAnyRunning"
          >
            {{ isAnyRunning ? 'Running...' : 'Start All Algorithms' }}
          </button>

          <button
            @click="stopAll"
            class="stop-all-btn"
            :disabled="!isAnyRunning"
          >
            Stop All
          </button>
        </div>

        <div class="speed-control">
          <label>Speed:</label>
          <input
            type="range"
            min="0.25"
            max="100"
            step="0.25"
            v-model="globalSpeed"
            class="speed-slider"
          />
          <span>{{ globalSpeed }}x</span>
        </div>
      </div>
    </div>

    <div class="algorithms-grid">
      <div
        v-for="algorithm in algorithms"
        :key="algorithm.type"
        class="algorithm-cell"
      >
        <div class="algorithm-header">
          <h3>{{ algorithm.name }}</h3>
          <div class="algorithm-stats" v-if="algorithmResults[algorithm.type]">
            <div class="stat">
              <span class="stat-label">Steps:</span>
              <span class="stat-value">{{ currentSteps[algorithm.type] + 1 }}/{{ algorithmResults[algorithm.type]?.steps.length }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Cost:</span>
              <span class="stat-value">{{ algorithmResults[algorithm.type]?.totalCost.toFixed(2) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Expanded:</span>
              <span class="stat-value">{{ algorithmResults[algorithm.type]?.nodesExpanded }}</span>
            </div>
          </div>
        </div>

        <div class="algorithm-visualization">
          <GraphVisualization
            :graph="graph"
            :current-step="getCurrentStep(algorithm.type)"
            :show-weights="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';
import type { Graph, AlgorithmType, AlgorithmResult, AlgorithmStep } from '@/types/graph';
import { runAlgorithm } from '@/algorithms';
import GraphVisualization from '@/components/GraphVisualization.vue';

const props = defineProps<{
  graph: Graph;
}>();

const emit = defineEmits<{
  'close': [];
}>();

const algorithms = [
  { type: 'bfs' as AlgorithmType, name: 'Breadth-First Search (BFS)' },
  { type: 'dfs' as AlgorithmType, name: 'Depth-First Search (DFS)' },
  { type: 'dijkstra' as AlgorithmType, name: 'Dijkstra\'s Algorithm' },
  { type: 'astar' as AlgorithmType, name: 'A* Algorithm' },
  { type: 'greedy' as AlgorithmType, name: 'Greedy Best-First' }
];

const startNode = ref('A0-0');
const goalNode = ref('A14-14');
const globalSpeed = ref(1.0);
const isAnyRunning = ref(false);

const algorithmResults = ref<Record<AlgorithmType, AlgorithmResult | null>>({
  bfs: null,
  dfs: null,
  dijkstra: null,
  astar: null,
  greedy: null
});

const currentSteps = ref<Record<AlgorithmType, number>>({
  bfs: 0,
  dfs: 0,
  dijkstra: 0,
  astar: 0,
  greedy: 0
});

const playbackIntervals = ref<Record<AlgorithmType, number | null>>({
  bfs: null,
  dfs: null,
  dijkstra: null,
  astar: null,
  greedy: null
});

const availableNodes = computed(() => {
  return Array.from(props.graph.nodes.keys()).sort();
});

const getCurrentStep = (algorithmType: AlgorithmType): AlgorithmStep | null => {
  const result = algorithmResults.value[algorithmType];
  const stepIndex = currentSteps.value[algorithmType];

  if (!result || stepIndex >= result.steps.length) {
    return null;
  }

  return result.steps[stepIndex] || null;
};

const runAllAlgorithms = () => {
  // Stop any running algorithms first
  stopAll();

  // Run all algorithms
  algorithms.forEach(algo => {
    const result = runAlgorithm(algo.type, props.graph, startNode.value, goalNode.value);
    algorithmResults.value[algo.type] = result;
    currentSteps.value[algo.type] = 0;
  });

  // Start playback for all algorithms
  isAnyRunning.value = true;
  algorithms.forEach(algo => {
    startPlayback(algo.type);
  });
};

const startPlayback = (algorithmType: AlgorithmType) => {
  const result = algorithmResults.value[algorithmType];
  if (!result) return;

  playbackIntervals.value[algorithmType] = window.setInterval(() => {
    if (currentSteps.value[algorithmType] < result.steps.length - 1) {
      currentSteps.value[algorithmType]++;
    } else {
      // This algorithm is done
      if (playbackIntervals.value[algorithmType]) {
        clearInterval(playbackIntervals.value[algorithmType]!);
        playbackIntervals.value[algorithmType] = null;
      }

      // Check if all algorithms are done
      const allDone = algorithms.every(algo =>
        playbackIntervals.value[algo.type] === null
      );

      if (allDone) {
        isAnyRunning.value = false;
      }
    }
  }, 1000 / globalSpeed.value);
};

const stopAll = () => {
  algorithms.forEach(algo => {
    if (playbackIntervals.value[algo.type]) {
      clearInterval(playbackIntervals.value[algo.type]!);
      playbackIntervals.value[algo.type] = null;
    }
  });
  isAnyRunning.value = false;
};

const restartPlayback = () => {
  if (isAnyRunning.value) {
    stopAll();
    // Restart playback for algorithms that aren't finished
    algorithms.forEach(algo => {
      const result = algorithmResults.value[algo.type];
      if (result && currentSteps.value[algo.type] < result.steps.length - 1) {
        startPlayback(algo.type);
      }
    });
    isAnyRunning.value = true;
  }
};

// Watch for speed changes and restart playback
watch(globalSpeed, () => {
  restartPlayback();
});

onUnmounted(() => {
  stopAll();
});
</script>

<style scoped>
.all-algorithms-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.controls-header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e0e0e0;
}

.controls-header h2 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 24px;
}

.global-controls {
  display: flex;
  align-items: center;
  gap: 24px;
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
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 100px;
}

.control-buttons {
  display: flex;
  gap: 12px;
}

.start-all-btn, .stop-all-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.start-all-btn {
  background: #4caf50;
  color: white;
}

.start-all-btn:hover:not(:disabled) {
  background: #45a049;
}

.stop-all-btn {
  background: #f44336;
  color: white;
}

.stop-all-btn:hover:not(:disabled) {
  background: #d32f2f;
}

.start-all-btn:disabled, .stop-all-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.speed-control label {
  font-weight: 500;
  color: #666;
}

.speed-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #4caf50;
  border-radius: 50%;
  cursor: pointer;
}

.speed-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #4caf50;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.algorithms-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
}

.algorithm-cell {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.algorithm-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.algorithm-header h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.algorithm-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  gap: 4px;
  font-size: 14px;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.stat-value {
  color: #333;
  font-weight: 600;
}

.algorithm-visualization {
  flex: 1;
  position: relative;
  min-height: 400px;
}
</style>