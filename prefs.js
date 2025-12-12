const { Adw, Gtk, GObject } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

function init() {}

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.logtime');
    
    const page = new Adw.PreferencesPage();
    
    // --- GROUPE 1 : CONFIGURATION LOGTIME ---
    const groupConfig = new Adw.PreferencesGroup({ title: 'Configuration Logtime' });
    page.add(groupConfig);

    // Ligne pour les Gift Days
    const giftRow = new Adw.ActionRow({ title: 'Jours Offerts (Gift Days)', subtitle: '1 jour = -7h sur l\'objectif de 154h' });
    
    // Selecteur de nombre
    const spinButton = new Gtk.SpinButton();
    spinButton.set_range(0, 31);
    spinButton.set_increments(1, 1);
    spinButton.set_valign(Gtk.Align.CENTER);
    
    // Liaison avec les settings
    settings.bind('gift-days', spinButton, 'value', 0); // 0 = Gio.SettingsBindFlags.DEFAULT

    giftRow.add_suffix(spinButton);
    groupConfig.add(giftRow);


    // --- GROUPE 2 : GESTION AMIS ---
    const groupAdd = new Adw.PreferencesGroup({ title: 'Gestion des Amis' });
    page.add(groupAdd);

    const addRow = new Adw.ActionRow({ title: 'Ajouter un login' });
    const entry = new Gtk.Entry({ placeholder_text: 'ex: papilaz', hexpand: true });
    const addButton = new Gtk.Button({ label: 'Ajouter' });
    
    const box = new Gtk.Box({ spacing: 10 });
    box.append(entry);
    box.append(addButton);
    addRow.add_suffix(box);
    groupAdd.add(addRow);

    // --- LISTE DES AMIS ---
    const listGroup = new Adw.PreferencesGroup({ title: 'Mes Amis' });
    page.add(listGroup);

    let currentRows = [];

    const refreshList = () => {
        currentRows.forEach(row => listGroup.remove(row));
        currentRows = [];

        const friends = settings.get_strv('friends-list');
        friends.forEach((friend) => {
            const row = new Adw.ActionRow({ title: friend });
            const delBtn = new Gtk.Button({ icon_name: 'user-trash-symbolic' });
            delBtn.add_css_class('destructive-action');
            
            delBtn.connect('clicked', () => {
                const newFriends = settings.get_strv('friends-list').filter(f => f !== friend);
                settings.set_strv('friends-list', newFriends);
                refreshList();
            });

            row.add_suffix(delBtn);
            listGroup.add(row);
            currentRows.push(row);
        });
    };

    addButton.connect('clicked', () => {
        const login = entry.get_text().trim();
        if (login.length > 0) {
            const current = settings.get_strv('friends-list');
            if (!current.includes(login)) {
                current.push(login);
                settings.set_strv('friends-list', current);
                entry.set_text('');
                refreshList();
            }
        }
    });

    refreshList();
    window.add(page);
}