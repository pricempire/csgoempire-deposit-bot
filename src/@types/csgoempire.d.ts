interface Data3 {
	app_id: number;
	appid: number;
	asset_id: string;
	assetid: string;
	color: string;
	context_id: string;
	contextid: string;
	icon_url: string;
	id: string;
	img: string;
	is_commodity: boolean;
	market_name: string;
	market_value: number;
	name: string;
	name_color: string;
	paint_index?: any;
	preview_id?: any;
	price_is_unreliable: boolean;
	raw_price: number;
	tradable: boolean;
	tradelock: any;
	type: string;
	wear?: any;
	invalid: string;
}

interface InventoryResponse {
	success: boolean;
	data: Data3[];
}

interface Room {
	id: number;
	name: string;
	img: string;
	country: string;
}

interface Session {
	id: number;
	user_id: number;
	ip: string;
	expired: boolean;
	created_at: string;
	updated_at: string;
	device_identifier: string;
	user_agent: string;
	hash: string;
}

interface Role {
	id: number;
	name: string;
	display_name: string;
	description: string;
	created_at: string;
	updated_at: string;
	level: number;
	max_win_customer_modifier?: number;
}

interface LastSession {
	id: number;
	user_id: number;
	ip: string;
	expired: boolean;
	created_at: string;
	updated_at: string;
	device_identifier: string;
	user_agent: string;
	hash: string;
	city: string;
	country: string;
}

interface User {
	id: number;
	steam_id: string;
	steam_id_v3: string;
	steam_name: string;
	avatar: string;
	profile_url: string;
	registration_timestamp: string;
	registration_ip: string;
	last_login: string;
	balance: number;
	total_profit: number;
	total_bet: number;
	betback_total: number;
	bet_threshold: number;
	total_trades: number;
	total_deposit: number;
	total_withdraw: number;
	withdraw_limit: number;
	csgo_playtime: number;
	last_csgo_playtime_cache: string;
	trade_url: string;
	trade_offer_token: string;
	ref_id: number;
	total_referral_bet: number;
	total_referral_commission: number;
	ref_permission: number;
	ref_earnings: number;
	total_ref_earnings: number;
	total_ref_count: number;
	total_credit: number;
	referral_code: string;
	referral_amount: number;
	muted_until: number;
	mute_reason: string;
	admin: number;
	super_mod: number;
	mod: number;
	utm_campaign: string;
	country: string;
	is_vac_banned: number;
	steam_level: number;
	last_steam_level_cache: string;
	whitelisted: number;
	total_tips_received: number;
	total_tips_sent: number;
	withdrawal_fee_owed: string;
	flags: number;
	sessions: Session[];
	ban?: any;
	level: number;
	xp: number;
	socket_token: string;
	user_hash: string;
	hashed_server_seed: string;
	intercom_hash: string;
	roles: Role[];
	extra_security_type: string;
	total_bet_skincrash: number;
	total_bet_matchbetting: number;
	total_bet_roulette: number;
	total_bet_coinflip: number;
	total_bet_supershootout: number;
	p2p_deposits_completed: number;
	bot_withdraw_allowed: boolean;
	auction_deposits_enabled: boolean;
	verified: boolean;
	hide_verified_icon: boolean;
	unread_notifications: any[];
	last_session: LastSession;
	email: string;
	email_verified: boolean;
	btc_deposit_address: string;
	eth_deposit_address: string;
	ltc_deposit_address: string;
	bch_deposit_address: string;
	steam_inventory_url: string;
	steam_api_key: string;
	has_crypto_deposit: boolean;
}

interface MetaResponse {
	rooms: Room[];
	device: string;
	user: User;
	socket_token: string;
	socket_signature: string;
	country: string;
	is_hermes_enabled: boolean;
	is_match_betting_enabled: boolean;
	is_supershootout_enabled: boolean;
	is_coinflip_enabled: boolean;
	is_price_request_enabled: boolean;
	chat_roulette_enabled_when_logged_out: boolean;
	session_id: string;
}

interface CancelResponse {
	success: boolean;
}

interface SecurityTokenResponse {
	success: boolean;
	token: string;
	token_type: string;
	expires_in: number;
}

interface GetActiveTradesResponse {
	success: boolean;
	data: {
		deposits: Deposit[],
		withdrawals: any[]
	}
}

interface AuctionUpdate {
	app_id: number;
	asset_id: string;
	auction_highest_bid: number;
	auction_highest_bidder: number;
	auction_number_of_bids: number;
	auction_ends_at: number;
}

interface Item {
	app_id: number;
	asset_id: string;
	context_id: string;
	created_at: number;
	img: string;
	is_commodity: boolean;
	market_name: string;
	market_value: number;
	paint_index?: any;
	preview_id?: any;
	price_is_unreliable: boolean;
	raw_price: number;
	tradable: boolean;
	tradelock: boolean;
	type: string;
	wear?: any;
	custom_price: number;
}

interface Profile {
	name: string;
	avatar_url: string;
	steam_id: string;
	custom_url: string;
	timecreated: number;
	steam_level: number;
}

interface Data {
	item: Item;
	metadata: Metadata;
	id: number;
	user_id: number;
	bot_id?: any;
	total_value: number;
	security_code: string;
	tradeoffer_id: string;
	trade_id: string;
	status: number;
	status_message: string;
	createdAt: Date;
	updatedAt: Date;
	botId?: any;
	status_text: string;
}

interface TradeStatus {
	type: string;
	data: Data;
}
interface P2PNewItem {
	appid: number;
	assetid: string;
	auction_ends_at: number;
	auction_highest_bid?: any;
	auction_highest_bidder?: any;
	auction_number_of_bids: number;
	bot_id: number;
	bundle_id?: any;
	color: string;
	contextid: string;
	custom_name?: any;
	icon_url: string;
	id: string;
	img: string;
	market_name: string;
	market_value: number;
	name: string;
	name_color: string;
	paint_index?: any;
	paint_seed?: any;
	preview_id?: any;
	price_is_unreliable: boolean;
	stickers: any[];
	tradable: boolean;
	tradelock: boolean;
	type: string;
	wear?: any;
	model_id: number;
}

interface Ban {
	type: string;
	type_int: number;
	expires_at: string;
	reason: string;
}

interface SelfLockResponse {
	success: boolean;
	ban: Ban;
}

interface Item {
	app_id: number;
	asset_id: string;
	context_id: string;
	created_at: number;
	img: string;
	is_commodity: boolean;
	market_name: string;
	market_value: number;
	paint_index?: any;
	preview_id?: any;
	price_is_unreliable: boolean;
	raw_price: number;
	tradable: boolean;
	tradelock: boolean;
	type: string;
	wear?: any;
}

interface Profile {
	name: string;
	avatar_url: string;
	steam_id: string;
	custom_url: string;
	timecreated: number;
	steam_level: number;
}

interface Metadata {
	auction_item_id: string;
	auction_highest_bid: number;
	auction_highest_bidder: number;
	auction_number_of_bids: number;
	auction_ends_at: number;
	item_inspected: boolean;
	profile: Profile;
	timestamp: number;
	trade_url?: string;
}

interface Deposit {
	id: number;
	user_id: number;
	bot_id?: any;
	items: Item[];
	total_value: number;
	security_code: string;
	tradeoffer_id: number;
	trade_id: number;
	status: number;
	status_message: string;
	metadata: Metadata;
	created_at: string;
	updated_at: string;
	status_text: string;
}

interface Data2 {
	deposits: Deposit[];
	withdrawals: any[];
}

interface DepositResponse {
	data: Data2;
}
