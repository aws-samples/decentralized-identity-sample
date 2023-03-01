<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">Verifiable Credentialの発行</p>
      </v-col>

      <v-col cols="12">
        <v-text-field v-model="id" label="id" placeholder=""> </v-text-field>
      </v-col>

      <v-col cols="12">
        <v-text-field v-model="name" label="name" placeholder="tanaka tarou">
        </v-text-field>
      </v-col>

      <v-col cols="12">
        <v-text-field
          v-model="address"
          label="address"
          placeholder="tokyo chiyoda..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="phoneNumber"
          label="phoneNumber"
          placeholder="090-0000-0000"
        >
        </v-text-field>
      </v-col>

      <v-col cols="6">
        <v-btn @click="issue_vc" color="primary">
          Verifiable Credentialの発行
        </v-btn>
      </v-col>

      <v-col cols="12">
        <v-textarea v-model="verifiableCredential" rows="40" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "IssueVC",
  props: [],
  data() {
    return {
      id: "xxxxxxxx",
      name: "tanaka tarou",
      address: "tokyo chiyoda",
      phoneNumber: "000-0000-0000",
      verifiableCredential: "Verifiable Credentialがここに表示されます",
    };
  },
  methods: {
    async issue_vc() {
      const res = await API.post("api", "/issue", {
        body: {
          id: this.id,
          name: this.name,
          address: this.address,
          phoneNumber: this.phoneNumber,
        },
      });

      console.log(res);
      this.verifiableCredential = JSON.stringify(res, null, " ");
    },
  },
});
</script>

<style>
</style>