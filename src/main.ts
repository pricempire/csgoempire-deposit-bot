import { BotService } from "./bot.service";

async function bootstrap() {
    // start the bot
    const bot = new BotService();
    setInterval( () => {
        //
    }, 60000);
}
bootstrap();
