const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Stockage des messages en mémoire { "login_destinataire": [ {from, msg, date} ] }
let messages = {};

// 1. ENVOYER UN MESSAGE
app.post('/send', (req, res) => {
    const { from, to, message } = req.body;
    
    if (!from || !to || !message) return res.status(400).send("Champs manquants");
    
    if (!messages[to]) messages[to] = [];
    
    messages[to].push({
        from: from,
        message: message,
        timestamp: Date.now()
    });

    console.log(`📩 Message de ${from} pour ${to}: ${message}`);
    res.send({ status: "sent" });
});

// 2. RECUPERER MES MESSAGES (Polling)
app.get('/messages/:login', (req, res) => {
    const login = req.params.login;
    
    if (messages[login] && messages[login].length > 0) {
        // On envoie les messages et on vide la boite aux lettres
        res.send(messages[login]);
        messages[login] = []; 
    } else {
        res.send([]);
    }
});

// Lancer le serveur
const PORT = 3000; // Tu pourras changer ça si tu héberges ailleurs
app.listen(PORT, () => {
    console.log(`🚀 Serveur de messagerie Logtime prêt sur le port ${PORT}`);
});