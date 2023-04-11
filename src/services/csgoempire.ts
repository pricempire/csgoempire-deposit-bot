import axios, { AxiosRequestConfig } from "axios";
import { HelperService } from "./helper";
import { SteamService } from "./steam";

const io = require("socket.io-client");
const open = require("open");

export class CsgoempireService {

	private readonly maxRetry = 5;

	private retries = {};

	private helperService: HelperService;
	private steamService: SteamService;
	private _depositItems = {};
	private _sockets = {};
	private _trackers = {};
	private _depositPollers = {};

	public pricempire;

	constructor() {
		this.helperService = new HelperService();
		this.steamService = new SteamService();

		(async () => {
			for await (const config of this.helperService.config.settings.csgoempire) {
				this.initSocket(config.userId);
				this.initDepositPoller(config.userId);
				await this.helperService.delay(5000);
			}
		})();
	}

	private async getRequestConfig(
		userId: number
	): Promise<AxiosRequestConfig> {
		const config = this.helperService.config.settings.csgoempire.find(
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
		this._trackers[`track_${status.data.id}`] = setTimeout(async () => {
			if (!this.retries[status.data.id]) {
				this.retries[status.data.id] = 0;
			}
			this.retries[status.data.id]++;
			if (this.retries[status.data.id] > this.maxRetry) {

				this.helperService.sendMessage(
					`Failed to send offer for ${status.data.id} after ${this.maxRetry} retry, aborting.`,
					"tradeStatusCanceled"
				);
				return;
			}
			this.helperService.sendMessage(
				`Trade offer still not sent for ${status.data.id}, re-sending.`,
				"tradeStatusCanceled"
			);
			await this.send(status, config, userId, itemName, itemPrice);
		}, 30 * 60 * 1000);
	}
	private clearTracker(id: number) {
		// this.helperService.log(`Trade Tracker cleared for ${id}`, 1);
		clearTimeout(this._trackers[`track_${id}`]);
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
			await this.steamService.sendOffer(
				status.data.item,
				tradeURL,
				userId
			);
		} else if (config.csgotrader) {
			const assetIds = [status.data.item.asset_id];
			await this.helperService.sendMessage(
				`Opening tradelink for ${itemName} - ${itemPrice / 100} coins`,
				"tradeStatusSending"
			);
			await open(
				`${tradeURL}&csgotrader_send=your_id_730_2_${assetIds.toString()}`,
				{ app: config.browser || "chrome" }
			);
			this.initTracker(status, config, userId, itemName, itemPrice);
		} else {
			await this.helperService.sendMessage(
				`Deposit offer for ${itemName} - ${itemPrice / 100} coins, accepted, go send go go`,
				"tradeStatusSending"
			);
		}
	}
	private initDepositPoller(userId) {
		this.helperService.log(`Deposit Poller started for ${userId}`);
		const config = this.helperService.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);

		this._depositPollers[`poll_${userId}`] = setInterval(async () => {
			this.helperService.log(`Polling for ${userId} stuck deposits`);
			const responseData = await this.getActiveTrades(userId);
			if(!responseData?.success){
				return this.helperService.log(`Failed to get active trades for ${userId}`);
			}
			const tradesToBeSent = responseData?.data?.deposits?.filter(
				(trade) => trade.status === 3 // 3 = sending
			);
			this.helperService.log(`Found ${tradesToBeSent.length} stuck deposits for ${userId}`);

			// send the trades
			for await(const trade of tradesToBeSent){
				const itemName = trade?.item.market_name;
				if(!this._depositItems[`item_${trade.id}`]){
					this._depositItems[`item_${trade.id}`] = trade?.total_value || trade?.item.market_value;
				}

				await this.send({
					type: "deposit",
					data: { // do some silly stupid formatting so we can just use the same function
						...trade,
						createdAt: new Date(trade.created_at),
						updatedAt: new Date(trade.updated_at),
						tradeoffer_id: String(trade.tradeoffer_id),
						trade_id: String(trade.id)
					},
				}, config, userId, itemName, this._depositItems[`item_${trade.id}`]);
			}

			return this.helperService.log(`Deposit Poller finished for ${userId}`);
		}, (config.stuckTradesPollRate || 5) * (60 * 1000)); // default is 5 minutes
	}
	private initSocket(userId) {
		const config = this.helperService.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		this._sockets[`user_${userId}`] = io(`wss://trade.${config.origin}/trade`, {
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
		this._sockets[`user_${userId}`].on("error", (err, v) => {
			this.helperService.log(`Websocket Error: ${err}`);
		});
		this._sockets[`user_${userId}`].on("connect", async () => {
			this._sockets[`user_${userId}`].emit('filters', { 'price_max': 10 }); // set it to 10 to reduce the socket bandwidth

			this.helperService.sendMessage(
				`CSGOEmpire Socket connected for user: ${userId}.`,
				"connectEmpire"
			);
			const meta = await this.requestMetaModel(userId);
			if (meta) {
				this._sockets[`user_${userId}`].emit("identify", {
					uid: meta.user.id,
					model: meta.user,
					authorizationToken: meta.socket_token,
					signature: meta.socket_signature,
				});
				this._sockets[`user_${userId}`].emit("p2p/new-items/subscribe", 1);
			}
		});
		this._sockets[`user_${userId}`].on("init", (data) => {
			if (data && data.authenticated) {

				this.helperService.sendMessage(
					`CSGOEmpire Socket authenticated successfully for user: ${userId}.`,
					"connectEmpire"
				);
			}
		});

		this._sockets[`user_${userId}`].on("updated_item", async (payload: P2PNewItem[]) => {
			const p2pItems = Array.isArray(payload) ? payload : [payload];
			for await (const item of p2pItems) {
				const originalItemPrice = this._depositItems[`item_${item.id}`];
				if (originalItemPrice) {
					const percent =
						((item.market_value - originalItemPrice) /
							originalItemPrice) *
						100 *
						-1; // We multiply it by -1 to be able to compare it with the threshold set by the user
					const prefix = percent > 0 ? "-" : "+";
					this.helperService.sendMessage(
						`Price changed for ${item.market_name}, ${item.market_value / 100} => ${originalItemPrice / 100} - ${prefix}${percent < 0 ? percent * -1 : percent}%`,
						"p2pItemUpdatedPriceChanged"
					);
					if (percent > config.delistThreshold) {
						const status = await this.delistItem(
							config.userId,
							item.bot_id
						);

						if (!status) return;

						this.helperService.sendMessage(
							`The item '${item.market_name}' was successfully delisted.`,
							"p2pItemUpdatedDelist"
						);
					}
				}
			}
		});
		this._sockets[`user_${userId}`].on(
			"trade_status",
			async (payload: TradeStatus[]) => {

				const statuses = Array.isArray(payload) ? payload : [payload];
				for await (const status of statuses) {

					if (status.type != "deposit") {
						return;
					}

					const itemName = status.data.item.market_name;
					switch (status.data.status_message) {
						case "Processing":
							await this.helperService.sendMessage(
								`User listed '${itemName}' for ${status.data.item.market_value} coins.`,
								"tradeStatusProcessing"
							);
							break;
						case "Confirming":

							this._depositItems[`item_${status.data.id}`] = status.data.total_value || status.data.item.market_value;

							await this.helperService.sendMessage(
								`Deposit '${itemName}' is confirming for ${this._depositItems[`item_${status.data.id}`] / 100} coins.`,
								"tradeStatusProcessing"
							);
							break;
						case "Sending":
							await this.send(status, config, userId, itemName, this._depositItems[`item_${status.data.id}`]);
							break;

						case "Sent": {
							this.clearTracker(status.data.id);
							break;
						}
						case "Completed":
							this.clearTracker(status.data.id);
							await this.helperService.sendMessage(
								`${itemName} has sold for ${this._depositItems[`item_${status.data.id}`] / 100}`,
								"tradeStatusCompleted"
							);
							break;

						case "TimedOut":
							await this.helperService.sendMessage(
								`Deposit offer for ${itemName} was not accepted by the buyer.`,
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
				}
			}
		);

		setInterval(() => {
			this._sockets[`user_${userId}`].emit("timesync");
		}, 30000);
	}
	public async requestMetaModel(userId: number) {
		const config = this.helperService.config.settings.csgoempire.find(
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
			this.helperService.log(`Bad response from ${config.origin} at 'requestMetaModel'. Maybe CSGOEmpire down, or you are using a bad CSGOEmpire API Key.`, 2);
		}
	}
	public async getUserInventory(userId: number) {
		const config = this.helperService.config.settings.csgoempire.find(
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
		const config = this.helperService.config.settings.csgoempire.find(
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
		const config = this.helperService.config.settings.csgoempire.find(
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
	public async getActiveTrades(userId) {
		const config = this.helperService.config.settings.csgoempire.find(
			(config) => config.userId === userId
		);
		const options = await this.getRequestConfig(userId);
		try {
			return (
				await axios.get(
					`https://${config.origin}/api/v2/trading/user/trades`,
					options
				)
			).data as GetActiveTradesResponse;
		} catch (e) {
			console.log(e?.response);

			await this.helperService.sendMessage(
				`Bad response from ${config.origin} at 'getActiveTrades', ${e.message}`,
				"badResponse"
			);
		}
	}
}
