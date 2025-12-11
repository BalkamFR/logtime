import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Soup from 'gi://Soup?version=3.0';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

// --- CONFIGURATION ---
const UID = "u-s4t2ud-f03601c98c248d266a0ff1ad9fa690660dcc1e4a73f3db5d5210d98f44123e26";
const SECRET = "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";
const ME = "papilaz"; // <--- REMPLACE PAR TON LOGIN (ex: pacome)

const _httpSession = new Soup.Session();

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

        // Premier appel + boucle
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

        let msg = Soup.Message.new('POST', 'https://api.intra.42.fr/oauth/token');
        
        // Utilisation du format JSON (comme ton extension web)
        let bodyObj = {
            grant_type: 'client_credentials',
            client_id: UID,
            client_secret: SECRET
        };
        let bodyStr = JSON.stringify(bodyObj);
        let bodyBytes = new GLib.Bytes(new TextEncoder().encode(bodyStr));
        
        msg.set_request_body_from_bytes('application/json', bodyBytes);

        try {
            let bytes = await this._send_async(msg);
            // Décodage strict pour GNOME 46
            let text = new TextDecoder().decode(bytes.get_data()); 
            let data = JSON.parse(text);
            
            if (data.error) throw new Error(data.error);

            this.token = data.access_token;
            this.tokenExpire = (Date.now()/1000) + data.expires_in;
            return this.token;
        } catch (e) {
            console.error("Token Error:", e);
            let code = msg.status_code;
            if (code && code !== 200) this.buttonLabel.set_text(`HTTP ${code}`);
            else this.buttonLabel.set_text("ERR AUTH");
            return null;
        }
    }

    async _refresh() {
        let token = await this._getToken();
        if (!token) return; // L'erreur est déjà affichée par _getToken

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
            _httpSession.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (session, result) => {
                try {
                    let bytes = session.send_and_read_finish(result);
                    if (msg.status_code !== 200 && msg.status_code !== 201) {
                         reject(new Error("HTTP " + msg.status_code));
                    } else {
                        resolve(bytes);
                    }
                } catch (e) { reject(e); }
            });
        });
    }

    _fetchJson(url, token, callback) {
        let msg = Soup.Message.new('GET', url);
        msg.request_headers.append('Authorization', `Bearer ${token}`);
        _httpSession.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (session, result) => {
            try {
                let bytes = session.send_and_read_finish(result);
                if (msg.status_code === 200) {
                    // Décodage strict
                    let text = new TextDecoder().decode(bytes.get_data());
                    callback(JSON.parse(text));
                }
            } catch (e) { console.error(e); }
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

export default class DashboardExtension extends Extension {
    enable() {
        this._indicator = new DashboardIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}