require('dotenv').config();

const { HelperService: { env } } = require('./dist/services/helper');

module.exports = {
	settings: {
		logging: env('LOGGING', false), // if true, logs are saved to /logs folder.
		discord: {
			enabled: env('DISCORD_ENABLED', true), // if true, it will use the discordHook for sending messages.
			userId: env('DISCORD_USER_ID', '12345.......'),
			discordHook: env('DISCORD_HOOK', 'https://discord.com/api/webhooks/.....')
		},
		pushover: {
			enabled: env('PUSHOVER_ENABLED', false), // if true, it will send message to pushover.
			pushoverUser: env('PUSHOVER_USER', 'aaaaaaaaaaaaaa'),
			pushoverToken: env('PUSHOVER_TOKEN', 'aaaaaaaaaaaaaa')
		},
		csgoempire: [
			{
				userId: env('CSGOEMPIRE_USER_ID', 12345), // Userid from your 'do_not_share_this_with_anyone_not_even_staff' cookie (first few number).
				origin: env('CSGOEMPIRE_ORIGIN', 'csgoempire.com'), // The site you using for trading.
				csgoempireApiKey: env('CSGOEMPIRE_API_KEY', '12345678923456789234567'), // https://csgoempire.com/trading/apikey
				csgotrader: env('CSGOTRADER', false), // set true if you using Gery's chrome extension, to autosend the offers
				delistThreshold: env('DELIST_THRESHOLD', 5), // The percentage to delist the item if its drop in price.
				steam: {
					accountName: env('STEAM_ACCOUNT_NAME', false), // Your Steam username (not necessary), set false to disable steam
					password: env('STEAM_PASSWORD', 'aaaaaaaaaaaaaa'), // Your Steam password (not necessary)
					identitySecret: env('STEAM_IDENTITY_SECRET', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa='), // Your Steam identitySecret (not necessary)
					sharedSecret: env('STEAM_SHARED_SECRET', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa='), // Your Steam sharedSecret (not necessary)
					acceptOffers: env('STEAM_ACCEPT_OFFERS', true), // Automatically accepts Steam Offers empty from out side
				},
			},
		],
	},
    // Notification will be sent if true on specified events.
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
