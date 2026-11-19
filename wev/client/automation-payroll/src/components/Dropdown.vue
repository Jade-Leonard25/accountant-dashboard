<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { motion, AnimatePresence } from "motion-v";

export interface MenuItem {
  name: string;
  link: string;
}

const props = withDefaults(
  defineProps<{
    items: MenuItem[];
    label?: string;
  }>(),
  {
    label: "Open",
  }
);

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="containerRef" class="relative inline-block">
    <button
      type="button"
      @click="toggleMenu"
      :aria-expanded="isOpen"
      class="px-3 py-1.5 rounded border border-gray-300 bg-white text-sm font-medium"
    >
      {{ isOpen ? "Close" : props.label }}
    </button>

    <AnimatePresence>
      <motion.ul
        v-if="isOpen"
        :initial="{ opacity: 0, y: -6, scale: 0.98 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, y: -6, scale: 0.98 }"
        :transition="{ duration: 0.15 }"
        class="absolute left-0 mt-2 w-40 rounded border border-gray-200 bg-white shadow-md py-1 list-none z-50"
      >
        <li v-for="(item, index) in props.items" :key="item.link || index">
          <a
            :href="item.link"
            @click="closeMenu"
            class="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            {{ item.name }}
          </a>
        </li>
      </motion.ul>
    </AnimatePresence>
  </div>
</template>