<template>
  <div class="bx--grid bx--grid--full-width">
    <div class="bx--row">
      <div class="bx--col-lg-16">
        <cv-breadcrumb
          aria-label="breadcrumb"
          :no-trailing-slash="true"
          class="breadcrumb"
        >
          <cv-breadcrumb-item>
            <cv-link to="/settings">{{ $t("settings.title") }}</cv-link>
          </cv-breadcrumb-item>
          <cv-breadcrumb-item>
            <span>{{ $t("settings_smarthost.title") }}</span>
          </cv-breadcrumb-item>
        </cv-breadcrumb>
      </div>
    </div>
    <div class="bx--row">
      <div class="bx--col-lg-16 subpage-title">
        <h3>{{ $t("settings_smarthost.title") }}</h3>
      </div>
    </div>
    <div v-if="error.getSmarthost" class="bx--row">
      <div class="bx--col">
        <NsInlineNotification
          kind="error"
          :title="$t('action.get-smarthost')"
          :description="error.getSmarthost"
          :showCloseButton="false"
        />
      </div>
    </div>
    <div class="bx--row">
      <div class="bx--col">
        <cv-tile :light="true">
          <cv-form @submit.prevent="saveSettings">
            <cv-toggle
              :label="$t('common.enabled')"
              value="statusValue"
              :form-item="true"
              v-model="enabled"
              :disabled="loading.getSmarthost || loading.setSmarthost"
            >
              <template slot="text-left">{{ $t("common.disabled") }}</template>
              <template slot="text-right">{{ $t("common.enabled") }}</template>
            </cv-toggle>
            <cv-text-input
              :label="
                $t('common.host_label')"
              v-model.trim="host"
              :placeholder="$t('common.no_label')"
              :helper-text="$t('common.host_label_tooltip')"
              :invalid-message="$t(error.host)"
              :disabled="loading.getSmarthost || loading.setSmarthost"
              maxlength="24"
              ref="host"
            >
            </cv-text-input>
            <cv-text-input
              :label="
                $t('common.username_label')"
              v-model.trim="username"
              :placeholder="$t('common.email')"
              :helper-text="$t('common.username_label_tooltip')"
              :invalid-message="$t(error.username)"
              :disabled="loading.getSmarthost || loading.setSmarthost"
              maxlength="24"
              ref="username"
            >
            </cv-text-input>
            <NsTextInput
                :label="
                  $t('common.password_label')"
                v-model="password"
                :invalid-message="$t(error.password)"
                type="password"
                ref="password"
              >
            </NsTextInput>
            <cv-text-input
              :label="
                $t('common.port_label')"
              v-model.trim="port"
              :placeholder="$t('common.no_label')"
              :helper-text="$t('common.port_label_tooltip')"
              :invalid-message="$t(error.port)"
              :disabled="loading.getSmarthost || loading.setSmarthost"
              maxlength="24"
              ref="port"
            >
            </cv-text-input>
            <!-- <cv-number-input
              :label="
                $t('common.port_label')"
              v-model.trim="port"
              :placeholder="$t('common.no_label')"
              :helper-text="$t('common.port_label_tooltip')"
              :invalid-message="$t(error.port)"
              :disabled="loading.getSmarthost || loading.setSmarthost"
              :min="1"
              :max="65535"
              ref="port"
            >
            </cv-number-input> -->
            <div v-if="error.setSmarthost" class="bx--row">
              <div class="bx--col">
                <NsInlineNotification
                  kind="error"
                  :title="$t('action.set-smarthost')"
                  :description="error.setSmarthost"
                  :showCloseButton="false"
                />
              </div>
            </div>
            <NsButton
              kind="primary"
              :icon="Save20"
              :loading="loading.setSmarthost"
              :disabled="isLoadingSettings"
              >{{ $t("common.save_settings") }}</NsButton
            >
          </cv-form>
        </cv-tile>
      </div>
    </div>
  </div>
</template>

<script>
import to from "await-to-js";
import {
  QueryParamService,
  UtilService,
  TaskService,
  IconService,
  PageTitleService,
} from "@nethserver/ns8-ui-lib";
import { mapActions } from "vuex";

export default {
  name: "SettingsSmartHost",
  mixins: [
    TaskService,
    UtilService,
    IconService,
    QueryParamService,
    PageTitleService,
  ],
  pageTitle() {
    return this.$t("settings_smarthost.title");
  },
  data() {
    return {
      q: {},
      port: 587,
      host:"",
      username:"",
      password:"",
      enabled: false,
      tls:true,
      tls_verify: true,
      loading: {
        getSmarthost: true,
        setSmarthost: false,
      },
      error: {
        getSmarthost: "",
        port: "",
        host:"",
        username:"",
        password:"",
        enabled: "",
        tls:"",
        tls_verify: "",
        setSmarthost: "",
      },
    };
  },
  computed: {
    isLoadingSettings() {
      return this.loading.getSmarthost || this.loading.setSmarthost;
    },
  },
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.watchQueryData(vm);
      vm.queryParamsToDataForCore(vm, to.query);
    });
  },
  beforeRouteUpdate(to, from, next) {
    this.queryParamsToDataForCore(this, to.query);
    next();
  },
  created() {
    this.getSmarthost();
  },
  methods: {
    ...mapActions(["setSmarthostInStore"]),
    async getSmarthost() {
      this.error.getSmarthost = "";
      this.loading.getSmarthost = true;
      const taskAction = "get-smarthost";

      // register to task completion
      this.$root.$once(
        taskAction + "-completed",
        this.getSmarthostCompleted
      );

      const res = await to(
        this.createClusterTask({
          action: taskAction,
          extra: {
            title: this.$t("action." + taskAction),
            isNotificationHidden: true,
          },
        })
      );
      const err = res[0];

      if (err) {
        console.error(`error creating task ${taskAction}`, err);
        this.error.getSmarthost = this.getErrorMessage(err);
        this.loading.getSmarthost = false;
        return;
      }
    },
    getSmarthostCompleted(taskContext, taskResult) {
      const smarthost = taskResult.output;
      this.host = smarthost.host;
      this.username = smarthost.username;
      this.password = smarthost.password;
      this.port = smarthost.port;
      this.tls = smarthost.tls;
      this.tls_verify = smarthost.tls_verify;
      this.enabled = smarthost.enabled;
      this.loading.getSmarthost = false;

      // update cluster label in shell header
      this.setSmarthostInStore(this.clusterLabel);
    },
    saveSettings() {
      this.setSmarthost();
    },
    async setSmarthost() {
      this.error.setSmarthost = "";
      this.loading.setSmarthost = true;
      const taskAction = "set-smarthost";

      // register to task completion
      this.$root.$once(
        taskAction + "-completed",
        this.setSmarthostCompleted
      );

      const res = await to(
        this.createClusterTask({
          action: taskAction,
          data: {
            host: this.host,
            username: this.username,
            password: this.password,
            port: this.port,
            tls: this.tls,
            tls_verify: this.tls_verify,
            enabled: this.enabled
          },
          extra: {
            title: this.$t("action." + taskAction),
            isNotificationHidden: true,
          },
        })
      );
      const err = res[0];

      if (err) {
        console.error(`error creating task ${taskAction}`, err);
        this.error.setSmarthost = this.getErrorMessage(err);
        this.loading.setSmarthost = false;
        return;
      }
    },
    setSmarthostCompleted() {
      this.loading.setSmarthost = false;

      //// don't do this at every task completed
      this.getSmarthost();
    },
  },
};
</script>

<style scoped lang="scss">
@import "../../styles/carbon-utils";

.break-word {
  word-wrap: break-word;
  max-width: 20vw;
}
</style>
