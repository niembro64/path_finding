<template>
  <div class="app">
    <header class="app-header">
      <h1>Interactive Pathfinding Visualization</h1>
      <div class="mode-buttons">
        <button @click="setViewMode('single')" :class="['mode-toggle', { active: viewMode === 'single' }]">
          Single Mode
        </button>
        <button @click="setViewMode('comparison')" :class="['mode-toggle', { active: viewMode === 'comparison' }]">
          Comparison Mode
        </button>
        <button @click="setViewMode('all')" :class="['mode-toggle', { active: viewMode === 'all' }]">
          All Algorithms
        </button>
      </div>
    </header>

    <div class="app-content">
      <div v-if="viewMode === 'single'" class="single-mode">
        <aside class="sidebar">
          <AlgorithmSelector
            :selected-algorithm="selectedAlgorithm"
            :available-nodes="availableNodes"
            :start-node="startNode"
            :goal-node="goalNode"
            :show-weights="showWeights"
            @select="selectAlgorithm"
            @update-nodes="updateNodes"
            @toggle-weights="showWeights = $event"
            @run-algorithm="runSelectedAlgorithm"
          />

          <div v-if="currentResult" class="statistics">
            <h3>Statistics</h3>
            <div class="stat-item">
              <span class="stat-label">Path Length:</span>
              <span class="stat-value">{{ currentResult.finalPath.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Cost:</span>
              <span class="stat-value">{{ currentResult.totalCost.toFixed(2) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Nodes Expanded:</span>
              <span class="stat-value">{{ currentResult.nodesExpanded }}</span>
            </div>
          </div>

          <StepDetails
            v-if="currentResult"
            :current-step="currentStep"
          />
        </aside>

        <main class="main-content">
          <div class="graph-wrapper">
            <GraphVisualization
              :graph="graph"
              :current-step="currentStep"
              :show-weights="showWeights"
            />
          </div>

          <div v-if="currentResult" class="controls-wrapper">
            <PlaybackControls
              :current-step="currentStepIndex"
              :total-steps="currentResult.steps.length"
              :is-playing="isPlaying"
              :speed="playbackSpeed"
              :message="currentStep?.message || ''"
              @toggle-play="togglePlay"
              @step-forward="stepForward"
              @step-backward="stepBackward"
              @reset="reset"
              @seek="seek"
              @speed-change="playbackSpeed = $event"
            />
          </div>
        </main>
      </div>

      <div v-else-if="viewMode === 'comparison'" class="comparison-mode">
        <ComparisonView
          :graph="graph"
          :selected-algorithms="comparisonAlgorithms"
          :results="comparisonResults"
          :synchronized-step="synchronizedStep"
          :is-playing="isPlaying"
          :speed="playbackSpeed"
          @close="() => setViewMode('single')"
          @run-comparison="(start, goal) => runComparison(start, goal)"
          @toggle-play="togglePlay"
          @step-forward="stepForwardComparison"
          @step-backward="stepBackwardComparison"
          @reset="resetComparison"
          @seek="seekComparison"
          @speed-change="playbackSpeed = $event"
        />
      </div>

      <div v-else-if="viewMode === 'all'" class="all-algorithms-mode">
        <AllAlgorithmsView
          :graph="graph"
          @close="() => setViewMode('single')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';
import type { Graph, AlgorithmType, AlgorithmResult, AlgorithmStep } from '@/types/graph';
import { generateSampleGraph } from '@/utils/graphGenerator';
import { runAlgorithm } from '@/algorithms';
import GraphVisualization from '@/components/GraphVisualization.vue';
import AlgorithmSelector from '@/components/AlgorithmSelector.vue';
import PlaybackControls from '@/components/PlaybackControls.vue';
import ComparisonView from '@/components/ComparisonView.vue';
import StepDetails from '@/components/StepDetails.vue';
import AllAlgorithmsView from '@/components/AllAlgorithmsView.vue';

const graph = ref<Graph>(generateSampleGraph());
const selectedAlgorithm = ref<AlgorithmType | null>(null);
const currentResult = ref<AlgorithmResult | null>(null);
const currentStepIndex = ref(0);
const isPlaying = ref(false);
const playbackSpeed = ref(1);
const showWeights = ref(true);
const startNode = ref('A0-0');
const goalNode = ref('A14-14');

const viewMode = ref<'single' | 'comparison' | 'all'>('comparison');
const comparisonAlgorithms = ref<AlgorithmType[]>(['bfs', 'dfs', 'dijkstra', 'astar', 'greedy']);
const comparisonResults = ref<Map<AlgorithmType, AlgorithmResult>>(new Map());
const synchronizedStep = ref(0);

let playbackInterval: number | null = null;

const availableNodes = computed(() => {
  return Array.from(graph.value.nodes.keys()).sort();
});

const currentStep = computed<AlgorithmStep | null>(() => {
  if (!currentResult.value || currentStepIndex.value >= currentResult.value.steps.length) {
    return null;
  }
  return currentResult.value.steps[currentStepIndex.value] || null;
});

const selectAlgorithm = (algorithm: AlgorithmType) => {
  selectedAlgorithm.value = algorithm;
};

const updateNodes = (start: string, goal: string) => {
  startNode.value = start;
  goalNode.value = goal;
};

const runSelectedAlgorithm = () => {
  if (!selectedAlgorithm.value) return;

  currentResult.value = runAlgorithm(
    selectedAlgorithm.value,
    graph.value,
    startNode.value,
    goalNode.value
  );
  currentStepIndex.value = 0;
  stopPlayback();

  // Automatically start playing through the steps
  if (currentResult.value && currentResult.value.steps.length > 0) {
    startPlayback();
  }
};

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlayback();
  } else {
    startPlayback();
  }
};

const startPlayback = () => {
  if (viewMode.value === 'comparison' && comparisonResults.value.size === 0) {
    console.log('[App] Cannot start playback - no comparison results');
    return;
  }
  if (viewMode.value !== 'comparison' && !currentResult.value) {
    console.log('[App] Cannot start playback - no current result');
    return;
  }

  console.log(`[App] Starting playback at ${playbackSpeed.value}x speed for ${viewMode.value} mode`);
  isPlaying.value = true;
  playbackInterval = window.setInterval(() => {
    if (viewMode.value === 'comparison') {
      stepForwardComparison();
    } else {
      stepForward();
    }
  }, 1000 / playbackSpeed.value);
};

const stopPlayback = () => {
  isPlaying.value = false;
  if (playbackInterval !== null) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
};

const stepForward = () => {
  if (!currentResult.value) return;
  
  if (currentStepIndex.value < currentResult.value.steps.length - 1) {
    currentStepIndex.value++;
  } else {
    stopPlayback();
  }
};

const stepBackward = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
};

const reset = () => {
  currentStepIndex.value = 0;
  stopPlayback();
};

const seek = (step: number) => {
  if (!currentResult.value) return;
  currentStepIndex.value = Math.max(0, Math.min(step, currentResult.value.steps.length - 1));
};

const setViewMode = (mode: 'single' | 'comparison' | 'all') => {
  viewMode.value = mode;
  stopPlayback();
  if (mode === 'single') {
    comparisonAlgorithms.value = [];
    comparisonResults.value.clear();
    synchronizedStep.value = 0;
  } else if (mode === 'comparison') {
    // Auto-select all algorithms for comparison mode
    comparisonAlgorithms.value = ['bfs', 'dfs', 'dijkstra', 'astar', 'greedy'];
  }
};

const toggleComparisonAlgorithm = (algorithm: AlgorithmType) => {
  const index = comparisonAlgorithms.value.indexOf(algorithm);
  if (index === -1) {
    comparisonAlgorithms.value.push(algorithm);
  } else {
    comparisonAlgorithms.value.splice(index, 1);
    comparisonResults.value.delete(algorithm);
  }
};

const runComparison = (start?: string, goal?: string) => {
  console.log('[App] Starting runComparison...', { start, goal });

  // Update start and goal nodes if provided
  if (start) startNode.value = start;
  if (goal) goalNode.value = goal;

  console.log('[App] Using nodes:', { start: startNode.value, goal: goalNode.value });
  console.log('[App] Graph has', graph.value.nodes.size, 'nodes and', graph.value.edges.size, 'edges');

  comparisonResults.value.clear();
  const startTime = performance.now();

  comparisonAlgorithms.value.forEach(algo => {
    const algoStartTime = performance.now();
    console.log(`[App] Running ${algo} algorithm...`);

    const result = runAlgorithm(algo, graph.value, startNode.value, goalNode.value);

    const algoEndTime = performance.now();
    console.log(`[App] ${algo} completed in ${(algoEndTime - algoStartTime).toFixed(2)}ms - ${result.steps.length} steps, cost: ${result.totalCost}`);

    comparisonResults.value.set(algo, result);
  });

  const endTime = performance.now();
  console.log(`[App] All algorithms completed in ${(endTime - startTime).toFixed(2)}ms`);

  synchronizedStep.value = 0;
  stopPlayback();

  // Auto-start playback for comparison mode
  if (comparisonResults.value.size > 0) {
    console.log('[App] Starting playback with', comparisonResults.value.size, 'results');
    startPlayback();
  }
};

const stepForwardComparison = () => {
  let maxSteps = 0;
  comparisonResults.value.forEach(result => {
    maxSteps = Math.max(maxSteps, result.steps.length);
  });

  if (synchronizedStep.value < maxSteps - 1) {
    synchronizedStep.value++;
    console.log(`[App] Stepped to ${synchronizedStep.value + 1}/${maxSteps}`);
  } else {
    console.log('[App] Reached end of comparison playback');
    stopPlayback();
  }
};

const stepBackwardComparison = () => {
  if (synchronizedStep.value > 0) {
    synchronizedStep.value--;
  }
};

const resetComparison = () => {
  synchronizedStep.value = 0;
  stopPlayback();
};

const seekComparison = (step: number) => {
  let maxSteps = 0;
  comparisonResults.value.forEach(result => {
    maxSteps = Math.max(maxSteps, result.steps.length);
  });
  synchronizedStep.value = Math.max(0, Math.min(step, maxSteps - 1));
};

// Watch for speed changes and restart playback if needed
watch(playbackSpeed, () => {
  if (isPlaying.value) {
    stopPlayback();
    startPlayback();
  }
});

onUnmounted(() => {
  stopPlayback();
});
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-toggle {
  padding: 8px 16px;
  background: #f0f0f0;
  color: #333;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-toggle:hover {
  background: #e0e0e0;
}

.mode-toggle.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.app-content {
  flex: 1;
  overflow: hidden;
}

.single-mode {
  display: flex;
  height: 100%;
  gap: 16px;
  padding: 16px;
}

.sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.graph-wrapper {
  flex: 1;
  min-height: 0;
}

.controls-wrapper {
  flex-shrink: 0;
}

.statistics {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.statistics h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.comparison-mode {
  height: 100%;
  padding: 16px;
}

.all-algorithms-mode {
  height: 100%;
}
</style>