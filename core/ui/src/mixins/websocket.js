import NotificationService from "@/mixins/notification";
import { TaskService, StorageService } from "@nethserver/ns8-ui-lib";

export default {
  name: "WebSocketService",
  mixins: [NotificationService, TaskService, StorageService],
  methods: {
    initWebSocket() {
      var jwt =
        (this.getFromStorage("loginInfo") &&
          this.getFromStorage("loginInfo").token) ||
        "";
      this.$connect(this.$root.config.WS_ENDPOINT + "?jwt=" + jwt, {
        format: "json",
      });

      // set ws handlers only if not already set (e.g. after logout + login again)
      if (!this.$options.sockets.onmessage) {
        this.$options.sockets.onmessage = this.onMessage;
        this.$options.sockets.onopen = this.onOpen;
        this.$options.sockets.onclose = this.onClose;
      }
    },
    closeWebSocket() {
      this.$disconnect();
    },
    onOpen() {
      console.log("websocket connected"); ////
      this.$root.$emit("websocketConnected");
    },
    onMessage(message) {
      const messageData = JSON.parse(message.data);

      switch (messageData.type) {
        case "task":
          this.handleTaskMessage(messageData);
          break;
        case "action":
          this.handleActionMessage(messageData);
          break;
      }
    },
    handleTaskMessage(messageData) {
      const progressTaskMatch = /^progress\/(.+\/task\/(.+))$/.exec(
        messageData.name
      );

      if (progressTaskMatch) {
        const taskPath = progressTaskMatch[1];
        const taskId = progressTaskMatch[2];
        this.handleProgressTaskMessage(taskPath, taskId, messageData.payload);
      }
    },
    handleActionMessage(messageData) {
      // console.log("## handleActionMessage", messageData); ////

      const payload = messageData.payload;

      switch (messageData.name) {
        case "logs-start": {
          payload.message = this.splitLogLines(payload.message);
          this.$root.$emit(`logsStart-${payload.id}`, payload);
          break;
        }
        case "logs-stop":
          this.$root.$emit(`logsStop-${payload.id}`, payload);
          break;
      }
    },
    splitLogLines(logLinesString) {
      const logLines = logLinesString.split("\n");
      // discard empty lines
      return logLines.filter((l) => l);
    },
    onClose(event) {
      console.log("websocket close", event); ////
      this.$root.$emit("websocketDisconnected");
    },
  },
};
