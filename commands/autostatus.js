/**
 * 𝗦𝗘𝗡 Bot - Auto Status Commands
 * Autostatus view, Autostatus react
 */

import { isOwner } from '../lib/authHelper.js';
import lang from '../lib/languageManager.js';
import configs from '../configs.js';
import autoStatusManager from '../lib/autoStatusManager.js';

/**
 * Commande .autostatus - Active/désactive la visualisation automatique des status
 */
export async function autostatusCommand(sock, chatId, message, args) {
    try {
        if (!await isOwner(sock, message, configs)) {
            return sock.sendMessage(chatId, {
                text: lang.t('errors.ownerOnly')
            }, { quoted: message });
        }

        if (args.length === 0) {
            const status = autoStatusManager.isViewEnabled();
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autostatus.status', {
                    status: status ? lang.t('commands.autostatus.on') : lang.t('commands.autostatus.off')
                })
            }, { quoted: message });
        }

        const action = args[0].toLowerCase();
        
        if (action !== 'on' && action !== 'off') {
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autostatus.invalidOption')
            }, { quoted: message });
        }

        const enabled = action === 'on';
        autoStatusManager.setView(enabled);

        await sock.sendMessage(chatId, {
            text: lang.t('commands.autostatus.updated', {
                status: enabled ? lang.t('commands.autostatus.enabled') : lang.t('commands.autostatus.disabled')
            })
        }, { quoted: message });

    } catch (error) {
        console.error('Autostatus Error:', error);
        await sock.sendMessage(chatId, {
            text: lang.t('errors.commandFailed')
        }, { quoted: message });
    }
}

/**
 * Commande .autostatusreact - Active/désactive les réactions automatiques aux status
 * Usage: .autostatusreact on/off [emoji]
 */
export async function autostatusreactCommand(sock, chatId, message, args) {
    try {
        if (!await isOwner(sock, message, configs)) {
            return sock.sendMessage(chatId, {
                text: lang.t('errors.ownerOnly')
            }, { quoted: message });
        }

        if (args.length === 0) {
            const status = autoStatusManager.isReactEnabled();
            const emoji = autoStatusManager.getReactEmoji();
            
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autostatusreact.status', {
                    status: status ? lang.t('commands.autostatusreact.on') : lang.t('commands.autostatusreact.off'),
                    emoji: emoji
                })
            }, { quoted: message });
        }

        const action = args[0].toLowerCase();
        
        if (action !== 'on' && action !== 'off') {
            return sock.sendMessage(chatId, {
                text: lang.t('commands.autostatusreact.invalidOption')
            }, { quoted: message });
        }

        const enabled = action === 'on';
        
        // Si un emoji est fourni, on l'utilise
        const customEmoji = args[1] || null;
        
        if (customEmoji) {
            autoStatusManager.setReactEmoji(customEmoji);
        }
        
        autoStatusManager.setReact(enabled);

        const currentEmoji = autoStatusManager.getReactEmoji();

        await sock.sendMessage(chatId, {
            text: lang.t('commands.autostatusreact.updated', {
                status: enabled ? lang.t('commands.autostatusreact.enabled') : lang.t('commands.autostatusreact.disabled'),
                emoji: currentEmoji
            })
        }, { quoted: message });

    } catch (error) {
        console.error('Autostatusreact Error:', error);
        await sock.sendMessage(chatId, {
            text: lang.t('errors.commandFailed')
        }, { quoted: message });
    }
}

export default { 
    autostatusCommand, 
    autostatusreactCommand 
};