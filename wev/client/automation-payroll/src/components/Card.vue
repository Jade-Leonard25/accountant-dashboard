<script setup lang="ts">
withDefaults(
  defineProps<{
    widthClass?: string;
    minHeightClass?: string;
    paddingClass?: string;
    centerContent?: boolean;
  }>(),
  {
    widthClass: "w-[400px]",
    minHeightClass: "min-h-[400px]",
    paddingClass: "p-6",
    centerContent: true,
  }
);
</script>

<template>
  <div
    :class="[
      'border rounded shadow-md bg-white max-w-full',
      widthClass,
      minHeightClass,
      paddingClass,
      centerContent ? 'flex items-center justify-center' : '',
    ]"
  >
    <slot />
  </div>
</template>
