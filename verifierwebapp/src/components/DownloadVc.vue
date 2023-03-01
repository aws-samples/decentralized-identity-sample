<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">Verifiable Credentialのダウンロード</p>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="identifier"
          label="Identifier that issues JWT"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="svcName"
          label="service name"
          placeholder="0x..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="12">
        <v-text-field v-model="jwt" label="JWT" placeholder="ey....">
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-btn @click="GET_VC" color="primary"> GET </v-btn>
      </v-col>
      <v-col cols="9">
        <v-textarea v-model="vc_contents" label="result"> </v-textarea>
      </v-col>
      <v-col cols="3">
        <v-btn @click="download_vc" color="primary"> download </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
//import { API } from 'aws-amplify';

export default defineComponent({
  name: "DownloadVc",
  props: [],
  data() {
    return {
      svcName: "test2",
      identifier:
        "0x0333a5b1f233f5963b27f6d6d23e27831c4566dfeeba8ee76d34dbef787d4deabf",
      jwt: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE2NzM4NjA3OTAsImlzcyI6ImRpZDpldGhyOjB4NToweDAzMzNhNWIxZjIzM2Y1OTYzYjI3ZjZkNmQyM2UyNzgzMWM0NTY2ZGZlZWJhOGVlNzZkMzRkYmVmNzg3ZDRkZWFiZiJ9.61Ep5lzEM1lZYrs_rkg2YXeTIeAbTPoJDR-KmWyt5tPKjZ8lYxMS-w6t0FHH0lI257COHVuKzDeuhR6DL0cIUQA",
      vc_json: "",
      vc_contents: "",
    };
  },
  methods: {
    async GET_VC() {
      // S3の署名付きURLを取得。jwtが正しければ取得可能
      const query = new URLSearchParams({
        identifier: this.identifier,
        svcName: this.svcName,
      });
      const res = await fetch(
        `https://yw627e1np3.execute-api.ap-northeast-1.amazonaws.com/prod//download?${query}`,
        {
          method: "GET",
          headers: {
            Authorization: this.jwt,
          },
        }
      );
      const response_json = await res.json();
      console.log(response_json.downloadUrl);

      // 署名付きURLを使ってVerifiable Credentialのダウンロード
      const res_vc = await fetch(response_json.downloadUrl, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.vc_json = await res_vc.json();
      this.vc_contents = JSON.stringify(this.vc_json, null, "  ");
    },
    // VCをダウンロードする
    async download_vc() {
      const blob = new Blob([JSON.stringify(this.vc_json)], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.download = this.svcName + ".json";
      a.href = url;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  },
});
</script>

<style>
</style>