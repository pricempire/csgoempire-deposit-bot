import { HelperService } from "./helper";

const SteamUser = require("steam-user");
const SteamCommunity = require("steamcommunity");
const TradeOfferManager = require("steam-tradeoffer-manager");
const SteamTotp = require("steam-totp");
const Request = require("request");
const retry = require("async-retry");

export class SteamService {
	private readonly maxRetry = 5;
	private retries = {};
	private managers = {};
	private steams = {};
	private clients = {};
	private helperService: HelperService;

	constructor() {
		this.helperService = new HelperService();
		this.init();
	}

	async init() {
		for await (const config of this.helperService.config.settings.csgoempire) {

			if (config.steam.accountName) {
				// await this.initLogin(config);
				await this.initAccount(config);
				await this.helperService.delay(10000);
			}
		}
	}
	// first stage of steam init
	async initAccount(config){
		try{
			// setup steamuser
			const steamOptions: {
				httpProxy?: string;
				autoRelogin?: boolean;
			} = { autoRelogin: true };
			if (config.steam.proxy) steamOptions.httpProxy = config.steam.proxy;
			this.clients[config.steam.accountName] = new SteamUser(steamOptions);

			// setup steamcommunity
			const communityOptions: { request?: any } = {};
			if (config.steam.proxy) communityOptions.request = Request.defaults({ 'proxy': config.steam.proxy });
			this.steams[config.steam.accountName] = new SteamCommunity(communityOptions);

			// setup tradeoffermanager
			this.managers[config.steam.accountName] = new TradeOfferManager({
				steam: this.clients[config.steam.accountName],
				domain: "localhost",
				language: "en",
				pollInterval: 120000
			});

			// Steam Event Handlers
			this.clients[config.steam.accountName].on(
				"loggedOn",
				() => {
					this.helperService.sendMessage(
						`Steam login success for ${config.steam.accountName}`,
						"steamLoginSuccess"
					);
				}
			);
			// Event handler for steam web session
			this.clients[config.steam.accountName].on(
				"webSession",
				(sessionId, cookies) => {
					this.helperService.sendMessage(
						`Steam got web session for ${config.steam.accountName}.`,
						"steamWebSession"
					);

					this.steams[config.steam.accountName].setCookies(cookies);
					this.managers[config.steam.accountName].setCookies(
						cookies,
						(err) => {
							if (err) {
								return this.helperService.sendMessage(
									`Steam manager set cookies failed for ${config.steam.accountName}: ${err.message}`,
									"steamManagerSetCookiesFailed"
								);
							}
							this.helperService.sendMessage(
								`Steam set cookies success for ${config.steam.accountName}`,
								"steamManagerSetCookiesSuccess"
							);
						}
					);
				}
			);
			// Event handler for steam errors
			this.clients[config.steam.accountName].on(
				"error",
				(err) => {
					this.helperService.sendMessage(
						`Steam client error for ${config.steam.accountName}: ${err.message}`,
						"steamClientError"
					);
					this.steamLogin(config.steam);
				}
			);
			// Event handler for steam disconnects
			this.clients[config.steam.accountName].on(
				"disconnected",
				(eresult, msg) => {
					this.helperService.sendMessage(
						`Steam disconnected for ${config.steam.accountName} eresult=${eresult} msg=${msg} (should auto-reconnect)`,
						"steamDisconnected"
					);
				}
				);
			// Event handler for steam account limitations
			this.clients[config.steam.accountName].on(
				"accountLimitations",
				(limited, communityBanned, locked) => {
					this.helperService.sendMessage(
						`Steam account limitations for ${config.steam.accountName} limited=${limited} communityBanned=${communityBanned} locked=${locked}`,
						"steamAccountLimitations"
					);
				}
			);

			// Steam community event handlers
			this.steams[config.steam.accountName].on(
				"sessionExpired",
				(err) => {
					this.helperService.sendMessage(
						`Steam session expired for ${config.steam.accountName}, attempting to re-login: ${err.message}`,
						"steamSessionExpired"
					);
					
					// If we don't have a steam id at all, we need to re-login, otherwise we can just re-weblogin
					if(!this.clients[config.steam.accountName].steamID){
						this.steamLogin(config.steam);
					} else{
						this.clients[config.steam.accountName].webLogOn();
					}
				}
			);

			// Steam trade offer manager event handlers
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

			// login the steam-user instance
			this.steamLogin(config.steam);
		} catch(err){
			this.helperService.sendMessage(
				`Steam login failed for ${config.steam.accountName}: ${err.message}`,
				"steamLoginFailed"
			);

			await this.helperService.delay(60000); // 60s because of steam guard
			return await this.initAccount(config);
		}
	}
	// login the steam-user instance
	steamLogin(steam: Steam){
		this.clients[steam.accountName].logOn({
			accountName: steam.accountName,
			password: steam.password,
			twoFactorCode: SteamTotp.generateAuthCode(steam.sharedSecret),
		});
	}
	/* async initLogin(config) {
		try {
			let initObject = {};
			if (config.steam.proxy) {
				initObject = {
					'request': Request.defaults({ 'proxy': config.steam.proxy }),
				}
			}
			this.steams[config.steam.accountName] = new SteamCommunity(initObject);

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
				community: this.steams[config.steam.accountName],
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

			this.steams[config.steam.accountName].on('sessionExpired', async () => {
				this.helperService.sendMessage(
					`Steam session expired for ${config.steam.accountName}`,
					"steamSessionExpired"
				);

				// Sign back in
				const cookies = await this.login(config.steam);

				this.managers[config.steam.accountName].setCookies(
					cookies,
					function (err) {
						if (err) {
							console.log(err);
							return;
						}
					}
				);

				this.helperService.sendMessage(
					`Steam login success for ${config.steam.accountName}`,
					"steamLoginSuccess"
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
				`Steam login failed for ${config.steam.accountName}: ${err.message}`,
				"steamLoginFailed"
			);

			await this.helperService.delay(60000); // 60s because of steam guard
			return await this.initLogin(config);
		}
	} */
	async steamGuardConfirmation(steam, offer) {
		try {
			await retry(async () => new Promise((resolve, reject) => {
					this.steams[steam.accountName].acceptConfirmationForObject(
						steam.identitySecret,
						offer.id,
						(err) => {
							if (err) {
								if (offer.isGlitched()) {
									this.helperService.log(`[#${offer.id}] Offer is glitched. (Empty from both side)`, 2);
								}
								
								return reject(err);
							}

							resolve(true);
						}
					);
			}), {
				retries: 10,
				factor: 2, // exponential backoff
				minTimeout: 10 * 1000,
				maxTimeout: 30 * 1000,
				onRetry: (err, attempt) => {
					this.helperService.log(`[#${offer.id}] Retry #${attempt} failed to confirm the offer: ${err.message}`, 2);
					this.helperService.log(`[#${offer.id}] Trying again in ${Math.round(Math.pow(2, attempt) / 1000)} seconds.`, 2);
				}
			});

			return true;
		} catch (err) {
			this.helperService.log(`[#${offer.id}] Failed to confirm the offer: ${err.message}`, 2);

			return false;
		}
	}
	/* async steamGuardConfirmation(steam: Steam, offer: any) {
		return new Promise(async (resolve, reject) => {
			try {
				this.steams[steam.accountName].acceptConfirmationForObject(
					steam.identitySecret,
					offer.id,
					(err: Error | null) => {
						if (err) {
							if (offer.isGlitched()) {
								this.helperService.log(`[#${offer.id}] Offer is glitched. (Empty from both side)`, 2);
							}
							this.helperService.log(`[#${offer.id}] Failed to Confirm the offer, retry in 5 seconds.`, 2);
							setTimeout(async () => {
								resolve(await this.steamGuardConfirmation(
									offer,
									steam.identitySecret
								));
							}, 30000); // Increased this in case of Steam is down, do not spam the endpoint and get ratelimited.
						}
						resolve(offer);
					}
				);
			} catch (e) {
				await this.helperService.delay(20000);
				// await this.login(steam);
				return this.steamGuardConfirmation(steam, offer);
			}
		})
	} */
	/* async send(offer) {
		return new Promise((resolve, reject) => {
			offer.send(async (err, status) => {
				if (err) {
					this.helperService.log(`[#${offer.id}] Failed to send trade: ${err.message}`, 2);
					if (!this.retries[offer.itemsToGive[0].assetid]) {
						this.retries[offer.itemsToGive[0].assetid] = 1;
					}
					this.retries[offer.itemsToGive[0].assetid]++;

					if (this.retries[offer.itemsToGive[0].assetid] > this.maxRetry) {
						this.helperService.log(`[#${offer.id}] The sending process was unsuccessful after ${this.maxRetry} retries, Probably item id changed.`, 2);
						reject();
					}
					this.helperService.log('The sending process was unsuccessful. Try again in 10 seconds.', 2);
					await this.helperService.delay(1e4);
					resolve(await this.send(offer));
				} else {
					resolve(offer.id);
				}
			});
		});
	} */
	async sendOffer(sendItem, tradeURL: string, userId: number) {
		const config = this.helperService.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		// create the trade offer
		const offer = this.managers[config.steam.accountName].createOffer(tradeURL);
		offer.addMyItems([{
			assetid: sendItem.asset_id,
			appid: 730,
			contextid: "2"
		}]);
		try {
			// we will try to send the offer maxRetry times before giving up
			const status = await retry(async () => new Promise((resolve, reject) => {
				offer.send((err, status) => {
					if(err) return reject(err);
					
					return resolve(status);
				});
			}), {
				retries: this.maxRetry,
				factor: 1,
				minTimeout: 10000,
				maxTimeout: 10000,
				onRetry: (err, attempt) => {
					this.helperService.log(`[#${offer.id}] Retry #${attempt} failed to send trade: ${err.message}`, 2);
					if (!this.retries[sendItem.asset_id]) {
						this.retries[sendItem.asset_id] = 1;
					}
					this.retries[sendItem.asset_id]++;
					if (this.retries[sendItem.asset_id] > this.maxRetry) {
						this.helperService.log(`[#${offer.id}] The sending process was unsuccessful after ${this.maxRetry} retries, Probably item id changed.`, 2);
						throw new Error(`[#${offer.id}] Failed to send trade after ${this.maxRetry} retries`);
					}
					this.helperService.log(`[#${offer.id}] Retry #${attempt} unsuccessful. Trying again in ${Math.round(Math.pow(2, attempt) / 1000)} seconds.`, 2);
				}
			});
			
			this.helperService.log(`[#${offer.id}] Offer Sent for ${sendItem.market_name}. Status: ${status}`, 1);
			// if status is pending then we need to mobile confirm the trade
			if(status === 'pending'){
				await this.helperService.delay(1e4);

				const confirmedTrade = await this.steamGuardConfirmation(
					config.steam,
					offer,
				);
				if(confirmedTrade) this.helperService.log(`[#${offer.id}] Offer Confirmed for ${sendItem.market_name}`, 1);
			}
		} catch (e) {
			this.helperService.log(`[#${offer.id}] Failed to create the Steam offer. ${sendItem.market_name}#${sendItem.asset_id}`, 2);
		}
	}

	/* async sendOffer(sendItem, tradeURL: string, userId: number) {
		const config = this.helperService.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const items = [];
		items.push({
			assetid: sendItem.asset_id,
			appid: 730,
			contextid: "2",
		});
		const offer = this.managers[config.steam.accountName].createOffer(
			tradeURL
		);
		offer.addMyItems(items);
		try {
			const offerId = await this.send(offer);
			this.helperService.log(`[#${offerId}] Offer created for ${sendItem.market_name}`, 1);
		} catch (e) {
			this.helperService.log(`Failed to create the Steam offer. ${sendItem.market_name}#${sendItem.asset_id}`, 2);
		}

		await this.helperService.delay(1e4);

		try {
			await this.steamGuardConfirmation(
				config.steam,
				offer,
			);
			this.helperService.log(`[#${offer.id}] Offer Confirmed for ${sendItem.market_name}`, 1);
		} catch (e) { }

	} */
	/* async login(steam: Steam) {
		return new Promise((resolve, reject) => {
			this.steams[steam.accountName].login(
				{
					accountName: steam.accountName,
					password: steam.password,
					twoFactorCode: SteamTotp.getAuthCode(steam.sharedSecret),
				},
				function (err, sessionID, cookies, steamguard) {
					if (err) {
						return reject(err);
					}
					return resolve(cookies);
				}
			);
		});
	} */
}
