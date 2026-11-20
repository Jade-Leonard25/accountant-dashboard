import { createRouter, createWebHashHistory } from "vue-router";
import { authClient } from "../libs/auth-client"; // adjust path if needed
import Dashboard from "../views/dashboard/Dashboard.vue";
import Login from "../views/Login.vue";
import RegisterView from "../views/RegisterView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: Dashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { guestOnly: true },
    },
  ],
});

router.beforeEach(async (to) => {
  let session = null;

  try {
    const res = await authClient.getSession();
    session = res?.data ?? null;
  } catch (err) {
    console.error("Session check failed in router guard:", err);
  }

  const isAuthenticated = Boolean(session?.user);

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { path: "/register", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { path: "/" };
  }

  return true;
});