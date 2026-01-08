import settings from './settingsManager.js';

class PresenceManager {
    constructor() {
        this.socket = null;
    }

    init(socket) {
        this.socket = socket;
    }

    async handleMessage(chatId) {
        if (!this.socket) return;

        const isAutowrite = settings.get('autowrite');
        const isAutorecord = settings.get('autorecord');

        if (isAutowrite) {
            await this.socket.sendPresenceUpdate('composing', chatId);
        } else if (isAutorecord) {
            await this.socket.sendPresenceUpdate('recording', chatId);
        }
    }
}

export default new PresenceManager();
