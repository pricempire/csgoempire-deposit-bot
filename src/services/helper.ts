import * as util from "util";
import * as fs from "fs";
import axios from "axios";
import path from "path";
import 'dotenv/config';

const Push = require("pushover-notifications");
const dateFormat = require("dateformat");

export class HelperService {
	private config: Config;
	private log_file;
	private pushoverClient;
	public delay = (ms) =>
		new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

	public colors = {
		FgBlack: "\x1b[30m",
		FgRed: "\x1b[31m",
		FgGreen: "\x1b[32m",
		FgYellow: "\x1b[33m",
		FgBlue: "\x1b[34m",
		FgMagenta: "\x1b[35m",
		FgCyan: "\x1b[36m",
		FgWhite: "\x1b[37m",
	};
	private events = {
		steamLoginSuccess: {
			color: this.colors.FgGreen,
		},
		steamLoginFailed: {
			color: this.colors.FgRed,
		},
		connectEmpire: {
			color: this.colors.FgGreen,
		},
		p2pItemUpdatedDelist: {
			color: this.colors.FgGreen,
		},
		p2pItemUpdatedPriceChanged: {
			color: this.colors.FgGreen,
		},
		tradeStatusSending: {
			color: this.colors.FgGreen,
		},
		tradeStatusCompleted: {
			color: this.colors.FgGreen,
		},
		tradeStatusTimedOut: {
			color: this.colors.FgRed,
		},
		tradeStatusDodge: {
			color: this.colors.FgRed,
		},
		tradeStatusProcessing: {
			color: this.colors.FgGreen,
		},
		tradeStatusCanceled: {
			color: this.colors.FgRed
		},
		steamOfferConfirmed: {
			color: this.colors.FgGreen,
		},
		steamSessionExpired: {
			color: this.colors.FgRed,
		},
		badResponse: {
			color: this.colors.FgRed,
		},
	};
	constructor() {
		this.config = this.getConfig();
		const now = new Date();
		if (this.config.settings.logging) {
			if (!fs.existsSync('./logs')) {
				fs.mkdirSync('./logs');
			}
			this.log_file = fs.createWriteStream(
				__dirname +
				"/logs/debug." +
				dateFormat(now, "yyyy_mm_dd_H_MM_ss.l") +
				".log",
				{ flags: "w" }
			);
		}
		if (this.config.settings.pushover.enabled) {
			this.pushoverClient = new Push({
				user: this.config.settings.pushover.pushoverUser,
				token: this.config.settings.pushover.pushoverToken,
			});
		}
	}
	public log(d, color = "\x1b[0m") {
		if (this.config.settings.logging) {
			this.log_file.write(
				"[" +
				dateFormat(new Date(), "yyyy-mm-dd H:MM:ss.l") +
				"] " +
				util.format(d) +
				"\n"
			);
		}
		console.log(
			color +
			"[" +
			dateFormat(new Date(), "yyyy-mm-dd H:MM:ss.l") +
			"] " +
			util.format(d),
			this.colors.FgWhite
		);
	}
	public getConfig(): Config {
		if (this.config) {
			return this.config;
		}

		if (fs.existsSync(path.resolve(__dirname, '../../config.json'))) {
			return this.config = require('../../config.json');
		}

		if (fs.existsSync(path.resolve(__dirname, '../../config.js'))) {
			return this.config = require('../../config.js');
		}

		throw new Error("No config file found. Please create a config.js or config.json file and try again.");
	}
	public static env(key: string, defaultValue: string|null = null) {
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
	async asyncForEach(array, callback, name = "") {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array, name);
		}
	}
	async sendMessage(message: string, event: string) {
		if (this.config.notifications[event]) {
			await this.sendDiscord(message);
			await this.sendPushover(message);
			this.log(message, this.events[event].color);
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
