<template>
  <v-container>
    <GenerateIdentifier />
    <GetIdentifier />
    <GetDIDDocument />
    <IssueJWT :selected_pubkey="selected_pubkey" />
    <VerifyJWT />
    <CheckDIDOwner />
    <DownloadVc />
    <VerifyVC />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import GenerateIdentifier from "../components/GenerateIdentifier.vue";
import GetIdentifier from "../components/GetIdentifier.vue";
import GetDIDDocument from "../components/GetDIDDocument.vue";
import IssueJWT from "../components/IssueJWT.vue";
import VerifyJWT from "../components/VerifyJWT.vue";
import CheckDIDOwner from "../components/CheckDIDOwner.vue";
import DownloadVc from "../components/DownloadVc.vue";
import VerifyVC from "../components/VerifyVC.vue";

export default defineComponent({
  name: "HomeView",

  components: {
    GenerateIdentifier,
    GetIdentifier,
    //SelectKeyPair,
    GetDIDDocument,
    IssueJWT,
    VerifyJWT,
    CheckDIDOwner,
    DownloadVc,
    VerifyVC,
  },
  data() {
    return {};
  },
});
</script>
