import { HelperService } from "./helper";

const SteamCommunity = require("steamcommunity");
const TradeOfferManager = require("steam-tradeoffer-manager");
const SteamTotp = require("steam-totp");

export class SteamService {
	private managers = {};
	private helperService: HelperService;
	private steam = new SteamCommunity();
	private config: Config = require("../../config");

	constructor() {
		this.helperService = new HelperService();
		this.init();
	}

	async init() {
		for await (const config of this.config.settings.csgoempire) {

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
						// cancelTime: 9 * 60 * 1000, // cancel outgoing offers after 9mins
						community: this.steam,
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

					this.steam.on('sessionExpired', async () => {
						this.helperService.sendMessage(
							`Steam session expired for ${config.steam.accountName}`,
							"steamSessionExpired"
						);

						// Sign back in
						let cookies = await this.login(config.steam);

						this.managers[config.steam.accountName].setCookies(
							cookies,
							function (err) {
								if (err) {
									console.log(err);
									return;
								}
							}
						);
					});

					if (config.steam.acceptOffers) {
						// Accepts all offers empty from our side
						this.managers[config.steam.accountName].on(
							"newOffer",
							(offer) => {
								if (
									offer.itemsToGive.length > 0 &&
									!offer.isOurOffer
								) {
									// offer.decline();
								} else {
									offer.accept();
								}
							}
						);
					}
				} catch (err) {
					this.helperService.sendMessage(
						`Steam login fail for ${config.steam.accountName}: ${err.message}`,
						"steamLoginFailed"
					);
				}
				await this.helperService.delay(10000);
			}
		}
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
		return new Promise((resolve, reject) => {
			offer.send(async (err, status) => {
				if (err) {
					console.log('Sending failed, resend it in 10 seconds.');
					await this.helperService.delay(1e4);
					return await this.send(offer); 
				} else {
					console.log('Offer sent');
					return resolve();
				}
			});
		})
	}
	async sendOffer(sendItems, tradeURL: string, userId: number) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const items = [];
		sendItems.forEach((item) => {
			items.push({
				assetid: item.asset_id,
				appid: 730,
				contextid: "2",
			});
		});
		const offer = this.managers[config.steam.accountName].createOffer(
			tradeURL
		);
		offer.addMyItems(items);
		try{
			await this.send(offer);
	
			// Wait 10 seconds to prevent offer id being null and breaking Steam Guard Confirmation
			await this.helperService.delay(1e4); 
			await this.steamGuardConfirmation(
				offer,
				config.steam.identitySecret
			); 
		} catch(e) {
			console.log('Error in steam sending', e);
		}
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
