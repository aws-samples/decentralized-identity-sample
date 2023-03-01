import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { Auth } from "aws-amplify";

import SignIn from "../views/SignIn.vue";
import HomeView from "../views/HomeView.vue";
import HolderView from "../views/HolderView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/signin",
    name: "SignIn",
    component: SignIn,
  },
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: {
      auth: true,
    },
  },
  {
    path: "/holder",
    name: "holder",
    component: HolderView,
    meta: {
      auth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some((r) => r.meta.auth)) {
    try {
      const currentSession = await Auth.currentSession();

      if (currentSession) {
        next();
      } else {
        next({ path: "/signin" });
      }
    } catch (e) {
      next({ path: "signin" });
    }
  } else {
    next();
  }
});

export default router;
