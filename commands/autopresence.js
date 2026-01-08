/**
 * 𝗦𝗘𝗡 Bot - Auto Presence Commands
 * Autorecord, Autowrite
 */

import { isOwner } from '../lib/authHelper.js';
import lang from '../lib/languageManager.js';
import configs from '../configs.js';
import autoPresenceManager from '../lib/autoPresenceManager.js';

/**
 * Commande .autorecord - Active/désactive l'état "recording"
 */
export async function autorecordCommand(sock, chatId, message, args) {
    try {
        if (!await isOwner(sock, message, configs)) {
            return sock.sendMessage(chatId, {
                text: lang.t('errors.ownerOnly')
            }, { quoted: message });
        }

        if (args.length === 0) {
            const status = autoPresenceManager.isRecordingEnabled();
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autorecord.status', {
                    status: status ? lang.t('commands.autorecord.on') : lang.t('commands.autorecord.off')
                })
            }, { quoted: message });
        }

        const action = args[0].toLowerCase();
        
        if (action !== 'on' && action !== 'off') {
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autorecord.invalidOption')
            }, { quoted: message });
        }

        const enabled = action === 'on';
        autoPresenceManager.setRecording(enabled, sock);

        await sock.sendMessage(chatId, {
            text: lang.t('commands.autorecord.updated', {
                status: enabled ? lang.t('commands.autorecord.enabled') : lang.t('commands.autorecord.disabled')
            })
        }, { quoted: message });

    } catch (error) {
        console.error('Autorecord Error:', error);
        await sock.sendMessage(chatId, {
            text: lang.t('errors.commandFailed')
        }, { quoted: message });
    }
}

/**
 * Commande .autowrite - Active/désactive l'état "typing"
 */
export async function autowriteCommand(sock, chatId, message, args) {
    try {
        if (!await isOwner(sock, message, configs)) {
            return sock.sendMessage(chatId, {
                text: lang.t('errors.ownerOnly')
            }, { quoted: message });
        }

        if (args.length === 0) {
            const status = autoPresenceManager.isTypingEnabled();
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autowrite.status', {
                    status: status ? lang.t('commands.autowrite.on') : lang.t('commands.autowrite.off')
                })
            }, { quoted: message });
        }

        const action = args[0].toLowerCase();
        
        if (action !== 'on' && action !== 'off') {
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autowrite.invalidOption')
            }, { quoted: message });
        }

        const enabled = action === 'on';
        autoPresenceManager.setTyping(enabled, sock);

        await sock.sendMessage(chatId, {
            text: lang.t('commands.autowrite.updated', {
                status: enabled ? lang.t('commands.autowrite.enabled') : lang.t('commands.autowrite.disabled')
            })
        }, { quoted: message });

    } catch (error) {
        console.error('Autowrite Error:', error);
        await sock.sendMessage(chatId, {
            text: lang.t('errors.commandFailed')
        }, { quoted: message });
    }
}

export default { 
    autorecordCommand, 
    autowriteCommand 
};