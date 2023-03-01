<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">DIDの所有者を確認</p>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="lookup_identifier"
          label="identifier"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-btn @click="lookupOwner" color="primary"> lookup_Owner </v-btn>
      </v-col>
      <v-col cols="6">
        <p class="text-left">
          {{ owner_info }}
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "CheckDIDOwner",
  props: [],
  data() {
    return {
      lookup_identifier: "",
      owner_info: "",
    };
  },
  methods: {
    async lookupOwner() {
      this.owner_info = await API.get("api", `/owner`, {
        queryStringParameters: {
          identifier: this.lookup_identifier,
        },
      });
    },
  },
});
</script>

<style>
</style>