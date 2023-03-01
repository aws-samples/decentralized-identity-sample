<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">Delegate</p>
        <p>veriKey: jwtの電子署名で使う</p>
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="identifier"
          label="identifier"
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
      <v-col cols="3">
        <v-text-field
          v-model="delegate_address"
          placeholder="0x..."
          label="delegate address"
        >
        </v-text-field>
      </v-col>
      <v-col cols="3">
        <v-select
          :items="['veriKey', 'sigAuth']"
          v-model="delegate_type"
          label="type"
        ></v-select>
      </v-col>
      <v-col cols="3">
        <v-text-field
          v-model="delegate_expiresIn"
          type="number"
          placeholder="86400"
        >
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-btn @click="addDelegate" color="primary"> add_Delegate </v-btn>
      </v-col>
      <v-col cols="6">
        <v-btn @click="revokeDelegate" color="error"> revoke_Delegate </v-btn>
      </v-col>
      <v-col cols="12">
        <p class="text-left">
          {{ delegate_info }}
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "DelegateDID",
  props: [],
  data() {
    return {
      identifier: "",
      list_address: [],
      selected_address: "",
      delegate_address: "",
      delegate_type: "",
      delegate_expiresIn: 0,
      delegate_info: "",
    };
  },
  methods: {
    async addDelegate() {
      try {
        this.delegate_info = await API.post("api", `/delegate`, {
          body: {
            identifier: this.identifier,
            signerAddress: this.selected_address,
            delegate_address: this.delegate_address,
            delegate_type: this.delegate_type,
            delegate_expiresIn: this.delegate_expiresIn,
          },
        });
      } catch (error) {
        console.log(error);
        this.delegate_info = error;
      }
    },
    async revokeDelegate() {
      try {
        this.delegate_info = await API.del("api", `/delegate`, {
          body: {
            identifier: this.identifier,
            signerAddress: this.selected_address,
            delegate_address: this.delegate_address,
            delegate_type: this.delegate_type,
          },
        });
      } catch (error) {
        console.log(error);
        this.delegate_info = error;
      }
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