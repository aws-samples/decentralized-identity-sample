<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">DID Document取得</p>
      </v-col>
      <v-col cols="6">
        <v-text-field v-model="did_url" placeholder="did_url"> </v-text-field>
      </v-col>
      <v-col cols="3">
        <v-btn @click="getDidDocument" color="primary">
          get_Did_Document
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-textarea v-model="did_document" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "GetDIDDocument",
  data() {
    return {
      did_url: "did:ethr:0x5:0xD9bB04cF7147cBcdc03052DF5dA64af400d710b1",
      did_document: "",
    };
  },
  methods: {
    async getDidDocument() {
      console.log("getDidDocument...");

      const didDocument = await API.get("api", `/document`, {
        queryStringParameters: {
          did_url: this.did_url,
        },
      });
      this.did_document = JSON.stringify(didDocument, null, "  ");
    },
  },
});
</script>

<style>
</style>