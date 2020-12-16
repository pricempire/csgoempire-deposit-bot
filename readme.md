# CSGOempire Deposit bot
#### USE THIS CODE AT YOUR OWN RISK, I DON'T TAKE RESPONSIBILITY FOR STEAM TRADE BANS
#

You can configure the bot as you want. 

## Features

- CSGOEmpire 2FA support.
- Multi account support.
- Auto confirm the deposit.
- Auto delist / dodge the trade if the item dropped in its price.
- Auto send the offer via Steam.
- Auto send the offer via [Browser Extension](https://csgotrader.app/).
- Discord Notifications.
- Pushover Notifications.
- [Pricempire.com](https://pricempire.com/peer) Price-Peer.


## Installation

Install Node.js v12 from [here](https://nodejs.org/dist/v12.17.0/node-v12.17.0-x64.msi).
- **Clone** this repository
- **Unzip**
- Open **install.cmd**
- Rename **example.config.json** file to **config.json**
- Edit the **example.config.json** file
- Open **start.cmd**


## Cookies
This script require 2 cookies (3 if you use 2FA) from your browser.

- PHPSESSID
- do_not_share_this_with_anyone_not_even_staff

## 2FA and PIN only for Self-lock feature. You don't have to add it to config. 

Additionally for 2FA:
- device_auth_[userId]

You have to put the correct cookies to the config.json

#### For the steam config, you need [SDA](https://github.com/Jessecar96/SteamDesktopAuthenticator) to get the sharedSecret & identitySecret.

##### To send offers from your browser (mobile confirmation required), get the [CSGOTRADER.APP](https://csgotrader.app/) extension end enable "Send offers based on query params".
### If you remove your authenticator from your mobile, you will face 15 days tradeban.

#### Config example [HERE](https://github.com/antal-k/antal-k-csgoempire-deposit/blob/main/config.md)

 
## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
