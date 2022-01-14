import { CsgoempireService } from "./csgoempire";
import { HelperService } from "./helper";

const io = require("socket.io-client");

export class BotService {
	constructor(
		private csgoempireService = new CsgoempireService(),
		private helperService = new HelperService()
	) { }

}
