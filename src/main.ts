import { BotService } from "./services/bot";

async function bootstrap() {
	// start the bot
	const bot = new BotService();
	setInterval(() => {
		//
	}, 60000);
}
bootstrap();
