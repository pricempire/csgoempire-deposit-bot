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
        "pricempire": {
            "authToken": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" // Pricempire token from https://pricempire.com/docs-api (doesn't need sub to use this)
        },
        "csgoempire": [
            {
                "userId": 12345, // Userid from your 'do_not_share_this_with_anyone_not_even_staff' cookie (first few number).
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36", // If you using 2FA, this must be setted correctly.
                "securityCode": "0000", // Your CSGOEmpire security code.
                "PHPSESSID": "aaaaaaaaaaaaaaaaaaaaaaaaaaaa",// Your CSGOEmpire PHPSESSID.
                "do_not_share_this_with_anyone_not_even_staff": "12345_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",// Your CSGOEmpire do_not_share_this_with_anyone_not_even_staff.
                "uuid": "aaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa",// Your CSGOEmpire uuid
                "device_auth": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",// Your CSGOEmpire device_auth_[userid] cookie.
                "selflock": true, // If you want to disable gambling in your account.
                "origin": "csgoempire.com", // The site you using for trading.
                "delistThreshold": 5,// The percentage to delist the item if its drop in price.
                "steam": {
                    "enabled": false, // Set true if you want to use auto send offer via steam.
                    "accountName": "aaaaaaaaaaaaaa", // Your Steam username (not necessary)
                    "password": "aaaaaaaaaaaaaa", // Your Steam password (not necessary)
                    "identitySecret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaa=", // Your Steam identitySecret (not necessary)
                    "sharedSecret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaa=" // Your Steam sharedSecret (not necessary)
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
        "steamOfferConfirmed": true,
        "badResponse": true
    }
}
```
