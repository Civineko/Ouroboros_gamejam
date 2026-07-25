<script setup lang="ts">
const {
  label,
  disabled = false,
  active,
} = defineProps<{
  label: string;
  disabled?: boolean;
  active?: boolean;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    class="icon-button"
    type="button"
    :aria-label="label"
    :aria-pressed="active"
    :title="label"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.icon-button {
  display: inline-grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  cursor: pointer;
  background: color-mix(in srgb, var(--surface) 66%, transparent);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

.icon-button:hover:not(:disabled) {
  color: var(--surface);
  background: var(--ink);
  transform: translateY(-1px);
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.icon-button[aria-pressed="true"] {
  color: var(--surface);
  background: var(--teal-deep);
}
</style>
