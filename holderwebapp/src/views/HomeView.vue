<template>
  <v-container>
    <GenerateIdentifier />
    <GetIdentifier />
    <!-- <SelectKeyPair /> -->
    <GetDIDDocument />
    <IssueJWT :selected_pubkey="selected_pubkey" />
    <VerifyJWT />
    <CheckDIDOwner />
    <ChangeDIDOwner />
    <DelegateDID />
    <AttributeDID />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import GenerateIdentifier from "../components/GenerateIdentifier.vue";
import GetIdentifier from "../components/GetIdentifier.vue";
//import SelectKeyPair from '../components/SelectKeyPair.vue';
import GetDIDDocument from "../components/GetDIDDocument.vue";
import IssueJWT from "../components/IssueJWT.vue";
import VerifyJWT from "../components/VerifyJWT.vue";
import CheckDIDOwner from "../components/CheckDIDOwner.vue";
import ChangeDIDOwner from "../components/ChangeDIDOwner.vue";
import DelegateDID from "../components/DelegateDID.vue";
import AttributeDID from "../components/AttributeDID.vue";

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
    ChangeDIDOwner,
    DelegateDID,
    AttributeDID,
  },
  data() {
    return {};
  },
});
</script>
