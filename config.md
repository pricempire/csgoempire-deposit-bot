```js
{
    "settings": {
        "logging": false, // if true, logs are saved to /logs folder.
        "discord": {
            "enabled": true, // if true, it will use the discordHook for sending messages.
            "userId": "263780944031252482",
            "discordHook": "https://discord.com/api/webhooks/788791748990206022/3ST-mjkiijagonagsnS214sdffasDFDSAfahgfdaH12412asdfdsfas2"
        },
        "pushover": {
            "enabled": false, // if true, it will send message to pushover.
            "pushoverUser": "aaaaaaaaaaaaaa",
            "pushoverToken": "aaaaaaaaaaaaaa"
        },
        "csgoempire": [
            {
                "userId": 12345, // Userid from your 'do_not_share_this_with_anyone_not_even_staff' cookie (first few number).
                "origin": "csgoempire.com", // The site you using for trading.
                "csgoempireApiKey": "12345678923456789234567", // https://csgoempire.com/trading/apikey
                "csgotrader": false, // set true if you using Gery's chrome extension, to autosend the offers
                "delistThreshold": 5,// The percentage to delist the item if its drop in price.
                "steam": {
                    "accountName": false, // Your Steam username (not necessary), set false to disable steam
                    "password": "aaaaaaaaaaaaaa", // Your Steam password (not necessary)
                    "identitySecret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaa=", // Your Steam identitySecret (not necessary)
                    "sharedSecret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaa=", // Your Steam sharedSecret (not necessary)
					"acceptOffers": true // Automatically accepts Steam Offers empty from out side
                }
            }
        ]
    },
    // Notification will be sent if true on specified events.
    "notifications": {
        "steamLoginSuccess": true,
        "steamLoginFailed": true,
        "connectEmpire": true,
        "p2pItemUpdatedDelist": true,
        "p2pItemUpdatedPriceChanged": true,
        "tradeStatusSending": true,
        "tradeStatusProcessing": true,
        "tradeStatusCompleted": true,
        "tradeStatusTimedOut": true,
        "tradeStatusDodge": true,
		"tradeStatusCanceled": true,
        "steamOfferConfirmed": true,
        "steamSessionExpired": true,
        "badResponse": true
    }
}
```
