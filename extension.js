const { St, GLib, Clutter, Soup, GObject, Gio, GdkPixbuf } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// --- CONFIGURATION ---
const UID = "u-s4t2ud-f03601c98c248d266a0ff1ad9fa690660dcc1e4a73f3db5d5210d98f44123e26";
const SECRET = "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";
const ME = "papilaz";

let _httpSession;
try {
    _httpSession = new Soup.SessionAsync();
    _httpSession.user_agent = 'LogtimeExtension/7.0';
} catch (e) {
    _httpSession = new Soup.Session();
}

const DashboardIndicator = GObject.registerClass(
class DashboardIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, "42 Dashboard", false);
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.logtime');
        
        this._currentLogtimeMs = 0;

        // Listeners
        this._settings.connect('changed::friends-list', () => this._refresh());
        this._settings.connect('changed::gift-days', () => this._updateTimeLabel());

        // --- BARRE DU HAUT (TOP BAR) ---
        let topBox = new St.BoxLayout({ 
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'lgt-top-box'
        });
        
        // 1. Badge Amis (A GAUCHE)
        this.onlineBadge = new St.Label({
            text: "0",
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'lgt-online-badge'
        });
        this.onlineBadge.hide();
        topBox.add_child(this.onlineBadge);

        // 2. Label Logtime
        this.buttonLabel = new St.Label({
            text: "...",
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'lgt-button-label'
        });
        topBox.add_child(this.buttonLabel);
        
        this.add_child(topBox);

        // --- MENU DÉROULANT ---
        this.menu.box.style_class = 'lgt-popup-menu';

        this.timeDisplay = new St.Label({ text: "chargement...", style_class: 'lgt-main-time' });
        this.menu.box.add_child(this.timeDisplay);

        let statsBox = new St.BoxLayout({ vertical: false, style_class: 'lgt-stats-grid' });
        this.walletLbl = this._createStatBox(statsBox, "Wallet", "-");
        this.evalLbl = this._createStatBox(statsBox, "Evaluations", "-");
        this.lvlLbl = this._createStatBox(statsBox, "Level", "-");
        this.menu.box.add_child(statsBox);

        this.menu.box.add_child(new PopupMenu.PopupSeparatorMenuItem());
        
        // --- LIGNE D'ACTION (Titre + Boutons Refresh/Settings) ---
        let actionRow = new St.BoxLayout({ vertical: false, style_class: 'lgt-action-row' });
        
        // Titre (qui pousse les boutons à droite avec x_expand)
        let titleLbl = new St.Label({ 
            text: "FRIENDS STATUS", 
            style_class: 'lgt-title', 
            x_expand: true, 
            y_align: Clutter.ActorAlign.CENTER 
        });
        actionRow.add_child(titleLbl);

        // Bouton Refresh
        let refreshBtn = new St.Button({ style_class: 'lgt-icon-btn', can_focus: true });
        refreshBtn.set_child(new St.Icon({ icon_name: 'view-refresh-symbolic', icon_size: 16 }));
        refreshBtn.connect('clicked', () => {
            this._refresh();
        });
        actionRow.add_child(refreshBtn);

        // Bouton Settings
        let settingsBtn = new St.Button({ style_class: 'lgt-icon-btn', can_focus: true });
        settingsBtn.set_child(new St.Icon({ icon_name: 'emblem-system-symbolic', icon_size: 16 }));
        settingsBtn.connect('clicked', () => {
            ExtensionUtils.openPrefs();
        });
        actionRow.add_child(settingsBtn);

        this.menu.box.add_child(actionRow);

        // --- LISTE AMIS ---
        this.friendsBox = new St.BoxLayout({ vertical: true });
        this.menu.box.add_child(this.friendsBox);

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

    _wait(ms) {
        return new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            resolve();
            return GLib.SOURCE_REMOVE;
        }));
    }

    async _getToken() {
        if (this.token && this.tokenExpire > (Date.now()/1000)) return this.token;
        let msg = Soup.Message.new('POST', 'https://api.intra.42.fr/oauth/token');
        let bodyObj = { grant_type: 'client_credentials', client_id: UID, client_secret: SECRET };
        let bodyStr = JSON.stringify(bodyObj);
        if (msg.set_request) msg.set_request('application/json', 2, bodyStr, bodyStr.length);
        else {
            msg.request_headers.append('Content-Type', 'application/json');
            msg.set_body_data(GLib.Bytes.new(bodyStr));
        }
        let response = await this._send_async(msg);
        if (!response) return null;
        try {
            let data = JSON.parse(response);
            this.token = data.access_token;
            this.tokenExpire = (Date.now()/1000) + data.expires_in;
            return this.token;
        } catch (e) { return null; }
    }

    async _refresh() {
        // Petit effet visuel : on change le texte du temps pour montrer que ça charge
        // this.timeDisplay.set_text("Actualisation..."); 

        let token = await this._getToken();
        if (!token) return;

        let now = new Date();
        let start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        
        // MOI
        let myLocs = await this._fetchJsonPromise(`https://api.intra.42.fr/v2/users/${ME}/locations?range[begin_at]=${start},${end}&per_page=100`, token);
        if (Array.isArray(myLocs)) {
            this._currentLogtimeMs = myLocs.reduce((a, l) => a + ((l.end_at ? new Date(l.end_at) : new Date()) - new Date(l.begin_at)), 0);
            this._updateTimeLabel();
        }

        let myStats = await this._fetchJsonPromise(`https://api.intra.42.fr/v2/users/${ME}`, token);
        if (myStats) {
            if (myStats.wallet !== undefined) this.walletLbl.set_text(`${myStats.wallet} ₳`);
            if (myStats.correction_point !== undefined) this.evalLbl.set_text(`${myStats.correction_point}`);
            let c = myStats.cursus_users.find(x => x.cursus.slug === "42cursus") || myStats.cursus_users[0];
            if (c) this.lvlLbl.set_text(`${Number(c.level).toFixed(2)}`);
        }

        // AMIS
        await this._updateFriendsList(token);
    }

    _updateTimeLabel() {
        if (this._currentLogtimeMs === 0) return;
        let h = Math.floor(this._currentLogtimeMs/3600000);
        let m = Math.floor((this._currentLogtimeMs%3600000)/60000);
        let giftDays = this._settings.get_int('gift-days');
        let target = Math.max(0, 154 - (giftDays * 7));
        let txt = `${h}h ${m}m / ${target}h`;
        this.buttonLabel.set_text(txt);
        this.timeDisplay.set_text(txt);
    }

    async _updateFriendsList(token) {
        this.friendsBox.destroy_all_children();
        let friends = this._settings.get_strv('friends-list');
        
        if (friends.length === 0) {
            this.friendsBox.add_child(new St.Label({ text: "Ajoute tes amis...", style_class: 'lgt-stat-label' }));
            this.onlineBadge.hide();
            return;
        }

        let now = new Date();
        let start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        let loadedRows = [];
        let onlineCount = 0;

        for (const login of friends) {
            // Container global
            let mainContainer = new St.BoxLayout({ vertical: true, style_class: 'lgt-friend-container' });

            // 1. La ligne principale (Cliquable)
            let headerBtn = new St.Button({ style_class: 'lgt-friend-btn', reactive: true });
            let row = new St.BoxLayout({ vertical: false });
            
            let iconBin = new St.Bin({ style_class: 'lgt-friend-avatar', y_align: Clutter.ActorAlign.CENTER, width: 44, height: 44 });
            iconBin.set_child(new St.Icon({ icon_name: 'avatar-default-symbolic', icon_size: 44 }));
            row.add_child(iconBin);

            let infoBox = new St.BoxLayout({ vertical: true, style_class: 'lgt-friend-info', x_expand: true, y_align: Clutter.ActorAlign.CENTER });
            let nameLbl = new St.Label({ text: login, style_class: 'lgt-friend-name' });
            let timeLbl = new St.Label({ text: "...", style_class: 'lgt-friend-logtime' });
            infoBox.add_child(nameLbl);
            infoBox.add_child(timeLbl);
            row.add_child(infoBox);

            let statusLbl = new St.Label({ text: "⚫", style_class: 'lgt-friend-status', y_align: Clutter.ActorAlign.CENTER });
            row.add_child(statusLbl);
            
            headerBtn.set_child(row);
            mainContainer.add_child(headerBtn);

            // 2. Le panneau de détails (Caché)
            let detailsBox = new St.BoxLayout({ vertical: false, style_class: 'lgt-friend-details', visible: false });
            let detLeft = new St.BoxLayout({ vertical: true, x_expand: true });
            let detWallet = new St.Label({ text: "Wallet: -", style_class: 'lgt-detail-item' });
            let detPoints = new St.Label({ text: "Eval: -", style_class: 'lgt-detail-item' });
            let detEmail = new St.Label({ text: "-", style_class: 'lgt-detail-item-small' });
            detLeft.add_child(detWallet);
            detLeft.add_child(detPoints);
            detLeft.add_child(detEmail);

            let detRight = new St.BoxLayout({ vertical: true, x_expand: true });
            let detLevel = new St.Label({ text: "Lvl: -", style_class: 'lgt-detail-item' });
            let detPool = new St.Label({ text: "Piscine: -", style_class: 'lgt-detail-item' });
            detRight.add_child(detLevel);
            detRight.add_child(detPool);

            detailsBox.add_child(detLeft);
            detailsBox.add_child(detRight);
            mainContainer.add_child(detailsBox);

            headerBtn.connect('clicked', () => { detailsBox.visible = !detailsBox.visible; });
            this.friendsBox.add_child(mainContainer);

            // --- API ---
            let isActive = false;
            let user = await this._fetchJsonPromise(`https://api.intra.42.fr/v2/users/${login}`, token);
            if (user) {
                if (user.image?.versions?.small) this._downloadAndSetAvatar(user.image.versions.small, login, iconBin);
                if (user.wallet !== undefined) detWallet.set_text(`💰 ${user.wallet} ₳`);
                if (user.correction_point !== undefined) detPoints.set_text(`⚖️ ${user.correction_point}`);
                if (user.email) detEmail.set_text(`📧 ${user.email}`);
                if (user.pool_year) detPool.set_text(`🏊 ${user.pool_month || ''} ${user.pool_year}`);
                let c = user.cursus_users.find(x => x.cursus.slug === "42cursus");
                if (c) detLevel.set_text(`🎓 Lvl ${Number(c.level).toFixed(2)}`);
            }
            await this._wait(600); 

            let locs = await this._fetchJsonPromise(`https://api.intra.42.fr/v2/users/${login}/locations?range[begin_at]=${start},${end}&per_page=100`, token);
            if (Array.isArray(locs)) {
                let ams = locs.reduce((a, l) => a + ((l.end_at ? new Date(l.end_at) : new Date()) - new Date(l.begin_at)), 0);
                let ah = Math.floor(ams/3600000);
                let am = Math.floor((ams%3600000)/60000);
                timeLbl.set_text(`${ah}h ${am}m`);

                isActive = locs.length > 0 && locs[0].end_at === null;
                if (isActive) {
                    onlineCount++;
                    statusLbl.set_text(`🟢 ${locs[0].host}`);
                    statusLbl.set_style("color: #2ed573; font-weight: bold;");
                } else {
                    statusLbl.set_text("🔴 Off");
                    statusLbl.set_style("color: #ff4757;");
                }
            } else {
                timeLbl.set_text("Err API");
            }

            loadedRows.push({ widget: mainContainer, isOnline: isActive });
            await this._wait(600);
        }

        if (onlineCount > 0) {
            this.onlineBadge.set_text(`${onlineCount}`);
            this.onlineBadge.show();
        } else {
            this.onlineBadge.hide();
        }

        loadedRows.sort((a, b) => {
            if (a.isOnline === b.isOnline) return 0;
            return a.isOnline ? -1 : 1;
        });

        loadedRows.forEach((item, index) => {
            this.friendsBox.set_child_at_index(item.widget, index);
        });
    }

    _downloadAndSetAvatar(url, login, iconBin) {
        let tmpPath = GLib.get_tmp_dir() + `/42_avatar_${login}.jpg`;
        let tmpRoundPath = GLib.get_tmp_dir() + `/42_avatar_${login}_round.png`;
        let file = Gio.File.new_for_path(tmpPath);
        let roundFile = Gio.File.new_for_path(tmpRoundPath);
        
        if (roundFile.query_exists(null)) {
            let gicon = new Gio.FileIcon({ file: roundFile });
            iconBin.set_child(new St.Icon({ gicon: gicon, icon_size: 44 }));
            return;
        }

        let msg = Soup.Message.new('GET', url);
        _httpSession.queue_message(msg, (s, m) => {
            if (m.status_code === 200) {
                try {
                    let contents = m.response_body.flatten().get_data();
                    GLib.file_set_contents(tmpPath, contents);
                    this._createRoundImage(tmpPath, tmpRoundPath);
                    let gicon = new Gio.FileIcon({ file: roundFile });
                    iconBin.set_child(new St.Icon({ gicon: gicon, icon_size: 44 }));
                } catch(e) { log(e); }
            }
        });
    }
    
    _createRoundImage(inputPath, outputPath) {
        const Cairo = imports.cairo;
        const Gdk = imports.gi.Gdk;
        try {
            let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(inputPath, 44, 44, false);
            let width = pixbuf.get_width();
            let height = pixbuf.get_height();
            if (width != height) {
                let size = Math.min(width, height);
                let x = (width - size) / 2;
                let y = (height - size) / 2;
                pixbuf = GdkPixbuf.Pixbuf.new_subpixbuf(pixbuf, x, y, size, size);
                pixbuf = pixbuf.scale_simple(44, 44, GdkPixbuf.InterpType.BILINEAR);
            }
            let surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, 44, 44);
            let cr = new Cairo.Context(surface);
            cr.setOperator(Cairo.Operator.CLEAR);
            cr.paint();
            cr.setOperator(Cairo.Operator.OVER);
            cr.arc(22, 22, 22, 0, 2 * Math.PI);
            cr.clip();
            Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
            cr.paint();
            surface.writeToPNG(outputPath);
        } catch(e) { log(e); }
    }

    _fetchJsonPromise(url, token) {
        return new Promise(resolve => {
            let msg = Soup.Message.new('GET', url);
            msg.request_headers.append('Authorization', `Bearer ${token}`);
            if (_httpSession.queue_message) {
                _httpSession.queue_message(msg, (s, m) => {
                    if (m.status_code === 200) {
                        try { resolve(JSON.parse(m.response_body.data)); } 
                        catch(e) { resolve(null); }
                    } else resolve(null);
                });
            } else resolve(null);
        });
    }

    _send_async(msg) {
        return new Promise((resolve) => {
            if (_httpSession.queue_message) {
                _httpSession.queue_message(msg, (s, m) => {
                    if (m.response_body && m.response_body.data) resolve(m.response_body.data);
                    else resolve(null);
                });
            } else resolve(null);
        });
    }
    
    destroy() {
        if (this._timeout) GLib.source_remove(this._timeout);
        if (this._settingsChangedId) this._settings.disconnect(this._settingsChangedId);
        super.destroy();
    }
});

let _indicator;
function init() { return new Extension(); }
class Extension {
    enable() { _indicator = new DashboardIndicator(); Main.panel.addToStatusArea('logtime-indicator', _indicator); }
    disable() { if (_indicator) { _indicator.destroy(); _indicator = null; } }
}