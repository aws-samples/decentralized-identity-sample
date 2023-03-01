import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { Auth } from 'aws-amplify';

import SignIn from '../views/SignIn.vue';
import IssueView from '../views/IssueView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/signin',
    name: 'SignIn',
    component: SignIn,
  },
  {
    path: '/',
    name: 'home',
    component: IssueView,
    meta: {
      auth: true,
    },
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some(r => r.meta.auth)) {
    try {
      const currentSession = await Auth.currentSession();

      if (currentSession) {
        next();
      } else {
        next({ path: '/signin' });
      }
    } catch (e) {
      next({ path: 'signin' });
    }
  } else {
    next();
  }
});


export default router
