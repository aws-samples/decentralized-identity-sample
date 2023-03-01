<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">IdentifierにAttributeの関連付け</p>
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
          v-model="setAttribute_identifier"
          label="identifier"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="3">
        <v-text-field
          v-model="setAttribute_path"
          label="path"
          placeholder="did/srv/xxxService"
        >
        </v-text-field>
      </v-col>

      <v-col cols="3">
        <v-text-field
          v-model="setAttribute_param"
          label="param"
          placeholder="https://..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="3">
        <v-text-field
          v-model="setAttribute_expiresIn"
          type="number"
          placeholder="86400"
        >
        </v-text-field>
      </v-col>

      <v-col cols="6">
        <v-btn @click="setAttribute" color="primary"> set_Attribute </v-btn>
      </v-col>
      <v-col cols="6">
        <v-btn @click="revokeAttribute" color="error"> revoke_Attribute </v-btn>
      </v-col>
      <v-col cols="12">
        <p class="text-left">
          {{ attribute_info }}
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "AttributeDID",
  props: [],
  data() {
    return {
      list_address: [],
      selected_address: "",
      setAttribute_identifier: "0xD9bB04cF7147cBcdc03052DF5dA64af400d710b1",
      setAttribute_path: "did/svc/example",
      setAttribute_param: "https://example.com",
      setAttribute_expiresIn: "86400",
      attribute_info: "",
    };
  },
  methods: {
    async setAttribute() {
      try {
        this.attribute_info = this.delegate_info = await API.post(
          "api",
          `/attribute`,
          {
            body: {
              identifier: this.setAttribute_identifier,
              signerAddress: this.selected_address,
              attribute_path: this.setAttribute_path,
              attribute_param: this.setAttribute_param,
              attribute_expiresIn: this.setAttribute_expiresIn,
            },
          }
        );
      } catch (error) {
        console.log(error);
        this.attribute_info = error;
      }
    },
    async revokeAttribute() {
      try {
        this.attribute_info = this.delegate_info = await API.del(
          "api",
          `/attribute`,
          {
            body: {
              identifier: this.setAttribute_identifier,
              signerAddress: this.selected_address,
              attribute_path: this.setAttribute_path,
              attribute_param: this.setAttribute_param,
            },
          }
        );
      } catch (error) {
        console.log(error);
        this.attribute_info = error;
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

<style></style>
