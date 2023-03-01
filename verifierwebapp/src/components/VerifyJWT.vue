<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">JWT検証</p>
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="jwt_identifier"
          label="Identifier that issues JWT"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-textarea v-model="jwt_verification" placeholder="jwt_verification">
        </v-textarea>
      </v-col>
      <v-col cols="6">
        <v-btn @click="verifyJWT" color="primary"> verify_JWT </v-btn>
      </v-col>
      <v-col cols="12">
        <p class="text-left">
          {{ jwt_verify_message }}
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "VerifyJWT",
  props: [],
  data() {
    return {
      jwt_identifier: "0xD9bB04cF7147cBcdc03052DF5dA64af400d710b1",
      jwt_verification: "",
      jwt_verify_message: "",
    };
  },
  methods: {
    async verifyJWT() {
      // jwtの検証
      try {
        const verifiedResult = await API.post("api", `/jwt`, {
          body: {
            identifier: this.jwt_identifier,
            jwt: this.jwt_verification,
          },
        });
        this.jwt_verify_message = verifiedResult;
      } catch (error) {
        console.error("unable to verify JWT: ", error);
        this.jwt_verify_message = error;
      }
    },
  },
});
</script>

<style>
</style>