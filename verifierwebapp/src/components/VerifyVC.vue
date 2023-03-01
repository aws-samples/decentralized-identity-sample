<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">Verifiable Credentialの検証</p>
      </v-col>
      <v-col cols="6">
        <v-textarea v-model="vc" placeholder="verifiable credential">
        </v-textarea>
      </v-col>
      <v-col cols="6">
        <v-btn @click="verifyVC" color="primary"> verify_VC </v-btn>
      </v-col>
      <v-col cols="12">
        <p class="text-left">
          {{ verify_result }}
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "VerifyVC",
  props: [],
  data() {
    return {
      vc: "",
      verify_result: "",
    };
  },
  methods: {
    async verifyVC() {
      // jwtの検証
      try {
        const res = await API.post("api", `/vc/verify`, {
          body: JSON.parse(this.vc),
        });
        this.verify_result = res;
      } catch (error) {
        console.error("verify error ", error);
        this.verify_result = error;
      }
    },
  },
});
</script>

<style>
</style>