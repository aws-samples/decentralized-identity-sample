<template>
  <v-container>
    <IssueVC />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import IssueVC from "../components/IssureVC.vue";

export default defineComponent({
  name: "IssueView",

  components: {
    IssueVC,
  },
  data() {
    return {};
  },
});
</script>
