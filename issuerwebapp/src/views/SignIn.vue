<template>
  <authenticator :login-mechanisms="['username', 'email']">
    <template v-slot="{ user, signOut }">
      <v-container>
        <h1>Hello {{ user.username }}!</h1>
        <v-btn @click="signOut">Sign Out</v-btn>
      </v-container>
    </template>
  </authenticator>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

// Components

export default defineComponent({
  name: "SignIn",

  setup() {
    const auth = ref(useAuthenticator());
    return {
      auth,
    };
  },
  components: {
    Authenticator,
  },
  data() {
    return {};
  },
});
</script>
