<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-btn @click="generateIdentifier"> generate identifier </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-snackbar v-model="snackbar" :color="snackbarColor">
        {{ snackbarText }}

        <template v-slot:action="{ attrs }">
          <v-btn color="pink" text v-bind="attrs" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "GenerateIdentifier",
  data() {
    return {
      snackbarColor: "primary",
      snackbar: false,
      snackbarText: "",
    };
  },
  methods: {
    async generateIdentifier() {
      // DID用の鍵ペアを作成
      await API.post("api", `/identifier`, {
        body: {
          expiresIn: 864000,
        },
      });
      this.snackbarColor = "success";
      this.snackbarText = "successed generate privatekey";
      this.snackbar = true;
    },
  },
});
</script>