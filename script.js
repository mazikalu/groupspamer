// Advanced Discord Manager
class DiscordManager {
    constructor() {
        this.token = '';
        this.messageContent = '';
        this.targetUserIds = [];
        this.isRunning = false;
        this.stats = {
            groupsCreated: 0,
            messagesSent: 0,
            groupsTarget: 10,
            messagesTarget: 5
        };
        this.settings = {
            showLogs: false,
            spamDm: false,
            leaveGroup: false,
            pingTest: true
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.startPingTest();
    }

    bindEvents() {

        document.getElementById('messageFile').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        document.getElementById('groupCount').addEventListener('change', (e) => {
            this.stats.groupsTarget = parseInt(e.target.value) || 10;
            this.updateStats();
        });

        document.getElementById('messageCount').addEventListener('change', (e) => {
            this.stats.messagesTarget = parseInt(e.target.value) || 5;
            this.updateStats();
        });

        document.getElementById('token').addEventListener('input', (e) => {
            this.token = e.target.value.trim();
        });
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        document.getElementById('fileName').textContent = file.name;

        try {
            this.messageContent = await this.readFileContent(file);
            this.log('ファイルを読み込みました: ' + file.name, 'success');
        } catch (error) {
            this.log('ファイルの読み込みに失敗しました: ' + error.message, 'error');
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイル読み込みエラー'));
            reader.readAsText(file);
        });
    }

    async startOperation() {
        if (this.isRunning) return;

        const token = document.getElementById('token').value.trim();
        if (!token) {
            this.showNotification('トークンを入力してください', 'error');
            return;
        }

        if (!this.messageContent) {
            this.showNotification('メッセージファイルを選択してください', 'error');
            return;
        }

        this.isRunning = true;
        this.stats.groupsCreated = 0;
        this.stats.messagesSent = 0;
        this.updateStats();

        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').classList.add('loading');

        try {

            const isValid = await this.validateToken(token);
            if (!isValid) {
                throw new Error('無効なトークンです');
            }

            this.log('実行を開始します...', 'info');

            await this.executeMainOperation();

        } catch (error) {
            this.log('エラー: ' + error.message, 'error');
        } finally {
            this.stopOperation();
        }
    }

    stopOperation() {
        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').classList.remove('loading');
        this.log('操作を停止しました', 'warning');
    }

    async executeMainOperation() {

        for (let i = 0; i < this.stats.groupsTarget && this.isRunning; i++) {
            await this.simulateGroupCreation();
            this.stats.groupsCreated++;
            this.updateStats();
            
            const progress = (this.stats.groupsCreated / this.stats.groupsTarget) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            
            await this.delay(1000); // 1秒待機
        }
        
        if (this.settings.spamDm && this.isRunning) {
            await this.executeDmSpam();
        }
    }

    async simulateGroupCreation() {
        this.log(`グループを作成中... (${this.stats.groupsCreated + 1}/${this.stats.groupsTarget})`, 'info');
        await this.delay(500);
        
        if (Math.random() > 0.1) { // 90% 成功率
            this.log('グループの作成に成功しました', 'success');
            return true;
        } else {
            this.log('グループの作成に失敗しました', 'error');
            return false;
        }
    }

    async executeDmSpam() {
        this.log('DMスパムを開始します...', 'info');
        
        for (let i = 0; i < this.stats.messagesTarget && this.isRunning; i++) {
            await this.simulateMessageSend();
            this.stats.messagesSent++;
            this.updateStats();
            await this.delay(300);
        }
    }

    async simulateMessageSend() {
        this.log(`メッセージを送信中... (${this.stats.messagesSent + 1}/${this.stats.messagesTarget})`, 'info');
        await this.delay(200);
        
        if (Math.random() > 0.05) { // 95% 成功率
            this.log('メッセージの送信に成功しました', 'success');
            return true;
        } else {
            this.log('メッセージの送信に失敗しました', 'error');
            return false;
        }
    }

    async validateToken(token) {

        this.log('トークンを検証中...', 'info');
        await this.delay(1000);
        
        return token.length > 10;
    }

    async startPingTest() {
        if (!this.settings.pingTest) return;
        
        setInterval(async () => {
            const ping = await this.testPing();
            this.updatePingDisplay(ping);
        }, 5000);
    }

    async testPing() {
        try {
            const startTime = Date.now();

            await fetch('https://discord.com/api/v9/gateway', { method: 'HEAD' });
            return Date.now() - startTime;
        } catch (error) {
            return -1;
        }
    }

    updatePingDisplay(ping) {
        const pingElement = document.getElementById('pingValue');
        const indicator = document.querySelector('.ping-indicator');
        
        pingElement.textContent = ping >= 0 ? ping : '---';
        
        if (ping < 0) {
            indicator.className = 'ping-indicator ping-bad';
        } else if (ping < 100) {
            indicator.className = 'ping-indicator ping-good';
        } else if (ping < 300) {
            indicator.className = 'ping-indicator ping-medium';
        } else {
            indicator.className = 'ping-indicator ping-bad';
        }
    }

    log(message, type = 'info') {
        const logBox = document.getElementById('logBox');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        `;
        
        logBox.appendChild(logEntry);
        logBox.scrollTop = logBox.scrollHeight;
    }

    showNotification(message, type = 'info') {

        this.log(message, type);
    }

    updateStats() {
        document.getElementById('groupsCreated').textContent = this.stats.groupsCreated;
        document.getElementById('messagesSent').textContent = this.stats.messagesSent;
        document.getElementById('floatGroups').textContent = this.stats.groupsCreated;
        document.getElementById('floatMessages').textContent = this.stats.messagesSent;
        
        const successRate = this.stats.groupsCreated > 0 ? 
            Math.round((this.stats.groupsCreated / this.stats.groupsTarget) * 100) : 100;
        document.getElementById('successRate').textContent = successRate + '%';
    }

    loadSettings() {

        const saved = localStorage.getItem('discordManagerSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            this.updateCheckboxes();
        }
    }

    saveSettings() {
        localStorage.setItem('discordManagerSettings', JSON.stringify(this.settings));
    }

    updateCheckboxes() {
        Object.keys(this.settings).forEach(key => {
            const checkbox = document.getElementById(key + 'Checkbox');
            if (checkbox) {
                checkbox.className = this.settings[key] ? 'checkbox checked' : 'checkbox';
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

function toggleCheckbox(setting) {
    const manager = window.discordManager;
    manager.settings[setting] = !manager.settings[setting];
    manager.updateCheckboxes();
    manager.saveSettings();
}

function startOperation() {
    window.discordManager.startOperation();
}

function stopOperation() {
    window.discordManager.stopOperation();
}

function clearLogs() {
    document.getElementById('logBox').innerHTML = '';
    window.discordManager.log('ログをクリアしました', 'info');
}

document.addEventListener('DOMContentLoaded', () => {
    window.discordManager = new DiscordManager();
});
