<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">DIDの所有者変更</p>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="new_owner_identifier"
          label="identifier"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="new_owner_address"
          label="new owner address"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="12">
        <v-select
          :items="list_address"
          v-model="selected_address"
          label="public address of TxSigner"
        ></v-select>
      </v-col>
      <v-col cols="6">
        <v-btn @click="changeOwner" color="primary"> change_Owner </v-btn>
      </v-col>
      <v-col cols="12">
        <p class="text-left">
          {{ change_owner_info }}
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "ChangeDIDOwner",
  props: [],
  data() {
    return {
      list_address: [],
      selected_address: "",
      new_owner_identifier: "",
      new_owner_address: "",
      change_owner_info: "",
    };
  },
  methods: {
    async changeOwner() {
      this.owner_info = await API.post("api", `/owner`, {
        body: {
          signerAddress: this.selected_address,
          identifier: this.new_owner_identifier,
          new_owner_address: this.new_owner_address,
        },
      });
    },
    async getIdentifiers() {
      // DID用の鍵ペアを作成
      const res = await API.get("api", `/identifier`, {});
      return res;
    },
  },
  async created() {
    const identifier = await this.getIdentifiers();
    console.log("identifier", identifier);
    this.list_address = [];
    for (let index = 0; index < identifier.length; index++) {
      this.list_address.push(identifier[index].address.S);
    }
  },
});
</script>

<style>
</style>