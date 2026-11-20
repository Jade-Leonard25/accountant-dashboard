<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { z } from "zod";
import axios from "axios";
import LoginImage from "../assets/login.jpeg";
import { AUTH_TOKEN_KEY, authBaseURL, authClient } from "../libs/auth-client";

const router = useRouter();
const route = useRoute();

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginForm = z.infer<typeof LoginSchema>;

const data = ref<LoginForm>({
  email: "",
  password: "",
});

const loginType = ref<"employee" | "admin">("employee");
const errors = ref<Partial<Record<keyof LoginForm, string>>>({});
const formError = ref<string | null>(null);
const submitting = ref(false);

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement | null;
  if (!target) return;

  const key = target.name as keyof LoginForm;
  if (key === "email" || key === "password") {
    data.value[key] = target.value;
    if (errors.value[key]) {
      errors.value[key] = undefined;
    }
    if (formError.value) {
      formError.value = null;
    }
  }
}

function getSafeRedirectTarget(): string {
  const rawRedirect = route.query.redirect;
  if (typeof rawRedirect === "string" && rawRedirect.startsWith("/")) {
    return rawRedirect;
  }
  return "/";
}

async function handleSubmit() {
  errors.value = {};
  formError.value = null;

  const parsed = LoginSchema.safeParse(data.value);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof LoginForm | undefined;
      if (field && !errors.value[field]) {
        errors.value[field] = issue.message;
      }
    }
    return;
  }

  submitting.value = true;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    const signInResponse = await axios.post(
      `${authBaseURL}/api/auth/sign-in/email`,
      parsed.data,
      { withCredentials: true },
    );

    const token =
      signInResponse.headers["set-auth-token"] ||
      signInResponse.data?.token ||
      signInResponse.data?.session?.token;
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    const sessionResult = await authClient.getSession();
    if (sessionResult.error || !sessionResult.data?.user) {
      formError.value =
        "Credentials were accepted, but no session was returned. Check that the backend Worker with bearer-token support is deployed.";
      return;
    }

    await router.replace(getSafeRedirectTarget());
  } catch (err) {
    if (axios.isAxiosError(err)) {
      formError.value =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid email or password.";
    } else {
      console.error("Sign-in failed:", err);
      formError.value = "Something went wrong. Please try again.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-slate-50">
    <!-- Left: Sharp Image with Tinted Glass Color Wash -->
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

    <!-- Right: Formal Login Form -->
    <v-card
      class="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-white"
    >
      <div class="w-full max-w-sm mx-auto">
        <div class="mb-8">
          <p
            class="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5"
          >
            Automation Payroll
          </p>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Sign in
          </h1>
          <p class="mt-1.5 text-sm text-slate-500">
            Sign in to your {{ loginType }} account.
          </p>
        </div>

        <div
          class="mb-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1"
          role="tablist"
          aria-label="Account type"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="loginType === 'employee'"
            class="rounded-md px-3 py-2 text-sm font-medium transition"
            :class="loginType === 'employee' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            @click="loginType = 'employee'; formError = null"
          >
            Employee
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="loginType === 'admin'"
            class="rounded-md px-3 py-2 text-sm font-medium transition"
            :class="loginType === 'admin' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            @click="loginType = 'admin'; formError = null"
          >
            Admin
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
          <div
            v-if="formError"
            role="alert"
            class="rounded-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {{ formError }}
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Work Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="name@company.com"
              :value="data.email"
              @input="handleInput"
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
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              :value="data.password"
              @input="handleInput"
              class="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <p
              v-if="errors.password"
              class="mt-1.5 text-xs font-medium text-red-600"
            >
              {{ errors.password }}
            </p>
          </div>

          <v-btn
            type="submit"
            :disabled="submitting"
            class="w-full bg-black text-gray-200 hover:bg-gray-200 hover:text-black"
          >
            {{ submitting ? "Signing in..." : "Sign in" }}
          </v-btn>
        </form>
           <div class="p-2">
            <span class="p-2">
            Don't have account? create one <a href="/register" class="text-blue-400 cursor-pointer hover:text-blue-600 hover:shadowq-md">now</a>
           </span>
           </div>
      </div>
    </v-card>
  </div>
</template>