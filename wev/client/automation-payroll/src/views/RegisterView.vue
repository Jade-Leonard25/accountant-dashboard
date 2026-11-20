<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import axios from "axios";
import {
  AUTH_TOKEN_KEY,
  authBaseURL,
  authClient,
} from "../libs/auth-client";
import { createNumericSId, isValidNumericSId } from "../libs/idGenerator";
import LoginImage from "../assets/login.jpeg";

const router = useRouter();

const RegisterSchema = z
  .object({
    id: z.string().refine(isValidNumericSId, {
      message: "Invalid registration ID",
    }),
    name: z.string().trim().min(1, { message: "Name is required" }),
    role: z.enum(["admin", "employee"]),
    email: z
      .string()
      .trim()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string().optional(),
    image: z
      .string()
      .trim()
      .url({ message: "Enter a valid image URL" })
      .or(z.literal("")),
  })
  .refine(
    (values) =>
      !values.confirmPassword || values.password === values.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Passwords do not match",
    },
  );

type RegisterForm = z.infer<typeof RegisterSchema>;

const data = ref<RegisterForm>({
  id: createNumericSId(),
  name: "",
  role: "admin",
  email: "",
  password: "",
  confirmPassword: "",
  image: "",
});

const errors = ref<Partial<Record<keyof RegisterForm, string>>>({});
const formError = ref<string | null>(null);
const submitting = ref(false);

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;

  const key = target.name as keyof RegisterForm;
  if (key === "role") {
    if (target.value === "admin" || target.value === "employee") {
      data.value.role = target.value;
      formError.value = null;
    }
    return;
  }

  if (
    key === "name" ||
    key === "email" ||
    key === "password" ||
    key === "confirmPassword" ||
    key === "image"
  ) {
    data.value[key] = target.value;
    errors.value[key] = undefined;
    formError.value = null;
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
    const accountResponse = await axios.post(
      `${authBaseURL}/admin`,
      {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role,
        ...(parsed.data.image ? { image: parsed.data.image } : {}),
      },
      { withCredentials: true },
    );

    const token =
      accountResponse.headers["set-auth-token"] ||
      accountResponse.data?.token ||
      accountResponse.data?.session?.token;
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    const sessionResult = await authClient.getSession();
    const signedInRole = (
      sessionResult.data?.user as { role?: string } | undefined
    )?.role;
    if (
      sessionResult.error ||
      !sessionResult.data?.user ||
      signedInRole !== parsed.data.role
    ) {
      formError.value =
        "Your account was created, but its selected role could not be verified. Please sign in or contact support.";
      return;
    }

    await router.replace("/");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      formError.value =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Could not create account. Please try again.";
    } else {
      formError.value = "Something went wrong. Please try again.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-slate-50">
    <div class="relative min-h-65 md:min-h-screen overflow-hidden bg-blue-950">
      <img
        :src="LoginImage"
        alt="Automation Payroll"
        class="h-full w-full object-cover"
      />
      <div
        class="absolute inset-0 bg-linear-to-br from-blue-600/35 via-indigo-700/30 to-slate-900/55"
      />
    </div>

    <v-card
      class="min-h-screen flex flex-col justify-start px-6 py-8 sm:px-12 lg:px-16 bg-white overflow-y-auto md:justify-center"
    >
      <div class="my-auto w-full max-w-lg mx-auto">
        <div class="mb-6">
          <p
            class="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5"
          >
            Automation Payroll
          </p>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Create administrator account
          </h1>
          <p class="mt-1.5 text-sm text-slate-500">
            Enter your details to get started.
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
          <div
            v-if="formError"
            role="alert"
            class="rounded-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {{ formError }}
          </div>

          <div>
            <label
              for="name"
              class="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Full name <span class="text-red-700">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autocomplete="name"
              placeholder="Enter your full name"
              :value="data.name"
              @input="handleInput"
              :aria-invalid="Boolean(errors.name)"
              class="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <p
              v-if="errors.name"
              class="mt-1.5 text-xs font-medium text-red-600"
            >
              {{ errors.name }}
            </p>
          </div>

          <div>
            <label
              for="role"
              class="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Account type
            </label>
            <select
              id="role"
              name="role"
              :value="data.role"
              @change="handleInput"
              class="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Email address <span class="text-red-700">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="name@company.com"
              :value="data.email"
              @input="handleInput"
              :aria-invalid="Boolean(errors.email)"
              class="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <p
              v-if="errors.email"
              class="mt-1.5 text-xs font-medium text-red-600"
            >
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Password <span class="text-red-700">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="new-password"
              placeholder="At least 8 characters"
              :value="data.password"
              @input="handleInput"
              :aria-invalid="Boolean(errors.password)"
              class="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <p
              v-if="errors.password"
              class="mt-1.5 text-xs font-medium text-red-600"
            >
              {{ errors.password }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Confirm password
                <span class="text-xs font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="Re-enter password"
                :value="data.confirmPassword"
                @input="handleInput"
                :aria-invalid="Boolean(errors.confirmPassword)"
                class="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <p
                v-if="errors.confirmPassword"
                class="mt-1.5 text-xs font-medium text-red-600"
              >
                {{ errors.confirmPassword }}
              </p>
            </div>

            <div>
              <label
                for="image"
                class="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Profile image URL
                <span class="text-xs font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="image"
                name="image"
                type="url"
                autocomplete="url"
                placeholder="https://..."
                :value="data.image"
                @input="handleInput"
                :aria-invalid="Boolean(errors.image)"
                class="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <p
                v-if="errors.image"
                class="mt-1.5 text-xs font-medium text-red-600"
              >
                {{ errors.image }}
              </p>
            </div>
          </div>

          <v-btn
            type="submit"
            :disabled="submitting"
            class="w-full bg-black text-gray-200 hover:bg-gray-200 hover:text-black"
          >
            {{ submitting ? "Creating account..." : "Create account" }}
          </v-btn>
        </form>

        <p class="mt-5 text-center text-sm text-slate-500">
          Already registered?
          <button
            type="button"
            class="font-medium text-blue-700 hover:text-blue-900"
            @click="router.push('/login')"
          >
            Sign in
          </button>
        </p>
      </div>
    </v-card>
  </div>
</template>
