<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p class="text-h4">Select Keypair</p>
      </v-col>
      <v-col cols="9">
        <v-select
          :items="list_keypair"
          v-model="selected_keypair"
          label="public address"
        ></v-select>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { defineComponent } from "vue";

export default defineComponent({
  name: "SelectKeyPair",

  data() {
    return {
      selected_keypair: "",
      list_keypair: [],
    };
  },
  created() {
    let keypairs = localStorage.getItem("keypairs");
    if (keypairs) {
      // keypairsからaddressをキーに持つ値をリスト形式に変換する
      this.list_keypair = JSON.parse(keypairs).map((obj: any) => obj.address);
    }
  },
});
</script>
