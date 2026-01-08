import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import lang from '../lib/languageManager.js';

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

export async function updateCommand(sock, chatId, message, args) {
    await sock.sendMessage(chatId, { text: lang.t('update.checking') }, { quoted: message });

    const gitDir = path.join(process.cwd(), '.git');
    const hasGit = fs.existsSync(gitDir);

    try {
        if (hasGit) {
            // Mise à jour via GIT
            const stdout = await run('git pull');
            if (stdout.includes('Already up to date')) {
                await sock.sendMessage(chatId, { text: lang.t('update.uptodate') }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { text: lang.t('update.updating') }, { quoted: message });
                await run('npm install'); // Re-install deps if any change
                await sock.sendMessage(chatId, { text: lang.t('update.success') }, { quoted: message });
                process.exit(0);
            }
        } else {
            // Mise à jour via ZIP (logique simplifiée du aide.txt)
            // Note: Pour Sen Bot, on privilégie GIT car c'est un panel.
            // Mais on peut ajouter une URL de secours.
            await sock.sendMessage(chatId, { text: '> Mode Git non détecté. Mise à jour manuelle requise via le panel.' }, { quoted: message });
        }
    } catch (err) {
        console.error('Update failed:', err);
        await sock.sendMessage(chatId, { text: lang.t('update.failed') + '\n' + err.message }, { quoted: message });
    }
}