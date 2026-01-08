import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import lang from '../lib/languageManager.js';

// URL du repo (branche main)
const UPDATE_URL = 'https://github.com/stephdev12/sen-bot/archive/refs/heads/main.zip';

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function extractZip(zipPath, outDir) {
    if (process.platform === 'win32') {
        const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`;
        await run(cmd);
    } else {
        // Linux: try unzip
        try {
            await run(`unzip -o '${zipPath}' -d '${outDir}'`);
        } catch {
            // Fallback to busybox unzip or 7z if needed, but standard unzip is usually there
            throw new Error("Unzip tool not found. Please install unzip.");
        }
    }
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

export async function updateCommand(sock, chatId, message, args) {
    await sock.sendMessage(chatId, { text: lang.t('update.checking') }, { quoted: message });

    const tmpDir = path.join(process.cwd(), 'temp_update');
    const zipPath = path.join(tmpDir, 'update.zip');
    const extractPath = path.join(tmpDir, 'extracted');

    try {
        // 1. Prepare temp dirs
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.mkdirSync(tmpDir, { recursive: true });

        // 2. Download
        await sock.sendMessage(chatId, { text: lang.t('update.updating') }, { quoted: message });
        await downloadFile(UPDATE_URL, zipPath);

        // 3. Extract
        await extractZip(zipPath, extractPath);

        // 4. Locate source (GitHub zips creates a folder inside like 'sen-bot-main')
        const items = fs.readdirSync(extractPath);
        const sourceDir = path.join(extractPath, items[0]);

        // 5. Copy files (Excluding sensitive data)
        const ignored = ['node_modules', 'session', '.env', 'logs.txt', 'temp', 'data'];
        
        const copyFiltered = (src, dest) => {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest);
            const entries = fs.readdirSync(src);
            
            for (const entry of entries) {
                if (ignored.includes(entry)) continue;
                
                const srcPath = path.join(src, entry);
                const destPath = path.join(dest, entry);
                const stat = fs.statSync(srcPath);

                if (stat.isDirectory()) {
                    copyFiltered(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        };

        copyFiltered(sourceDir, process.cwd());

        // 6. Cleanup
        fs.rmSync(tmpDir, { recursive: true, force: true });

        // 7. Update Deps (optional, risky if slow)
        // await run('npm install'); 

        await sock.sendMessage(chatId, { text: lang.t('update.success') }, { quoted: message });
        
        // 8. Restart
        setTimeout(() => {
            process.exit(0); // Le gestionnaire de processus (PM2 ou Panel) redémarrera le bot
        }, 1000);

    } catch (err) {
        console.error('Update failed:', err);
        await sock.sendMessage(chatId, { text: lang.t('update.failed') + '\n' + err.message }, { quoted: message });
    }
}
