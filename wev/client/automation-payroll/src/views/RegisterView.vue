<script setup lang="ts">
import { ref } from "vue";
import { z } from "zod";
import axios from "axios";

const API_BASE_URL = "https://system-payroll-api.automation-payroll.workers.dev";

const RegisterSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Name is required" }),
    email: z
      .string()
      .trim()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid Email" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterForm = z.infer<typeof RegisterSchema>;

const data = ref<RegisterForm>({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const errors = ref<Partial<Record<keyof RegisterForm, string>>>({});
const formError = ref<string | null>(null);
const submitting = ref(false);

const emit = defineEmits<{
  (e: "success"): void;
}>();

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement | null;
  if (!target) return;

  const key = target.name as keyof RegisterForm;
  if (
    key === "name" ||
    key === "email" ||
    key === "password" ||
    key === "confirmPassword"
  ) {
    data.value[key] = target.value;
    if (errors.value[key]) {
      errors.value[key] = undefined;
    }
    if (formError.value) {
      formError.value = null;
    }
  }
}

async function handleSubmit() {
  errors.value = {};
  formError.value = null;

  const parsed = RegisterSchema.safeParse(data.value);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof RegisterForm | undefined;
      if (field && !errors.value[field]) {
        errors.value[field] = issue.message;
      }
    }
    return;
  }

  submitting.value = true;
  try {
    await axios.post(
      `${API_BASE_URL}/api/auth/sign-up/email`,
      {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      { withCredentials: true }
    );
    emit("success");
  } catch (err) {
    if (axios.isAxiosError(err)) {
      formError.value =
        err.response?.data?.message || "Could not create account. Please try again.";
    } else {
      formError.value = "Something went wrong. Please try again.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center py-2 px-4">
    <Card>
      <div class="w-full max-w-sm mx-auto space-y-4">
        <h2 class="text-xl font-bold text-gray-900">Create Account</h2>

        <form @submit.prevent="handleSubmit" class="space-y-3">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full name"
              :value="data.name"
              @input="handleInput"
              class="w-full px-3 py-2 border rounded"
            />
            <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              :value="data.email"
              @input="handleInput"
              class="w-full px-3 py-2 border rounded"
            />
            <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email }}</p>
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              :value="data.password"
              @input="handleInput"
              class="w-full px-3 py-2 border rounded"
            />
            <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password }}</p>
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              :value="data.confirmPassword"
              @input="handleInput"
              class="w-full px-3 py-2 border rounded"
            />
            <p v-if="errors.confirmPassword" class="text-xs text-red-600 mt-1">
              {{ errors.confirmPassword }}
            </p>
          </div>

          <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
          >
            {{ submitting ? "Creating account..." : "Create account" }}
          </button>
        </form>
      </div>
    </Card>
  </div>
</template>
