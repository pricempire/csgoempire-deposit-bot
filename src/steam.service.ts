import { Config, Csgoempire, Steam } from "./config.models";
import { HelperService } from "./helper.service";

const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamTotp = require('steam-totp');

export class SteamService {
    private managers = {};
    private helperService: HelperService;
    private steam = new SteamCommunity();
    private config: Config = require('../config.json');
    constructor() {
        this.helperService = new HelperService();
        this.helperService.asyncForEach(this.config.settings.csgoempire, async (config: Csgoempire) => {
            if (config.steam.accountName) {
                try {
                    const cookies = await this.login(config.steam);
                    this.helperService.sendMessage(`Steam login success for ${config.steam.accountName}`, 'steamLoginSuccess');
                    this.managers[config.steam.accountName] = new TradeOfferManager({
                        domain: 'localhost',
                        language: "en",
                        pollInterval: 120000,
                        cancelTime: 9 * 60 * 1000, // cancel outgoing offers after 9mins
                    });
                    this.managers[config.steam.accountName].setCookies(cookies, function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                    });
                } catch (err) {
                    this.helperService.sendMessage(`Steam login fail for ${config.steam.accountName}: ${err.message}`, 'steamLoginFailed');
                }
                await this.helperService.delay(10000);
            }
        });
    }
    async sendOffer(sendItems, tradeURL: string, userId: number) {
        const config = this.config.settings.csgoempire.find(config => config.userId === userId);
        const items = [];
        sendItems.forEach(item => {
            items.push({
                assetid: item.asset_id,
                appid: item.app_id,
                contextid: item.context_id,
            });
        });
        const offer = this.managers[config.steam.accountName].createOffer(tradeURL);
        offer.addMyItems(items);
        await offer.send();
        setTimeout(() => {
            this.steam.acceptConfirmationForObject(config.steam.identitySecret, offer.id, status => {
                this.helperService.sendMessage(`Deposit item sent & confirmed`, 'steamOfferConfirmed');
            });
        }, 3000);
    }
    async login(config: Steam) {
        return new Promise((resolve, reject) => {
            this.steam.login({
                accountName: config.accountName,
                password: config.password,
                twoFactorCode: SteamTotp.getAuthCode(config.sharedSecret)
            }, function (err, sessionID, cookies, steamguard) {
                if (err) {
                    return reject(err);
                }
                return resolve(cookies);
            });
        })
    }
}