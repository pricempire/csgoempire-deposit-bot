import * as fs from "fs";
import axios from "axios";
import path from "path";

const Push = require("pushover-notifications");
const dateFormat = require("dateformat");

export class HelperService {

	public static _log_file;

	private _config: Config;
	private pushoverClient;
	private eventColors = {
		steamLoginSuccess: 1,
		steamLoginFailed: 2,
		connectEmpire: 1,
		p2pItemUpdatedDelist: 1,
		p2pItemUpdatedPriceChanged: 1,
		tradeStatusSending: 1,
		tradeStatusCompleted: 1,
		tradeStatusTimedOut: 2,
		tradeStatusDodge: 2,
		tradeStatusProcessing: 1,
		tradeStatusCanceled: 2,
		steamOfferConfirmed: 1,
		steamSessionExpired: 2,
		badResponse: 2
	};
	public colors = [37, 32, 31]; // white, green ,red

	constructor() {
		if (this.config.settings.pushover.enabled) {
			this.pushoverClient = new Push({
				user: this.config.settings.pushover.pushoverUser,
				token: this.config.settings.pushover.pushoverToken,
			});
		}

		if (!this.config.settings.logging) {
			return;
		}

		if (!fs.existsSync('./logs')) {
			fs.mkdirSync('./logs');
		}

		if (!HelperService._log_file) {
			HelperService._log_file = fs.createWriteStream(`${__dirname}/../../logs/debug.${dateFormat(new Date(), "yyyy_mm_dd_H_MM_ss.l")}.log`, { flags: "w" });
		}
	}
	public log(d, level = 0) {

		console.log(`\x1b[${this.colors[level]}m [${dateFormat(new Date(), "yyyy-mm-dd H:MM:ss.l")}] ${d} \x1b[${this.colors[0]}m`);

		if (!this.config.settings.logging) {
			HelperService._log_file.write(`[${dateFormat(new Date(), "yyyy-mm-dd H:MM:ss.l")}]${d}\n`);
		}
	}
	public get config(): Config {
		if (this._config) {
			return this._config;
		}

		if (fs.existsSync(path.resolve(__dirname, '../../config.json'))) {
			return this._config = require('../../config.json');
		}

		if (fs.existsSync(path.resolve(__dirname, '../../config.js'))) {
			return this._config = require('../../config.js');
		}

		throw new Error("No config file found. Please create a config.js or config.json file and try again.");
	}
	public static env(key: string, defaultValue: string | null = null) {
		let value = process.env[key];

		if (value === undefined) {
			if (defaultValue === null) {
				throw new Error(`Missing environment variable ${key}`);
			}

			return defaultValue;
		}

		if (value === 'true') {
			return true;
		}

		if (value === 'false') {
			return false;
		}

		return value;
	}
	public delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

	async asyncForEach(array, callback, name = "") {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array, name);
		}
	}
	async sendMessage(message: string, event: string) {
		if (this.config.notifications[event]) {
			await this.sendDiscord(message);
			await this.sendPushover(message);
			this.log(message, this.eventColors[event]);
		}
	}
	private async sendPushover(msg) {
		if (this.config.settings.pushover.enabled) {
			try {
				await this.pushoverClient.send({
					message: msg,
					title: "[P2PBOT] Withdraw",
					priority: 1,
				});
				return true;
			} catch (e) {
				return false;
			}
		}
	}
	private async sendDiscord(message) {
		if (this.config.settings.discord.enabled) {
			try {
				await axios.post(this.config.settings.discord.discordHook, {
					content: `<@${this.config.settings.discord.userId}> ${message}`,
				});
				return true;
			} catch (e) {
				return false;
			}
		}
	}
}
