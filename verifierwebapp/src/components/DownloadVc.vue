<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">Verifiable Credentialのダウンロード</p>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="did_url"
          label="did_url"
          placeholder="did:ethr:0x5:0xD..."
        >
        </v-text-field>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="svcName"
          label="service name"
          placeholder="..."
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
import { API } from 'aws-amplify';

export default defineComponent({
  name: "DownloadVc",
  props: [],
  data() {
    return {
      svcName: "example",
      did_url:
        "did:ethr:0x5:0x03ef6c8d5434daee10f209283b14d2a244837f2881ba467f73a3adcab58f29d7e3",
      jwt: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE2ODQ0NzgwMjYsImlzcyI6ImRpZDpldGhyOjB4NToweDAzZWY2YzhkNTQzNGRhZWUxMGYyMDkyODNiMTRkMmEyNDQ4MzdmMjg4MWJhNDY3ZjczYTNhZGNhYjU4ZjI5ZDdlMyJ9.ybRbG8Twzj50zqog3D5nRaNb6jCF1PKVquRnC3AXuRb-Eq55Wakz-hESezlfgkLVJsUcTJZMe33y4eVnxUx9gwE",
      vc_json: "",
      vc_contents: "",
    };
  },
  methods: {
    async GET_VC() {
      const identifier = this.did_url.split(":").slice(-1)[0]

      // DIDドキュメントを取得
      const didDocument = await API.get("api", `/document`, {
        queryStringParameters: {
          did_url: this.did_url,
        },
      });

      // S3の署名付きURLを取得。jwtが正しければ取得可能
      const query = new URLSearchParams({
        identifier: identifier,
        svcName: this.svcName,
      });

      for (let index = 0; index < didDocument.didDocument.service.length; index++) {
        if (didDocument.didDocument.service[index].type == this.svcName){
          console.log(didDocument.didDocument.service[index].serviceEndpoint)

          const holderEndpoint = `https://${didDocument.didDocument.service[index].serviceEndpoint.split("/").slice(0)[2]}`
          console.log("holderEndpoint: ", holderEndpoint)
          const res = await fetch(
            `${holderEndpoint}/prod//download?${query}`,
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

        }
        
      }
      
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