
export interface Discord {
    enabled: boolean;
    discordHook: string;
    userId: string;
}

export interface Pushover {
    enabled: boolean;
    pushoverUser: string;
    pushoverToken: string;
}

export interface Pricempire {
    authToken: string;
}

export interface Csgoempire {
    userId: number;
    userAgent: string;
    securityCode: string;
    PHPSESSID: string;
    do_not_share_this_with_anyone_not_even_staff: string;
    uuid: string;
    device_auth: string;
    steam: Steam;
    csgotrader: boolean;
    selflock: boolean;
    origin: string;
    delistThreshold: number;
}
export interface Steam {
    accountName: string;
    password: string;
    sharedSecret: string;
    identitySecret: string;
}

export interface Settings {
    logging: boolean;
    discord: Discord;
    pushover: Pushover;
    pricempire: Pricempire;
    csgoempire: Csgoempire[];
}

export interface Notifications {
    steamLoginSuccess: boolean;
    steamLoginFailed: boolean;
    connectEmpire: boolean;
    p2pItemUpdatedDelist: boolean;
    p2pItemUpdatedPriceChanged: boolean;
    tradeStatusSending: boolean;
    tradeStatusCompleted: boolean;
    tradeStatusTimedOut: boolean;
    tradeStatusDodge: boolean;
    steamOfferConfirmed: boolean;
    badResponse: boolean;
}

export interface Config {
    settings: Settings;
    notifications: Notifications;
}
