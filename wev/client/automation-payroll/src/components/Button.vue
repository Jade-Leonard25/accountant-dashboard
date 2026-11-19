<script lang="ts">
import { z } from "zod";

// Zod schema for runtime validation (e.g., CMS/API-driven button configs or strict dev checks)
export const buttonPropsSchema = z.object({
  variant: z.enum(["primary", "secondary", "danger", "outline"]).default("primary"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  disabled: z.boolean().default(false),
  loading: z.boolean().default(false),
});
</script>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../libs/libs.ts";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition duration-500 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-black  text-white hover:bg-gray-900 focus-visible:ring-blue-500",
        secondary: "bg-slate-600 text-white hover:bg-slate-700 focus-visible:ring-slate-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

const props = withDefaults(
  defineProps<{
    variant?: NonNullable<ButtonVariantProps["variant"]>;
    size?: NonNullable<ButtonVariantProps["size"]>;
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    variant: "primary",
    size: "md",
    disabled: false,
    loading: false,
  }
);

const attrs = useAttrs();

const parsedProps = computed(() => {
  const result = buttonPropsSchema.safeParse({
    variant: props.variant,
    size: props.size,
    disabled: props.disabled,
    loading: props.loading,
  });

  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn("[Button] Invalid props:", result.error.flatten().fieldErrors);
    }
    return {
      variant: "primary" as const,
      size: "md" as const,
      disabled: Boolean(props.disabled),
      loading: Boolean(props.loading),
    };
  }

  return result.data;
});

const classes = computed(() =>
  cn(
    buttonVariants({
      variant: parsedProps.value.variant,
      size: parsedProps.value.size,
    }),
    attrs.class as string | string[] | Record<string, boolean> | undefined
  )
);
</script>

<template>
  <button
    :class="classes"
    :disabled="parsedProps.disabled || parsedProps.loading"
    v-bind="$attrs"
  >
    <span
      v-if="parsedProps.loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
    <slot />
  </button>
</template>
