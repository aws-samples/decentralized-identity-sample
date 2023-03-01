import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { Amplify, Auth } from "aws-amplify";

import "@aws-amplify/ui-vue";
import { loadFonts } from "./plugins/webfontloader";

Amplify.configure({
  API: {
    endpoints: [
      {
        name: "api",
        endpoint: process.env.VUE_APP_API_ENDPOINT,
        custom_header: async () => {
          const currentSession = await Auth.currentSession();
          if (currentSession) {
            return {
              Authorization: `Bearer ${currentSession
                .getIdToken()
                .getJwtToken()}`,
            };
          }
          return {};
        },
      },
    ],
  },
  Auth: {
    region: process.env.VUE_APP_AWS_REGION,
    userPoolId: process.env.VUE_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.VUE_APP_USER_POOL_WEB_CLIENT_ID,
  },
});

loadFonts();

createApp(App).use(router).use(vuetify).mount("#app");
