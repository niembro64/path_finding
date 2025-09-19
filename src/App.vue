<template>
  <div class="app">
    <header class="app-header">
      <h1>Interactive Pathfinding Visualization</h1>
      <button @click="toggleComparisonMode" class="mode-toggle">
        {{ comparisonMode ? 'Single Mode' : 'Comparison Mode' }}
      </button>
    </header>

    <div class="app-content">
      <div v-if="!comparisonMode" class="single-mode">
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

      <div v-else class="comparison-mode">
        <ComparisonView
          :graph="graph"
          :selected-algorithms="comparisonAlgorithms"
          :results="comparisonResults"
          :synchronized-step="synchronizedStep"
          :is-playing="isPlaying"
          :speed="playbackSpeed"
          @close="toggleComparisonMode"
          @toggle-algorithm="toggleComparisonAlgorithm"
          @run-comparison="runComparison"
          @toggle-play="togglePlay"
          @step-forward="stepForwardComparison"
          @step-backward="stepBackwardComparison"
          @reset="resetComparison"
          @seek="seekComparison"
          @speed-change="playbackSpeed = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import type { Graph, AlgorithmType, AlgorithmResult, AlgorithmStep } from '@/types/graph';
import { generateSampleGraph } from '@/utils/graphGenerator';
import { runAlgorithm } from '@/algorithms';
import GraphVisualization from '@/components/GraphVisualization.vue';
import AlgorithmSelector from '@/components/AlgorithmSelector.vue';
import PlaybackControls from '@/components/PlaybackControls.vue';
import ComparisonView from '@/components/ComparisonView.vue';

const graph = ref<Graph>(generateSampleGraph());
const selectedAlgorithm = ref<AlgorithmType | null>(null);
const currentResult = ref<AlgorithmResult | null>(null);
const currentStepIndex = ref(0);
const isPlaying = ref(false);
const playbackSpeed = ref(1);
const showWeights = ref(true);
const startNode = ref('A');
const goalNode = ref('J');

const comparisonMode = ref(false);
const comparisonAlgorithms = ref<AlgorithmType[]>([]);
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
  runSelectedAlgorithm();
};

const updateNodes = (start: string, goal: string) => {
  startNode.value = start;
  goalNode.value = goal;
  if (selectedAlgorithm.value) {
    runSelectedAlgorithm();
  }
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
};

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlayback();
  } else {
    startPlayback();
  }
};

const startPlayback = () => {
  if (!currentResult.value) return;
  
  isPlaying.value = true;
  playbackInterval = window.setInterval(() => {
    if (comparisonMode.value) {
      stepForwardComparison();
    } else {
      stepForward();
    }
  }, 500 / playbackSpeed.value);
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

const toggleComparisonMode = () => {
  comparisonMode.value = !comparisonMode.value;
  stopPlayback();
  if (!comparisonMode.value) {
    comparisonAlgorithms.value = [];
    comparisonResults.value.clear();
    synchronizedStep.value = 0;
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

const runComparison = () => {
  comparisonResults.value.clear();
  comparisonAlgorithms.value.forEach(algo => {
    const result = runAlgorithm(algo, graph.value, startNode.value, goalNode.value);
    comparisonResults.value.set(algo, result);
  });
  synchronizedStep.value = 0;
  stopPlayback();
};

const stepForwardComparison = () => {
  let maxSteps = 0;
  comparisonResults.value.forEach(result => {
    maxSteps = Math.max(maxSteps, result.steps.length);
  });
  
  if (synchronizedStep.value < maxSteps - 1) {
    synchronizedStep.value++;
  } else {
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

.mode-toggle {
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.mode-toggle:hover {
  background: #1976d2;
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
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
</style>