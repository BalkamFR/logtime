const { St, GLib, Clutter, Soup, GObject } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

// --- CONFIGURATION ---
const UID = "u-s4t2ud-f03601c98c248d266a0ff1ad9fa690660dcc1e4a73f3db5d5210d98f44123e26";
const SECRET = "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";
const ME = "papilaz"; // Ton login

// Sur GNOME 42 (Ubuntu 22.04), Soup est souvent en v2.4 par défaut via imports.gi.
// On adapte la session pour être compatible.
const _httpSession = new Soup.SessionAsync();
// Fake user agent pour éviter certains blocages
_httpSession.user_agent = 'LogtimeExtension/1.0';

const DashboardIndicator = GObject.registerClass(
class DashboardIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, "42 Dashboard", false);

        // Label barre du haut
        this.buttonLabel = new St.Label({
            text: "...",
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'lgt-button-label'
        });
        this.add_child(this.buttonLabel);

        // Menu
        // Sur GNOME 42, on accède souvent à 'this.menu.box' différemment, 
        // mais essayons de garder la structure standard.
        this.menu.box.style_class = 'lgt-popup-menu';

        // 1. Timer
        this.timeDisplay = new St.Label({ text: "chargement...", style_class: 'lgt-main-time' });
        this.menu.box.add_child(this.timeDisplay);

        // 2. Stats
        let statsBox = new St.BoxLayout({ vertical: false, style_class: 'lgt-stats-grid' });
        this.walletLbl = this._createStatBox(statsBox, "Wallet", "-");
        this.bhLbl = this._createStatBox(statsBox, "Blackhole", "-");
        this.lvlLbl = this._createStatBox(statsBox, "Level", "-");
        this.menu.box.add_child(statsBox);

        this.menu.box.add_child(new PopupMenu.PopupSeparatorMenuItem());

        // Refresh loop
        this._refresh();
        this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 120, () => {
            this._refresh();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _createStatBox(parent, title, value) {
        let box = new St.BoxLayout({ vertical: true, style_class: 'lgt-stat-box', x_expand: true });
        box.add_child(new St.Label({ text: title, style_class: 'lgt-stat-label' }));
        let valLabel = new St.Label({ text: value, style_class: 'lgt-stat-value' });
        box.add_child(valLabel);
        parent.add_child(box);
        return valLabel;
    }

    async _getToken() {
        if (this.token && this.tokenExpire > (Date.now()/1000)) return this.token;

        // Soup 2.4 syntax
        let msg = Soup.Message.new('POST', 'https://api.intra.42.fr/oauth/token');
        
        let bodyObj = {
            grant_type: 'client_credentials',
            client_id: UID,
            client_secret: SECRET
        };
        let bodyStr = JSON.stringify(bodyObj);
        
        // Soup 2.4 set_request (différent de Soup 3)
        msg.set_request('application/json', 2, bodyStr, bodyStr.length);

        let response = await this._send_async(msg);
        if (!response) return null;

        try {
            let data = JSON.parse(response);
            if (data.error) throw new Error(data.error);

            this.token = data.access_token;
            this.tokenExpire = (Date.now()/1000) + data.expires_in;
            return this.token;
        } catch (e) {
            log("LogtimeAuthError: " + e);
            this.buttonLabel.set_text("ERR AUTH");
            return null;
        }
    }

    async _refresh() {
        let token = await this._getToken();
        if (!token) return;

        let now = new Date();
        let start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        
        // --- 1. LOGTIME ---
        this._fetchJson(`https://api.intra.42.fr/v2/users/${ME}/locations?range[begin_at]=${start},${end}&per_page=100`, token, (d) => {
            if (Array.isArray(d)) {
                let ms = d.reduce((a, l) => a + ((l.end_at ? new Date(l.end_at) : new Date()) - new Date(l.begin_at)), 0);
                let h = Math.floor(ms/3600000);
                let m = Math.floor((ms%3600000)/60000);
                let txt = `${h}h ${m}m`;
                
                this.buttonLabel.set_text(txt);
                this.timeDisplay.set_text(txt);
            } else {
                this.buttonLabel.set_text("ERR API");
            }
        });

        // --- 2. STATS ---
        this._fetchJson(`https://api.intra.42.fr/v2/users/${ME}`, token, (d) => {
            if (!d || d.error) return;
            this.walletLbl.set_text(`${d.wallet} ₳`);
            
            let c = d.cursus_users.find(x => x.cursus.slug === "42cursus") || d.cursus_users[0];
            if (c) {
                this.lvlLbl.set_text(`${Number(c.level).toFixed(2)}`);
                if (c.blackholed_at) {
                    let target = new Date(c.blackholed_at);
                    let diff = Math.round((target - new Date()) / 86400000);
                    this.bhLbl.set_text(`${diff} jours`);
                    if(diff < 30) this.bhLbl.add_style_class_name('lgt-danger');
                    else this.bhLbl.remove_style_class_name('lgt-danger');
                } else {
                    this.bhLbl.set_text("Safe");
                }
            }
        });
    }

    _send_async(msg) {
        return new Promise((resolve, reject) => {
            _httpSession.queue_message(msg, (session, message) => {
                if (message.status_code !== 200 && message.status_code !== 201) {
                    log("API Error: " + message.status_code);
                    resolve(null);
                } else {
                    if (message.response_body && message.response_body.data) {
                        resolve(message.response_body.data);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    _fetchJson(url, token, callback) {
        let msg = Soup.Message.new('GET', url);
        msg.request_headers.append('Authorization', `Bearer ${token}`);
        
        _httpSession.queue_message(msg, (session, message) => {
             if (message.status_code === 200) {
                 try {
                    let data = message.response_body.data;
                    callback(JSON.parse(data));
                 } catch(e) { log(e); }
             }
        });
    }
    
    destroy() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        super.destroy();
    }
});

// --- STANDARD GNOME 42 (LEGACY) ---
let _indicator;

function init() {
    return new Extension();
}

class Extension {
    enable() {
        _indicator = new DashboardIndicator();
        Main.panel.addToStatusArea('logtime-indicator', _indicator);
    }

    disable() {
        if (_indicator) {
            _indicator.destroy();
            _indicator = null;
        }
    }
}