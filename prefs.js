const { Adw, Gtk, GObject } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

function init() {
    // Rien à initialiser ici
}

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.logtime');
    
    const page = new Adw.PreferencesPage();
    
    // --- GROUPE 1 : AJOUTER ---
    const groupAdd = new Adw.PreferencesGroup({ title: 'Ajouter un ami' });
    page.add(groupAdd);

    const addRow = new Adw.ActionRow({ title: 'Nouveau login' });
    const entry = new Gtk.Entry({ placeholder_text: 'ex: papilaz', hexpand: true });
    const addButton = new Gtk.Button({ label: 'Ajouter' });
    
    const box = new Gtk.Box({ spacing: 10 });
    box.append(entry);
    box.append(addButton);
    addRow.add_suffix(box);
    groupAdd.add(addRow);

    // --- GROUPE 2 : LISTE ---
    const listGroup = new Adw.PreferencesGroup({ title: 'Mes Amis' });
    page.add(listGroup);

    // Variable pour stocker les lignes actuelles (pour pouvoir les supprimer)
    let currentRows = [];

    const refreshList = () => {
        // 1. On supprime les anciennes lignes proprement
        currentRows.forEach(row => {
            listGroup.remove(row);
        });
        currentRows = []; // On vide la liste temporaire

        // 2. On recrée la liste
        const friends = settings.get_strv('friends-list');
        friends.forEach((friend) => {
            const row = new Adw.ActionRow({ title: friend });
            const delBtn = new Gtk.Button({ icon_name: 'user-trash-symbolic' });
            
            // Style rouge pour le bouton supprimer
            delBtn.add_css_class('destructive-action');
            
            delBtn.connect('clicked', () => {
                const currentFriends = settings.get_strv('friends-list');
                const newFriends = currentFriends.filter(f => f !== friend);
                settings.set_strv('friends-list', newFriends);
                refreshList();
            });

            row.add_suffix(delBtn);
            listGroup.add(row);
            
            // On mémorise cette ligne pour pouvoir la supprimer au prochain refresh
            currentRows.push(row);
        });
    };

    // Action du bouton Ajouter
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

    // Premier chargement
    refreshList();
    
    window.add(page);
}