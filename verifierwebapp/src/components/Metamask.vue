
<template>
  <v-container>
    <vue-metamask ref="metamask" :initConnect="false"></vue-metamask>
    <v-row>
      <v-col cols="6">
        <v-btn @click="connect"> Connect Metamask </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import VueMetamask from "vue-metamask";
import { defineComponent } from "vue";

export default defineComponent({
  name: "MetamaskPlugin",
  components: {
    VueMetamask,
  },
  data() {
    return {
      message: "",
    };
  },
});
</script>
