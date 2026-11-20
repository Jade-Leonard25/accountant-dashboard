<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { z } from "zod";
import { signOut, useSession } from "../../libs/auth-client";
import { AUTH_TOKEN_KEY as AUTH_TOKEN_STORAGE_KEY, authBaseURL } from "../../libs/auth-client";

const router = useRouter();

const sessionState = useSession();
const session = computed(() => sessionState.value.data);
const isPending = computed(() => sessionState.value.isPending);
const error = computed(() => sessionState.value.error);

const user = computed(() => session.value?.user ?? null);
const userRole = computed(() => {
  const rawRole = (user.value as { role?: string } | null)?.role;
  return rawRole ?? "employee";
});

const companyForm = ref({
  name: "",
  legalName: "",
  address: "",
  contactNumber: "",
  email: "",
  companyLogo: "",
  taxId: "",
  rdoCode: "",
  employerSSS: "",
  employerPhilHealth: "",
  employerPagIbig: "",
  compTaxReduct: "",
  compPermit: "",
});
const companySchema = z.object({
  name: z.string().trim(),
  legalName: z.string().trim(),
  address: z.string().trim(),
  contactNumber: z.string().trim(),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid company email")]),
  companyLogo: z.string().trim(),
  taxId: z.string().trim(),
  rdoCode: z.string().trim(),
  employerSSS: z.string().trim(),
  employerPhilHealth: z.string().trim(),
  employerPagIbig: z.string().trim(),
  compTaxReduct: z.string().trim().refine(
    (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
    "Enter a valid non-negative tax reduction",
  ),
  compPermit: z.string().trim(),
});
const creatingCompany = ref(false);
const companyError = ref("");
const companySuccess = ref("");

const mainInput = ref("");
const rules = [(v: string) => !!v || "This field is required"];
const signingOut = ref(false);

async function createCompany() {
  companyError.value = "";
  companySuccess.value = "";

  if (userRole.value !== "admin") {
    companyError.value = "Only administrator accounts can create companies.";
    return;
  }

  const parsed = companySchema.safeParse(companyForm.value);
  if (!parsed.success) {
    companyError.value = parsed.error.issues[0]?.message ?? "Check the company details.";
    return;
  }

  const currentUser = user.value;
  if (!currentUser) {
    companyError.value = "Your session has expired. Please sign in again.";
    await router.replace("/login");
    return;
  }

  creatingCompany.value = true;
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    await axios.post(
      `${authBaseURL}/api/companies`,
      {
        adminId: currentUser.id,
        ...parsed.data,
        name: parsed.data.name,
        companyLogo: parsed.data.companyLogo,
        taxId: parsed.data.taxId,
        compTaxReduct: parsed.data.compTaxReduct === "" ? 0 : Number(parsed.data.compTaxReduct),
      },
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );

    companySuccess.value = "Company created successfully.";
    companyForm.value = {
      name: "",
      legalName: "",
      address: "",
      contactNumber: "",
      email: "",
      companyLogo: "",
      taxId: "",
      rdoCode: "",
      employerSSS: "",
      employerPhilHealth: "",
      employerPagIbig: "",
      compTaxReduct: "",
      compPermit: "",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      companyError.value =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Could not create company. Please check the details and try again.";
    } else {
      companyError.value = "Something went wrong while creating the company.";
    }
  } finally {
    creatingCompany.value = false;
  }
}

async function handleSignOut() {
  if (signingOut.value) return;
  signingOut.value = true;
  try {
    await signOut();
  } finally {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    signingOut.value = false;
    await router.replace("/login");
  }
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center py-2 px-4">
    <div v-if="signingOut" class="text-sm text-gray-700">
      Signing out...
    </div>

    <div v-else-if="isPending" class="text-sm text-gray-700">
      Checking credentials...
    </div>

    <div
      v-else-if="error"
      class="rounded bg-red-100 text-red-800 px-4 py-3 text-sm"
    >
      Failed to load session credentials.
    </div>

    <v-card v-else-if="user" class="w-full max-w-lg">
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <p class="text-sm font-semibold text-gray-900">
              {{ user.name || user.email }}
            </p>
            <p class="text-xs text-gray-500">
              {{ user.email }} · Role:
              <span class="font-medium uppercase">{{ userRole }}</span>
            </p>
          </div>

          <v-btn
            size="small"
            variant="tonal"
            color="error"
            :disabled="signingOut"
            :loading="signingOut"
            @click="handleSignOut"
            class="bg-black text-gray-200 p-2"
          >
            {{ signingOut ? "Signing out..." : "Sign Out" }}
          </v-btn>
        </div>

        <div v-if="userRole === 'admin' || userRole === 'hr'" class="space-y-2">
          <p class="text-xs font-medium text-gray-600">
            Payroll Management Controls ({{ userRole }})
          </p>
          <v-text-field
            v-model="mainInput"
            :rules="rules"
            label="Main input"
            density="comfortable"
          />
        </div>

        <form
          v-if="userRole === 'admin'"
          class="space-y-3 border-t pt-4"
          @submit.prevent="createCompany"
          novalidate
        >
          <div>
            <h2 class="text-sm font-semibold text-gray-900">Company setup</h2>
            <p class="mt-1 text-xs text-gray-600">
              Add company details for your payroll workspace. Fields are optional.
            </p>
          </div>

          <p v-if="companyError" role="alert" class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ companyError }}
          </p>
          <p v-if="companySuccess" role="status" class="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            {{ companySuccess }}
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <v-text-field v-model="companyForm.name" label="Company name" density="compact" />
            <v-text-field v-model="companyForm.legalName" label="Legal name" density="compact" />
            <v-text-field v-model="companyForm.address" label="Address" density="compact" />
            <v-text-field v-model="companyForm.contactNumber" label="Contact number" density="compact" />
            <v-text-field v-model="companyForm.email" label="Company email" type="email" density="compact" />
            <v-text-field v-model="companyForm.companyLogo" label="Logo URL" type="url" density="compact" />
            <v-text-field v-model="companyForm.taxId" label="Tax ID" density="compact" />
            <v-text-field v-model="companyForm.rdoCode" label="RDO code" density="compact" />
            <v-text-field v-model="companyForm.employerSSS" label="Employer SSS" density="compact" />
            <v-text-field v-model="companyForm.employerPhilHealth" label="Employer PhilHealth" density="compact" />
            <v-text-field v-model="companyForm.employerPagIbig" label="Employer Pag-IBIG" density="compact" />
            <v-text-field v-model="companyForm.compTaxReduct" label="Tax reduction" type="number" min="0" step="0.01" density="compact" />
            <v-text-field v-model="companyForm.compPermit" label="Company permit" density="compact" />
          </div>

          <v-btn type="submit" :loading="creatingCompany" :disabled="creatingCompany">
            {{ creatingCompany ? "Creating company..." : "Create company" }}
          </v-btn>
        </form>

        <div v-else class="text-sm text-gray-700">
          Standard employee view — contact HR or Admin for payroll run edits.
        </div>
      </div>
    </v-card>

    <div v-else class="text-sm text-gray-600">
      Redirecting to sign in...
    </div>
  </div>
</template>