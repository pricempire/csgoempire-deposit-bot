import { get, post } from 'request-promise';
import { HelperService } from "./helper";
import { SteamService } from "./steam";

const io = require('socket.io-client');
const open = require('open');

export class CsgoempireService {
    private helperService: HelperService;
    private steamService: SteamService;
    private depositItems = {};
    private sockets = {};
    private offerSentFor = [];
    private config: Config = require('../config.json');
    public pricempire;

    constructor(
    ) {
        this.helperService = new HelperService();
        this.steamService = new SteamService();
        this.helperService.asyncForEach(this.config.settings.csgoempire, async (config) => {
            this.initSocket(config.userId);
            if (config.selflock) {
                await this.selfLock(config.userId, 24);
            }
            await this.pricempirePeer(config.userId);
            await this.helperService.delay(5000);
        });
    }
    private async pricempirePeer(userId) {
        setTimeout(async () => {
            await this.pricempirePeer(userId);
        }, 30 * 60 * 1000);
        const inventory = await this.getUserInventory(userId);
        if(inventory) {
            inventory.data.forEach(item => {
                this.pricempire.emit('price-commit', {
                    itemName: item.market_name,
                    price: item.market_value,
                })
            });
        }
    }
    private initSocket(userId) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        this.sockets[`user_${userId}`] = io(`wss://trade.${config.origin}/`,
            {
                transports: ['websocket'],
                path: "/socket.io/",
                secure: true,
                forceNew: true,
                rejectUnauthorized: false,
                reconnect: true,
                extraHeaders: {
                    'User-agent': config.userAgent,
                },
            });
        this.sockets[`user_${userId}`].on('error', (err, v) => {
            console.log(`error: ${err}`);
        })
        this.sockets[`user_${userId}`].on("connect", async () => {
            this.helperService.sendMessage(`Connected to empire.`, 'connectEmpire');
            const meta = await this.requestMetaModel(userId);
            if (meta) {
                this.sockets[`user_${userId}`].emit('identify', {
                    uid: meta.user.id,
                    model: meta.user,
                    authorizationToken: meta.socket_token,
                    signature: meta.socket_signature
                });
                this.sockets[`user_${userId}`].emit('p2p/new-items/subscribe', 1);
                await this.loadDepositItems(userId);
            }
        });
        this.sockets[`user_${userId}`].on('init', (data) => {
            if (data && data.authenticated) {
                this.helperService.log(`wss://trade.${config.origin}/ authenticated successfully.`, this.helperService.colors.FgGreen);
            }
        });

        this.sockets[`user_${userId}`].on("p2p_updated_item", async (json) => {
            const item = JSON.parse(json) as P2PNewItem;
            const originalItemPrice = this.depositItems[`item_${item.id}`];
            if (originalItemPrice) {
                const percent =
                    ((item.market_value - originalItemPrice) /
                        originalItemPrice) *
                    100 * -1; // We multiply it by -1 to be able to compare it with the threshold set by the user
                const prefix = percent > 0 ? '-' : '+';
                this.helperService.sendMessage(`Price changed for ${item.market_name}, ${item.market_value / 100} => ${originalItemPrice / 100} - ${prefix}${(percent < 0 ? percent * -1 : percent)}%`, 'p2pItemUpdatedPriceChanged');
                if (percent > config.delistThreshold) {
                    const status = await this.delistItem(config.userId, item.bot_id);
                    this.helperService.sendMessage(`${item.market_name} Delisted successfully`, 'p2pItemUpdatedDelist');
                }
            }
        });
        this.sockets[`user_${userId}`].on("trade_status", async (status: TradeStatus) => {
            if (status.type != "deposit") {
                return;
            }

            const itemName = status.data.items[0].market_name;
            const itemPrice = status.data.items[0].market_value;

            const originalItemPrice = this.depositItems[`item_${status.data.id}`];
            const percent = (itemPrice - originalItemPrice) / originalItemPrice * 100 * -1; // We multiply the percentage change by -1 so we can compare it with the threshold set by the user

            if (!originalItemPrice || originalItemPrice >= itemPrice || percent <= config.delistThreshold) {
                switch (status.data.status_text) {
                    case 'Processing':
                        // console.log(`${itemName} item listed.`);
                        // console.log(JSON.stringify(status.data));
                        this.depositItems[`item_${status.data.id}`] = status.data.items[0].market_value * 100;
                        break;
                    case 'Confirming':
                        const confirm = await this.confirmTrade(config.userId, status.data.id);
                        await this.helperService.sendMessage(`Deposit '${itemName}'are confirming for ${itemPrice} coins.`, 'tradeStatusProcessing');
                        break;
                    case 'Sending':
                        // do not send duplicated offers
                        if (this.offerSentFor.indexOf(status.data.id) === -1) {
                            this.offerSentFor.push(status.data.id);
                            const tradeURL = status.data.metadata.trade_url;
                            // console.log(`Tradelink: ${tradeURL}`);
                            // console.log(`Item: ${itemName}`);
                            if (config.steam && config.steam.accountName) {
                                this.steamService.sendOffer(status.data.items, tradeURL, userId);
                            } else if (config.csgotrader) {
                                const assetIds = [];
                                status.data.items.forEach(item => {
                                    assetIds.push(item.asset_id);
                                });
                                await this.helperService.sendMessage(`Opening tradelink for ${itemName} - ${itemPrice} coins`, 'tradeStatusSending');
                                await open(`${tradeURL}&csgotrader_send=your_id_730_2_${assetIds.toString()}`, { app: 'chrome' });
                            } else {
                                await this.helperService.sendMessage(`Deposit offer for ${itemName} - ${itemPrice} coins, accepted, go send go go`, 'tradeStatusSending');
                            }
                        }
                        break;

                    case 'Completed':
                        //console.log(`Item sold successfully`);
                        await this.helperService.sendMessage(`${itemName} has sold for ${itemPrice}`, 'tradeStatusCompleted');
                        break;

                    case 'TimedOut':
                        await this.helperService.sendMessage(`Deposit offer for ${itemName} was not accepted by buyer.`, 'tradeStatusTimedOut');
                        break;
                }
            } else {
                await this.helperService.sendMessage(`Dodging item ${itemName} because it's changed in its price in a negative way.`, 'tradeStatusDodge');
            }
        });
    }
    public async loadDepositItems(userId: number) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const options = {
            url: `https://${config.origin}/api/v2/trade/trades`,
            method: 'GET',
            gzip: true,
            json: true,
            headers: {
                'user-Agent': config.userAgent,
                Cookie: `PHPSESSID=${config.PHPSESSID}; do_not_share_this_with_anyone_not_even_staff=${config.do_not_share_this_with_anyone_not_even_staff}`
            },
        };
        try {
            const response = await get(options) as DepositResponse;
            if(response && response.data) {
                response.data.deposits.forEach(item => {
                    this.depositItems[`item_${item.id}`] = item.total_value;
                });
            }
            return true;
        } catch (e) {
            await this.helperService.sendMessage(`Bad response from ${config.origin} at 'loadDepositItems', ${e.message}`, 'badResponse');
            return false;
        }
    }
    public async securityToken(userId: number) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const options = {
            url: `https://${config.origin}/api/v2/user/security/token`,
            method: 'POST',
            json: {
                "code": config.securityCode,
                "uuid": config.uuid,
            },
            headers: {
                'user-Agent': config.userAgent,
                "x-empire-device-identifier": config.uuid,
                Cookie: `PHPSESSID=${config.PHPSESSID}; do_not_share_this_with_anyone_not_even_staff=${config.do_not_share_this_with_anyone_not_even_staff};`,
            },
        };
        if (config.securityCode === '0000') {
            options.json['type'] = 'standard';
            options.json['remember_device'] = false;
            options.headers.Cookie += `device_auth_${config.userId}=${config.device_auth}`;
        }
        try {
            const body = await post(options) as SecurityTokenResponse;
            if (body.success) {
                return body.token;
            } else {
                return false;
            }
        } catch (e) {
            await this.helperService.sendMessage(`Bad response from ${config.origin} at 'securityToken', ${e.message}`, 'badResponse');
        }
    }
    public async requestMetaModel(userId: number) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const options = {
            url: `https://${config.origin}/api/v2/metadata`,
            method: 'GET',
            gzip: true,
            json: true,
            headers: {
                'user-Agent': config.userAgent,
                Cookie: `PHPSESSID=${config.PHPSESSID}; do_not_share_this_with_anyone_not_even_staff=${config.do_not_share_this_with_anyone_not_even_staff}`
            },
        };
        try {
            return await get(options) as MetaResponse;
        } catch (e) {
            console.log(`Bad response from ${config.origin} at 'requestMetaModel'`);
        }
    }
    public async getUserInventory(userId: number) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const options = {
            url: `https://${config.origin}/api/v2/inventory/user?app=730`,
            method: 'GET',
            gzip: true,
            json: true,
            headers: {
                'user-Agent': config.userAgent,
                Cookie: `PHPSESSID=${config.PHPSESSID}; do_not_share_this_with_anyone_not_even_staff=${config.do_not_share_this_with_anyone_not_even_staff}`
            },
        };
        try {
            return await get(options) as InventoryResponse;
        } catch (e) {
            await this.helperService.sendMessage(`Bad response from ${config.origin} at 'getUserInventory', ${e.message}`, 'badResponse');
            return false;
        }
    }
    public async delistItem(userId, botId) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const options = {
            url: `https://${config.origin}/api/v2/trade/steam/deposit/cancel`,
            method: 'POST',
            json: {
                id: botId,
            },
            headers: {
                'user-Agent': config.userAgent,
                Cookie: `PHPSESSID=${config.PHPSESSID}; do_not_share_this_with_anyone_not_even_staff=${config.do_not_share_this_with_anyone_not_even_staff}`
            },
        };

        try {
            return await get(options) as CancelResponse;
        } catch (e) {
            await this.helperService.sendMessage(`Bad response from ${config.origin} at 'delistItem', ${e.message}`, 'badResponse');
        }
    }
    public async confirmTrade(userId, depositId) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const options = {
            url: `https://${config.origin}/api/v2/p2p/afk-confirm`,
            json: {
                id: depositId,
            },
            headers: {
                'user-Agent': config.userAgent,
                Cookie: `PHPSESSID=${config.PHPSESSID}; do_not_share_this_with_anyone_not_even_staff=${config.do_not_share_this_with_anyone_not_even_staff}`
            },
        };

        try {
            return await post(options) as CancelResponse;
        } catch (e) {
            await this.helperService.sendMessage(`Bad response from ${config.origin} at 'confirmTrade', ${e.message}`, 'badResponse');
        }
    }
    public async selfLock(userId, period = 24) {
        // adding next selflock event, only support 24h period...
        setTimeout(async () => {
            await this.selfLock(userId, period);
        }, (period * 60 * 60 * 1000) + (60 * 1000));

        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const securityToken = await this.securityToken(userId);
        const options = {
            url: `https://${config.origin}/api/v2/user/self-lock`,
            method: 'POST',
            json: {
                period,
                security_token: securityToken
            },
            headers: {
                'user-Agent': config.userAgent,
                Cookie: `PHPSESSID=${config.PHPSESSID}; do_not_share_this_with_anyone_not_even_staff=${config.do_not_share_this_with_anyone_not_even_staff}`
            },
        };

        try {
            return await post(options) as SelfLockResponse;
        } catch (e) {
            await this.helperService.sendMessage(`Bad response from ${config.origin} at 'selfLock', ${e.message}`, 'badResponse');
        }

    }
}
