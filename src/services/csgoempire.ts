import axios, { AxiosRequestConfig } from "axios";
import { HelperService } from "./helper";
import { SteamService } from "./steam";

const io = require("socket.io-client");
const open = require("open");

export class CsgoempireService {
	private helperService: HelperService;
	private steamService: SteamService;
	private depositItems = {};
	private sockets = {};
	private offerSentFor = [];
	private config: Config = require("../../config.json");
	public pricempire;
	private trackers = {};

	constructor() {
		this.helperService = new HelperService();
		this.steamService = new SteamService();
		(async () => {
			for await (const config of this.config.settings.csgoempire) {
				this.initSocket(config.userId);
				await this.helperService.delay(5000);
			}
		})();
	}

	private async getRequestConfig(
		userId: number
	): Promise<AxiosRequestConfig> {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		return {
			headers: {
				"user-agent": `${config.userId} API Bot`,
				'Authorization': `Bearer ${config.csgoempireApiKey}`
			},
		};
	}
	private initTracker(status: TradeStatus, config: any, userId: any, itemName: string, itemPrice: number) {
		this.helperService.log(`Trade Tracker started for ${status.data.id}`);
		this.trackers[`track_${status.data.id}`] = setTimeout(async () => {
			this.helperService.sendMessage(
				`Trade offer still not sent for ${status.data.id}, re-sending.`,
				"tradeStatusCanceled"
			);
			await this.send(status, config, userId, itemName, itemPrice);
		}, 30 * 60 * 1000);
	}
	private clearTracker(id: number) {
		this.helperService.log(`Trade Tracker cleared for ${id}`);
		clearTimeout(this.trackers[`track_${id}`]);
	}
	// (status, config, userId, itemName, itemPrice)
	private async send(status: TradeStatus, config: any, userId: any, itemName: string, itemPrice: number) {

		if (!status.data.metadata.trade_url || status.data.metadata.trade_url === null || status.data.metadata.trade_url === 'null') {
			return;
		}
		const tradeURL = status.data.metadata.trade_url;
		// this.helperService.log(`Tradelink: ${tradeURL}`);
		// this.helperService.log(`Item: ${itemName}`);
		if (config.steam && config.steam.accountName) {
			this.steamService.sendOffer(
				status.data.items,
				tradeURL,
				userId
			);
		} else if (config.csgotrader) {
			const assetIds = [];
			status.data.items.forEach((item) => {
				assetIds.push(item.asset_id);
			});
			await this.helperService.sendMessage(
				`Opening tradelink for ${itemName} - ${itemPrice} coins`,
				"tradeStatusSending"
			);
			await open(
				`${tradeURL}&csgotrader_send=your_id_730_2_${assetIds.toString()}`,
				{ app: "chrome" }
			);
			this.initTracker(status, config, userId, itemName, itemPrice);
		} else {
			await this.helperService.sendMessage(
				`Deposit offer for ${itemName} - ${itemPrice} coins, accepted, go send go go`,
				"tradeStatusSending"
			);
		}
	}
	private initSocket(userId) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		this.sockets[`user_${userId}`] = io(`wss://trade.${config.origin}/trade`, {
			transports: ["websocket"],
			path: "/s/",
			secure: true,
			forceNew: true,
			rejectUnauthorized: false,
			reconnect: true,
			extraHeaders: {
				"user-agent": `${config.userId} API Bot`,
			},
		});
		this.sockets[`user_${userId}`].on("error", (err, v) => {
			this.helperService.log(`error: ${err}`);
		});
		this.sockets[`user_${userId}`].on("connect", async () => {
			this.sockets[`user_${userId}`].emit('filters', { 'price_max': 9999999 });

			this.helperService.sendMessage(
				`Connected to empire.`,
				"connectEmpire"
			);
			const meta = await this.requestMetaModel(userId);
			if (meta) {
				this.sockets[`user_${userId}`].emit("identify", {
					uid: meta.user.id,
					model: meta.user,
					authorizationToken: meta.socket_token,
					signature: meta.socket_signature,
				});
				this.sockets[`user_${userId}`].emit(
					"p2p/new-items/subscribe",
					1
				);
				await this.loadDepositItems(userId);
			}
		});
		this.sockets[`user_${userId}`].on("init", (data) => {
			if (data && data.authenticated) {
				this.helperService.log(
					`wss://trade.${config.origin}/ authenticated successfully.`,
					this.helperService.colors.FgGreen
				);
			}
		});

		this.sockets[`user_${userId}`].on("updated_item", async (payload: P2PNewItem[]) => {
			const p2pItems = Array.isArray(payload) ? payload : [payload];
			for await (const item of p2pItems) {
				const originalItemPrice = this.depositItems[`item_${item.id}`];
				if (originalItemPrice) {
					const percent =
						((item.market_value - originalItemPrice) /
							originalItemPrice) *
						100 *
						-1; // We multiply it by -1 to be able to compare it with the threshold set by the user
					const prefix = percent > 0 ? "-" : "+";
					this.helperService.sendMessage(
						`Price changed for ${item.market_name}, ${item.market_value / 100
						} => ${originalItemPrice / 100} - ${prefix}${percent < 0 ? percent * -1 : percent
						}%`,
						"p2pItemUpdatedPriceChanged"
					);
					if (percent > config.delistThreshold) {
						const status = await this.delistItem(
							config.userId,
							item.bot_id
						);

						if (!status) return;

						this.helperService.sendMessage(
							`${item.market_name} Delisted successfully`,
							"p2pItemUpdatedDelist"
						);
					}
				}
			}
		});
		this.sockets[`user_${userId}`].on(
			"trade_status",
			async (payload: TradeStatus[]) => {

				const statuses = Array.isArray(payload) ? payload : [payload];
				for await (const status of statuses) {

					if (status.type != "deposit") {
						return;
					}

					const itemName = status.data.items[0].market_name;
					const itemPrice = status.data.items[0].market_value; // Market value is given in decimals, we need to multiply to be able to compare with originalPrice
					const itemTotalValue = status.data.total_value;

					const originalItemPrice = this.depositItems[
						`item_${status.data.id}`
					];

					const percent =
						((itemTotalValue - originalItemPrice) / originalItemPrice) *
						100 *
						-1; // We multiply the percentage change by -1 so we can compare it with the threshold set by the user

					if (
						!originalItemPrice ||
						itemTotalValue >= originalItemPrice ||
						percent <= config.delistThreshold
					) {
						switch (status.data.status_message) {
							case "Processing":

								this.depositItems[
									`item_${status.data.id}`
								] = itemTotalValue;
								await this.helperService.sendMessage(
									`User listed '${itemName}' for ${itemPrice} coins.`,
									"tradeStatusProcessing"
								);
								break;
							case "Confirming":
								await this.helperService.sendMessage(
									`Deposit '${itemName}'are confirming for ${itemPrice} coins.`,
									"tradeStatusProcessing"
								);
								break;
							case "Sending":
								await this.send(status, config, userId, itemName, itemPrice);
								break;

							case "Sent": {
								this.clearTracker(status.data.id);
								break;
							}
							case "Completed":
								await this.helperService.sendMessage(
									`${itemName} has sold for ${itemPrice}`,
									"tradeStatusCompleted"
								);
								break;

							case "TimedOut":
								await this.helperService.sendMessage(
									`Deposit offer for ${itemName} was not accepted by buyer.`,
									"tradeStatusTimedOut"
								);
								break;

							case "Canceled":
								await this.helperService.sendMessage(
									`Trade for ${itemName} was canceled by user.`,
									"tradeStatusCanceled"
								);
								break;
						}
					} else {
						await this.helperService.sendMessage(
							`Dodging item ${itemName} because it's changed in its price in a negative way.`,
							"tradeStatusDodge"
						);
					}
				}
			}
		);

		setInterval(() => {
			this.sockets[`user_${userId}`].emit("timesync");
		}, 30000);
	}
	public async loadDepositItems(userId: number) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const options = await this.getRequestConfig(userId);

		try {
			const response = (
				await axios.get(
					`https://${config.origin}/api/v2/trading/user/trades`,
					options
				)
			).data as DepositResponse;
			if (response && response.data) {
				response.data.deposits.forEach((item) => {
					this.depositItems[`item_${item.id}`] = item.total_value;
				});
			}
			// check if we need to confirm trades
			return true;
		} catch (e) {
			await this.helperService.sendMessage(
				`Bad response from ${config.origin} at 'loadDepositItems', ${e.message}`,
				"badResponse"
			);
			return false;
		}
	}
	public async requestMetaModel(userId: number) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const options = await this.getRequestConfig(userId);
		try {
			return (
				await axios.get(
					`https://${config.origin}/api/v2/metadata/socket`,
					options
				)
			).data as MetaResponse;
		} catch (e) {
			this.helperService.log(
				`Bad response from ${config.origin} at 'requestMetaModel'`
			);
		}
	}
	public async getUserInventory(userId: number) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const options = await this.getRequestConfig(userId);
		try {
			return (
				await axios.get(
					`https://${config.origin}/api/v2/trading/user/inventory?app=730`,
					options
				)
			).data as InventoryResponse;
		} catch (e) {
			await this.helperService.sendMessage(
				`Bad response from ${config.origin} at 'getUserInventory', ${e.message}`,
				"badResponse"
			);
			return false;
		}
	}
	public async delistItem(userId, botId) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const options = await this.getRequestConfig(userId);
		try {
			return (
				await axios.post(
					`https://${config.origin}/api/v2/trading/deposit/${botId}/cancel`,
					{ id: botId },
					options
				)
			).data as CancelResponse;
		} catch (e) {
			await this.helperService.sendMessage(
				`Bad response from ${config.origin} at 'delistItem', ${e.message}`,
				"badResponse"
			);

			return false;
		}
	}
	public async confirmTrade(userId, depositId) {
		const config = this.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const options = await this.getRequestConfig(userId);
		try {
			return (
				await axios.post(
					`https://${config.origin}/api/v2/p2p/afk-confirm`,
					{ id: depositId },
					options
				)
			).data as CancelResponse;
		} catch (e) {
			await this.helperService.sendMessage(
				`Bad response from ${config.origin} at 'confirmTrade', ${e.message}`,
				"badResponse"
			);
		}
	}
}
