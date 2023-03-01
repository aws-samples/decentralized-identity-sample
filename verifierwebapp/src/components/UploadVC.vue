<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h5">Verifiable Credentialのアップロード</p>
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="fileName"
          label="fileName"
          placeholder="xxx.json"
        >
        </v-text-field>
      </v-col>

      <v-col cols="12">
        <v-textarea
          placeholder="Verifiable Credentialを入力"
          v-model="verifiableCredential"
          rows="40"
        />
      </v-col>
      <v-col cols="6">
        <v-btn @click="upload_vc" color="primary">
          Verifiable Credentialを自分のS3にアップロード
        </v-btn>
      </v-col>
      <v-col cols="12">
        <p class="text-left">
          {{ upload_info }}
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";

export default defineComponent({
  name: "UploadVC",
  props: [],
  data() {
    return {
      fileName: "testFileName.json",
      verifiableCredential: "",
      upload_info: "",
    };
  },
  methods: {
    async upload_vc() {
      // メッセージを初期化
      this.upload_info = "";

      // VCをアップロード
      const res = await API.put("api", `/vc/${this.fileName}`, {
        body: JSON.parse(this.verifiableCredential),
      });
      this.upload_info = "upload success";
    },
  },
});
</script>

<style>
</style>