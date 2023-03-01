<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">JWT発行</p>
      </v-col>
      <v-col cols="12">
        <p>
          jwt issue
          PublicKeyにはDIDドキュメントのblockchainAccountId欄に記載のあるpublic
          addressを指定すること
        </p>
      </v-col>
      <v-col cols="12">
        <v-select
          :items="list_address"
          v-model="selected_address"
          label="jwt issuer public address"
        ></v-select>
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="jwt_identifier"
          label="Identifier that issues JWT"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="4">
        <v-btn @click="signJWT" color="primary"> sign_JWT </v-btn>
      </v-col>
      <v-col cols="12">
        <v-textarea v-model="signed_jwt" rows="2" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "IssueJWT",
  props: [],
  data() {
    return {
      list_address: [],
      selected_address: "",
      jwt_identifier: "0xD9bB04cF7147cBcdc03052DF5dA64af400d710b1",
      jwt_message_key: "key",
      jwt_message_value: "value",
      signed_jwt: "",
    };
  },
  async created() {
    const identifier = await this.getIdentifiers();
    console.log("identifier", identifier);
    this.list_address = [];
    for (let index = 0; index < identifier.length; index++) {
      this.list_address.push(identifier[index].address.S);
    }
  },
  methods: {
    async getIdentifiers() {
      // DID用の鍵ペアを作成
      const res = await API.get("api", `/identifier`, {});
      return res;
    },
    async signJWT() {
      try {
        // jwtの作成
        const jwt = await API.get("api", `/jwt`, {
          queryStringParameters: {
            identifier: this.jwt_identifier,
            address: this.selected_address,
          },
        });
        console.log(jwt);
        this.signed_jwt = jwt;
      } catch (error) {
        console.log(error);
        throw new Error(error);
      }
    },
  },
});
</script>

<style>
</style>