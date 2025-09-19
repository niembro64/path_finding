<template>
  <div class="playback-controls">
    <div class="controls-row">
      <button @click="$emit('reset')" class="control-btn" :disabled="isPlaying">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </button>
      
      <button @click="$emit('step-backward')" class="control-btn" :disabled="currentStep <= 0 || isPlaying">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>
      
      <button @click="$emit('toggle-play')" class="control-btn primary">
        <svg v-if="!isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>
      
      <button @click="$emit('step-forward')" class="control-btn" :disabled="currentStep >= totalSteps - 1 || isPlaying">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
    </div>

    <div class="progress-container">
      <div class="step-counter">
        Step {{ currentStep + 1 }} / {{ totalSteps }}
      </div>
      <input
        type="range"
        :min="0"
        :max="totalSteps - 1"
        :value="currentStep"
        @input="$emit('seek', Number(($event.target as HTMLInputElement).value))"
        class="progress-slider"
        :disabled="isPlaying"
      />
    </div>

    <div class="speed-control">
      <label>Speed:</label>
      <input
        type="range"
        min="0.25"
        max="100"
        step="0.25"
        :value="speed"
        @input="$emit('speed-change', Number(($event.target as HTMLInputElement).value))"
        class="speed-slider"
      />
      <span>{{ speed }}x</span>
    </div>

    <div class="message-display" v-if="message">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  message: string;
}>();

defineEmits<{
  'toggle-play': [];
  'step-forward': [];
  'step-backward': [];
  'reset': [];
  'seek': [step: number];
  'speed-change': [speed: number];
}>();
</script>

<style scoped>
.playback-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.controls-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.control-btn {
  width: 48px;
  height: 48px;
  border: none;
  background: #f0f0f0;
  color: #333;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.primary {
  background: #2196f3;
  color: white;
}

.control-btn.primary:hover:not(:disabled) {
  background: #1976d2;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-counter {
  text-align: center;
  font-weight: 500;
  color: #666;
}

.progress-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 3px;
  outline: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #2196f3;
  border-radius: 50%;
  cursor: pointer;
}

.progress-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #2196f3;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.progress-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
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

.message-display {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  text-align: center;
  border-left: 4px solid #2196f3;
}
</style>