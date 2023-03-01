<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h5">保存しているVerifiable Credentialの一覧</p>
      </v-col>
      <v-col cols="12">
        <v-table>
          <thead>
            <tr>
              <th v-for="item in headers" :key="item.value" class="text-left">
                {{ item.text }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in vc_list" :key="item.Key">
              <td>{{ item.Key }}</td>
              <td>{{ item.LastModified }}</td>
              <td>{{ item.Size }}</td>
              <td>{{ item.Endpoint }}</td>
              <td>
                <v-btn @click="get_vc(item.Key)">DL</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from "vue";
import { API } from "aws-amplify";
import { XMLParser } from "fast-xml-parser";

export default defineComponent({
  name: "ListVC",
  props: [],
  data() {
    return {
      fileName: "testFileName.json",
      verifiableCredential: "",
      upload_info: "",
      headers: [
        // data tableのヘッダ
        { text: "Key" },
        { text: "LastModified" },
        { text: "Size" },
        { text: "Endpoint" },
      ],
      vc_list: [],
    };
  },
  methods: {
    // VCの一覧をS3から取得する
    async list_vc() {
      const res = await API.get("api", `/vc`);

      // XMLをパースする
      const options = {
        ignoreAttributes: false,
        format: true,
      };
      const parser = new XMLParser(options);
      const xmlObj = parser.parse(res);

      // parseしたxmlからコンテンツの一覧を取得
      console.log(xmlObj.ListBucketResult.Contents);
      this.vc_list = [];

      // Contentsが2個以上の場合
      if (Array.isArray(xmlObj.ListBucketResult.Contents)) {
        for (
          let index = 0;
          index < xmlObj.ListBucketResult.Contents.length;
          index++
        ) {
          this.vc_list.push({
            Key: xmlObj.ListBucketResult.Contents[index].Key.split("/")[1],
            LastModified: xmlObj.ListBucketResult.Contents[index].LastModified,
            Size: xmlObj.ListBucketResult.Contents[index].Size,
            Endpoint: `${API.Auth._config.API.endpoints[0].endpoint}/download/${xmlObj.ListBucketResult.Contents.Key}`,
          });
        }
      } else {
        this.vc_list.push({
          Key: xmlObj.ListBucketResult.Contents.Key.split("/")[1],
          LastModified: xmlObj.ListBucketResult.Contents.LastModified,
          Size: xmlObj.ListBucketResult.Contents.Size,
          Endpoint: `${API.Auth._config.API.endpoints[0].endpoint}/download/${xmlObj.ListBucketResult.Contents.Key}`,
        });
      }

      console.log(this.vc_list);
    },
    // VCを取得する
    async get_vc(fileName) {
      const res = await API.get("api", `/vc/${fileName}`);
      console.log(res);

      const blob = new Blob([JSON.stringify(res)], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.download = fileName;
      a.href = url;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  },
  created() {
    this.list_vc();
  },
});
</script>

<style>
</style>