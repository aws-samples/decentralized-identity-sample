<template>
  <v-container>
    <v-col cols="12">
      <p class="text-h4">Verifiable Credentialの保管とアクセスコントロール</p>
    </v-col>
    <GenerateIdentifier />
    <GetIdentifier />
    <ListVC />
    <UploadVC />
    <Attribute />
    <DelegateDID />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import GenerateIdentifier from "../components/GenerateIdentifier.vue";
import GetIdentifier from "../components/GetIdentifier.vue";
import UploadVC from "../components/UploadVC.vue";
import ListVC from "../components/ListVC.vue";
import Attribute from "../components/AttributeDID.vue";
import DelegateDID from "../components/DelegateDID.vue";

export default defineComponent({
  name: "HolderView",

  components: {
    GenerateIdentifier,
    GetIdentifier,
    UploadVC,
    ListVC,
    Attribute,
    DelegateDID,
  },
  data() {
    return {};
  },
});
</script>
