<template>
  <div class="step-details">
    <h3>Step Details</h3>
    
    <div class="detail-section">
      <h4>Current Node</h4>
      <div class="node-badge current">
        {{ currentStep?.currentNode || 'None' }}
      </div>
    </div>

    <div class="detail-section">
      <h4>Frontier ({{ currentStep?.frontier.size || 0 }})</h4>
      <div class="nodes-list">
        <span v-for="node in Array.from(currentStep?.frontier || [])" :key="node" class="node-badge frontier">
          {{ node }}
        </span>
        <span v-if="!currentStep?.frontier.size" class="empty-message">Empty</span>
      </div>
    </div>

    <div class="detail-section">
      <h4>Visited ({{ currentStep?.visited.size || 0 }})</h4>
      <div class="nodes-list">
        <span v-for="node in Array.from(currentStep?.visited || [])" :key="node" class="node-badge visited">
          {{ node }}
        </span>
        <span v-if="!currentStep?.visited.size" class="empty-message">None</span>
      </div>
    </div>

    <div class="detail-section" v-if="currentStep?.path.length">
      <h4>Current Path</h4>
      <div class="path-display">
        <span v-for="(node, index) in currentStep.path" :key="index">
          <span class="node-badge path">{{ node }}</span>
          <span v-if="index < currentStep.path.length - 1" class="path-arrow">→</span>
        </span>
      </div>
    </div>

    <div class="detail-section" v-if="currentStep?.distances">
      <h4>Distances</h4>
      <div class="distances-grid">
        <div v-for="[node, distance] in Array.from(currentStep.distances.entries()).filter(([_, d]) => d !== Infinity)" 
             :key="node" 
             class="distance-item">
          <span class="node-name">{{ node }}:</span>
          <span class="distance-value">{{ distance.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlgorithmStep } from '@/types/graph';

defineProps<{
  currentStep: AlgorithmStep | null;
}>();
</script>

<style scoped>
.step-details {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.step-details h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.nodes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.node-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: white;
}

.node-badge.current {
  background: #ffca28;
}

.node-badge.frontier {
  background: #42a5f5;
}

.node-badge.visited {
  background: #66bb6a;
}

.node-badge.path {
  background: #ef5350;
}

.empty-message {
  color: #999;
  font-style: italic;
  font-size: 13px;
}

.path-display {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.path-arrow {
  color: #666;
  font-weight: bold;
  margin: 0 4px;
}

.distances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.distance-item {
  display: flex;
  gap: 4px;
  font-size: 12px;
  padding: 4px 6px;
  background: #f5f5f5;
  border-radius: 3px;
}

.node-name {
  font-weight: 500;
  color: #666;
}

.distance-value {
  color: #333;
}
</style>