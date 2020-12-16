import { convertTypeAcquisitionFromJson } from 'typescript';
import { Config } from './config.models';
import { CsgoempireService } from './csgoempire.service';
import { HelperService } from './helper.service';

const io = require('socket.io-client');

export class BotService {
    private pricempire;
    private config: Config = require('../config.json');

    constructor(
        private csgoempireService = new CsgoempireService(),
        private helperService = new HelperService()
    ) {
        this.initPeer();
        csgoempireService.pricempire = this.pricempire;
    }

    private initPeer() {
        this.pricempire = io(process.env.npm_lifecycle_event === 'start:dev' ? 'ws://localhost:5000/peer' : 'wss://bot.pricempire.com/peer', {
            transports: ['websocket']
        });
        this.pricempire.on('connect', () => {
            this.pricempire.emit('auth', this.config.settings.pricempire.authToken);
        });

    }
}

