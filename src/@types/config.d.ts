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

interface Pricempire {
	authToken: string;
}

interface Csgoempire {
	userId: number;
	userAgent: string;
	securityCode: string;
	PHPSESSID: string;
	do_not_share_this_with_anyone_not_even_staff: string;
	steam: Steam;
	csgotrader: boolean;
	origin: string;
	delistThreshold: number;
}
interface Steam {
	accountName: string;
	password: string;
	sharedSecret: string;
	identitySecret: string;
	acceptOffers: boolean
}

interface Settings {
	logging: boolean;
	discord: Discord;
	pushover: Pushover;
	pricempire: Pricempire;
	csgoempire: Csgoempire[];
}

interface Notifications {
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

interface Config {
	settings: Settings;
	notifications: Notifications;
}
