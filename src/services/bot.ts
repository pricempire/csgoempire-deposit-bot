import { CsgoempireService } from "./csgoempire";
import { HelperService } from "./helper";

const io = require("socket.io-client");

export class BotService {
  private pricempire;
  private config: Config = require("../config.json");

  constructor(
    private csgoempireService = new CsgoempireService(),
    private helperService = new HelperService()
  ) {
    this.initPeer();
    csgoempireService.pricempire = this.pricempire;
  }

  private initPeer() {
    this.pricempire = io(
      process.env.npm_lifecycle_event === "start:dev"
        ? "ws://localhost:5000/peer"
        : "wss://socket.pricempire.com/peer"
    );
    this.pricempire.on("connect", () => {
      this.pricempire.emit("auth", this.config.settings.pricempire.authToken);
    });
  }
}
