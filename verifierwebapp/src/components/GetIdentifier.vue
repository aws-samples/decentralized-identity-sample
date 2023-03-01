<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h5">保存しているIdentifierの一覧</p>
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
            <tr v-for="item in identifiers" :key="item.identifier">
              <td>{{ item.address.S }}</td>
              <td>{{ item.identifier.S }}</td>
              <td>{{ item.publicKey.S }}</td>
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

export default defineComponent({
  name: "GetIdentifier",
  data() {
    return {
      headers: [
        // data tableのヘッダ
        { text: "address" },
        { text: "identifier" },
        { text: "publicKey" },
      ],
      identifiers: [],
    };
  },
  methods: {
    async getIdentifiers() {
      // DID用の鍵ペアを作成
      const res = await API.get("api", `/identifier`, {});
      console.log(res);
      this.identifiers = res;
    },
  },
  created() {
    this.getIdentifiers();
  },
});
</script>