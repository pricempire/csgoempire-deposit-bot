import { HelperService } from "./helper";

const SteamCommunity = require("steamcommunity");
const TradeOfferManager = require("steam-tradeoffer-manager");
const SteamTotp = require("steam-totp");

export class SteamService {
	private managers = {};
	private helperService: HelperService;
	private steam = new SteamCommunity();
	private config: Config = require("../../config.json");
	constructor() {
		this.helperService = new HelperService();
		this.helperService.asyncForEach(
			this.config.settings.csgoempire,
			async (config: Csgoempire) => {
				if (config.steam.accountName) {
					try {
						const cookies = await this.login(config.steam);
						this.helperService.sendMessage(
							`Steam login success for ${config.steam.accountName}`,
							"steamLoginSuccess"
						);
						this.managers[
							config.steam.accountName
						] = new TradeOfferManager({
							domain: "localhost",
							language: "en",
							pollInterval: 120000,
							cancelTime: 9 * 60 * 1000, // cancel outgoing offers after 9mins
						});
						this.managers[config.steam.accountName].setCookies(
							cookies,
							function (err) {
								if (err) {
									console.log(err);
									return;
								}
							}
						);

						// Accepts all offers empty from our side
						this.managers[config.steam.accountName].on(
							"newOffer",
							(offer) => {
								console.log(offer.itemsToGive.length > 0);
								console.log(!offer.isOurOffer);
								if (
									offer.itemsToGive.length > 0 &&
									!offer.isOurOffer
								) {
									offer.decline();
								} else {
									offer.accept();
								}
							}
						);
					} catch (err) {
						this.helperService.sendMessage(
							`Steam login fail for ${config.steam.accountName}: ${err.message}`,
							"steamLoginFailed"
						);
					}
					await this.helperService.delay(10000);
				}
			}
		);
	}
	async steamGuardConfirmation(offer, identitySecret) {
		this.steam.acceptConfirmationForObject(
			identitySecret,
			offer.id,
			(err: Error | null) => {
				if (err) {
					setTimeout(async () => {
						await this.steamGuardConfirmation(
							offer,
							identitySecret
						);
					}, 5000); // Try to send the offer every 5 seconds, when there's no success
				} else {
					this.helperService.sendMessage(
						`Deposit item sent & confirmed`,
						"steamOfferConfirmed"
					);
				}
			}
		);
	}
	async send(offer) {
		await offer.send((err, status) => {
			if (err) {
				setTimeout(async () => {
					await this.send(offer);
				}, 10000); // Try to send the offer every 10 seconds, when there's no success
			}
		});
	}
	async sendOffer(sendItems, tradeURL: string, userId: number) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const items = [];
		sendItems.forEach((item) => {
			items.push({
				assetid: item.asset_id,
				appid: item.app_id,
				contextid: item.context_id,
			});
		});
		const offer = this.managers[config.steam.accountName].createOffer(
			tradeURL
		);
		offer.addMyItems(items);
		await this.send(offer);

		// Wait 10 seconds to prevent offer id being null and breaking Steam Guard Confirmation
		setTimeout(async () => {
			await this.steamGuardConfirmation(
				offer,
				config.steam.identitySecret
			);
		}, 10000);
	}
	async login(config: Steam) {
		return new Promise((resolve, reject) => {
			this.steam.login(
				{
					accountName: config.accountName,
					password: config.password,
					twoFactorCode: SteamTotp.getAuthCode(config.sharedSecret),
				},
				function (err, sessionID, cookies, steamguard) {
					if (err) {
						return reject(err);
					}
					return resolve(cookies);
				}
			);
		});
	}
}
