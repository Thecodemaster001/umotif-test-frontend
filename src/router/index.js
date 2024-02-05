import { createRouter, createWebHistory } from "vue-router";

export const routes = [
  {
    path: "/",
    name: "screeningForm",
    component: () => import("../components/TheScreeningForm.vue"),
  },
  {
    path: "/results",
    name: "results",
    component: () => import("../components/TheResults.vue"),
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export function createAppRouter(history = createWebHistory()) {
  return createRouter({ history, routes });
}

export default createAppRouter();
