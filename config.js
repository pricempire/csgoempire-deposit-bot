require('dotenv').config();

const { HelperService: { env } } = require('./dist/services/helper');

module.exports = {
	settings: {
		logging: env('LOGGING', false),
		discord: {
			enabled: env('DISCORD_ENABLED', true),
			userId: env('DISCORD_USER_ID', '12345.......'),
			discordHook: env('DISCORD_HOOK', 'https://discord.com/api/webhooks/.....')
		},
		pushover: {
			enabled: env('PUSHOVER_ENABLED', false),
			pushoverUser: env('PUSHOVER_USER', 'aaaaaaaaaaaaaa'),
			pushoverToken: env('PUSHOVER_TOKEN', 'aaaaaaaaaaaaaa')
		},
		csgoempire: [
			{
				userId: env('CSGOEMPIRE_USER_ID', 12345),
				origin: env('CSGOEMPIRE_ORIGIN', 'csgoempire.com'),
				csgoempireApiKey: env('CSGOEMPIRE_API_KEY', '12345678923456789234567'),
				csgotrader: env('CSGOTRADER', false),
				delistThreshold: env('DELIST_THRESHOLD', 5),
				steam: {
					accountName: env('STEAM_ACCOUNT_NAME', false),
					password: env('STEAM_PASSWORD', 'aaaaaaaaaaaaaa'),
					identitySecret: env('STEAM_IDENTITY_SECRET', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa='),
					sharedSecret: env('STEAM_SHARED_SECRET', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa='),
					acceptOffers: env('STEAM_ACCEPT_OFFERS', true)
				},
			},
		],
	},
	notifications: {
		steamLoginSuccess: env('STEAM_LOGIN_SUCCESS', true),
		steamLoginFailed: env('STEAM_LOGIN_FAILED', true),
		connectEmpire: env('CONNECT_EMPIRE', true),
		p2pItemUpdatedDelist: env('P2P_ITEM_UPDATED_DELIST', true),
		p2pItemUpdatedPriceChanged: env('P2P_ITEM_UPDATED_PRICE_CHANGED', true),
		tradeStatusSending: env('TRADE_STATUS_SENDING', true),
		tradeStatusProcessing: env('TRADE_STATUS_PROCESSING', true),
		tradeStatusCompleted: env('TRADE_STATUS_COMPLETED', true),
		tradeStatusTimedOut: env('TRADE_STATUS_TIMED_OUT', true),
		tradeStatusDodge: env('TRADE_STATUS_DODGE', true),
		tradeStatusCanceled: env('TRADE_STATUS_CANCELED', true),
		steamOfferConfirmed: env('STEAM_OFFER_CONFIRMED', true),
		badResponse: env('BAD_RESPONSE', true),
		steamSessionExpired: env('STEAM_SESSION_EXPIRED', true),
	},
};
