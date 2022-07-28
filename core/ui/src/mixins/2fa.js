import { StorageService } from "@nethserver/ns8-ui-lib";

export default {
  name: "TwoFaService",
  mixins: [StorageService],
  methods: {
    get2FaStatus() {
      const token = this.getFromStorage("loginInfo")
        ? this.getFromStorage("loginInfo").token
        : "";
      return this.axios.get(`${this.$root.apiUrl}/2FA`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    get2FaQrCode() {
      const token = this.getFromStorage("loginInfo")
        ? this.getFromStorage("loginInfo").token
        : "";
      return this.axios.get(`${this.$root.apiUrl}/2FA/qr-code`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    verify2FaCode(username, token, otp) {
      return this.axios.post(`${this.$root.apiUrl}/2FA/otp-verify`, {
        username,
        token,
        otp,
      });
    },
    revoke2Fa() {
      const token = this.getFromStorage("loginInfo")
        ? this.getFromStorage("loginInfo").token
        : "";

      return this.axios.delete(`${this.$root.apiUrl}/2FA`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  },
};
