interface Discord {
	enabled: boolean;
	discordHook: string;
	userId: string;
}

interface Pushover {
	enabled: boolean;
	pushoverUser: string;
	pushoverToken: string;
}

interface Csgoempire {
	userId: number;
	steam: Steam;
	csgotrader: boolean;
	origin: string;
	delistThreshold: number;
	csgoempireApiKey: string;
}
interface Steam {
	accountName: string;
	password: string;
	sharedSecret: string;
	identitySecret: string;
	acceptOffers: boolean;
	proxy: string;
}

interface Settings {
	debug: boolean;
	logging: boolean;
	discord: Discord;
	pushover: Pushover;
	csgoempire: Csgoempire[];
}

interface Notifications {
	steamLoginSuccess: boolean;
	steamLoginFailed: boolean;
	steamWebSession: boolean;
	steamManagerSetCookiesFailed: boolean;
	steamManagerSetCookiesSuccess: boolean;
	steamClientError: boolean;
	steamDisconnected: boolean;
	steamAccountLimitations: boolean;
	connectEmpire: boolean;
	p2pItemUpdatedDelist: boolean;
	p2pItemUpdatedPriceChanged: boolean;
	tradeStatusSending: boolean;
	tradeStatusCompleted: boolean;
	tradeStatusTimedOut: boolean;
	tradeStatusDodge: boolean;
	steamOfferConfirmed: boolean;
	steamSessionExpired: boolean;
	badResponse: boolean;
}

interface Config {
	settings: Settings;
	notifications: Notifications;
}
