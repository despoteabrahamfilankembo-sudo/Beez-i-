/**
 * ==========================================================================
 * COEUR ARCHITECTURAL : BEEZ-I ELITE v3.1.0 (PRODUCTION ENGINE)
 * CONTEXTE : RÉSEAU SOCIAL DE PRODUCTIVITÉ, DISCIPLINE & ENTRAIDE MUTUELLE
 * OPTIMISÉ POUR GITHUB PAGES (ANTI-ÉCRAN BLANC SUR CHARGEMENT INITIAL)
 * ==========================================================================
 */

// ==========================================================================
// 1. ENREGISTREMENT DU SERVICE WORKER (INSTALLATION MOBILE PWA)
// ==========================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('🐝 Service Worker Beez-i activé.'))
            .catch(err => console.error('Erreur d’ancrage du Service Worker:', err));
    });
}

// ==========================================================================
// 2. ÉTAT GLOBAL DE L'APPLICATION (SÉCURISÉ POUR LE PREMIER CHARGEMENT)
// ==========================================================================
let appState = {
    user: localStorage.getItem('beez_user') ? JSON.parse(localStorage.getItem('beez_user')) : null,
    isPremium: localStorage.getItem('beez_premium') === 'true',
    appOpenCount: parseInt(localStorage.getItem('beez_open_count')) || 0,
    currentView: 'dashboard',
    theme: localStorage.getItem('beez_theme') || 'dark',
    lang: localStorage.getItem('beez_lang') || 'fr',
    tasks: localStorage.getItem('beez_tasks') ? JSON.parse(localStorage.getItem('beez_tasks')) : [],
    communities: localStorage.getItem('beez_communities') ? JSON.parse(localStorage.getItem('beez_communities')) : [
        {
            id: 'comm-default-1',
            name: 'Objectif Santé Élite',
            desc: 'Groupe d\'entraide pour instaurer une routine sportive et nutritionnelle inflexible.',
            type: 'public',
            price: 0,
            members: 142,
            witnesses: [
                { author: 'Abeille_Alpha', text: 'Grâce à ce pôle, j\'ai pu préparer mon concours sans lâcher un seul jour !', verified: true }
            ]
        },
        {
            id: 'comm-default-2',
            name: 'Club des Lecteurs Inarrêtables',
            desc: 'Lire un livre par semaine minimum. Partage de notes de lecture et débats minutés.',
            type: 'paid',
            price: 15,
            members: 89,
            witnesses: [
                { author: 'Anonyme_99', text: 'J\'avais du mal à lire un livre par mois, en rejoignant cette communauté j\'ai retrouvé mon focus.', verified: true }
            ]
        }
    ],
    activeCall: null,
    callTimer: null,
    callDuration: 0
};

// ==========================================================================
// 3. INITIALISATION AU CHARGEMENT DU DOM
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof BeezCore !== 'undefined') {
        BeezCore.init();
    } else {
        console.error("Erreur : Le moteur BeezCore n'est pas encore initialisé.");
    }
});

const BeezCore = {
    init() {
        this.applyTheme();
        this.incrementOpenCount();
        this.renderAuth();
        this.setupEventListeners();
        BeezCommunity.renderGrid();
        BeezTasks.render();
        BeezAgenda.renderMap();
        
        // Moteur de fond : vérification des appels et débriefings (Chaque seconde)
        setInterval(() => {
            BeezCall.checkTimer();
            BeezIA.checkDailyDebrief();
        }, 1000);
    },

    incrementOpenCount() {
        appState.appOpenCount++;
        localStorage.setItem('beez_open_count', appState.appOpenCount);
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', appState.theme);
    },

    renderAuth() {
        // Formulaire d'accueil si l'utilisateur visite la page pour la première fois
        if (!appState.user) {
            const authHTML = `
                <div id="beez-auth-screen" class="auth-overlay">
                    <div class="auth-card">
                        <div class="bee-logo-subliminal" style="margin: 0 auto 20px;"></div>
                        <h2>Rejoindre Beez-i Elite</h2>
                        <p style="color: var(--color-muted); font-size: 0.9rem; margin-top: 5px;">Réseau de discipline souveraine</p>
                        <input type="text" id="auth-pseudo" placeholder="Pseudonyme de confidentialité" class="premium-input">
                        <input type="email" id="auth-email" placeholder="Adresse Email chiffrée" class="premium-input">
                        <button onclick="BeezCore.handleRegister()" class="btn-premium">⚡ Activer mon Matricule</button>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', authHTML);
        } else {
            this.updateHeaderProfile();
            this.checkWelcomeDiagnostic();
        }
    },

    handleRegister() {
        const pseudo = document.getElementById('auth-pseudo').value.trim();
        const email = document.getElementById('auth-email').value.trim();
        
        if (!pseudo || !email) {
            alert('Veuillez remplir les informations d\'identification.');
            return;
        }

        appState.user = { pseudo, email, avatar: '🧬', role: 'Membre Élite', isPremium: appState.isPremium };
        localStorage.setItem('beez_user', JSON.stringify(appState.user));
        
        const authScreen = document.getElementById('beez-auth-screen');
        if (authScreen) authScreen.remove();
        
        this.updateHeaderProfile();
        this.checkWelcomeDiagnostic();
    },

    updateHeaderProfile() {
        const pseudoDisplay = document.getElementById('user-pseudo-display');
        if (pseudoDisplay && appState.user) {
            pseudoDisplay.innerText = appState.user.pseudo;
        }
    },

    checkWelcomeDiagnostic() {
        const modal = document.getElementById('ia-welcome-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    setupEventListeners() {
        const bannerDismissed = localStorage.getItem('beez_banner_dismissed') === 'true';
        const banner = document.getElementById('community-welcome-banner');
        
        if (banner) {
            if (bannerDismissed || appState.appOpenCount > 3) {
                banner.style.display = 'none';
            }
        }
    }
};

// ==========================================================================
// MOTEUR INTELLECTUEL : LOGIQUE COMPORTEMENTALE IA (INSPIRÉ DE META-LLAMA-3)
// ==========================================================================
const BeezIA = {
    analyzeInitialMood() {
        const input = document.getElementById('ia-mood-input').value.trim();
        if (!input) return;

        const responseText = document.getElementById('ia-response-text');
        const actionZone = document.getElementById('ia-action-buttons');
        const recommendationZone = document.getElementById('ia-recommendation-zone');

        const lowerInput = input.toLowerCase();
        let diagnostic = "";
        let actionsHTML = "";

        if (lowerInput.includes('fatigué') || lowerInput.includes('épuisé') || lowerInput.includes('stress') || lowerInput.includes('distrait')) {
            diagnostic = "⚠️ <strong>Analyse Synaptique :</strong> Dispersion cognitive ou fatigue critique détectées. Mon conseil d'IA : Évitez de vous éparpiller dans les flux en direct. Concentrez-vous sur une micro-tâche isolée.";
            actionsHTML = `
                <button onclick="BeezIA.enforceFocusMode()" class="btn-premium" style="background: var(--color-blue); color:#000;">🔒 Activer Mode Focus Forcé</button>
                <button onclick="BeezIA.dismissWelcomeModal()" class="btn-gold" style="background:transparent; border:1px solid var(--color-muted); color:var(--color-text-pure);">Accéder quand même</button>
            `;
        } else {
            diagnostic = "✨ <strong>Analyse Synaptique :</strong> Niveau d'énergie et de focus optimal. Recommandation : Lancez immédiatement une session ou planifiez un jalon sur l'Agenda.";
            actionsHTML = `<button onclick="BeezIA.dismissWelcomeModal()" class="btn-premium">Entrer dans la Ruche</button>`;
        }

        responseText.innerHTML = diagnostic;
        actionZone.innerHTML = actionsHTML;
        recommendationZone.style.display = 'block';
    },

    enforceFocusMode() {
        this.dismissWelcomeModal();
        BeezUI.switchView('tasks');
        const liveBtn = document.getElementById('nav-live');
        if (liveBtn) {
            liveBtn.style.opacity = '0.3';
        }
        alert("Mode Focus IA Activé : L'accès aux Sessions Live est momentanément restreint pour protéger votre productivité.");
    },

    dismissWelcomeModal() {
        const modal = document.getElementById('ia-welcome-modal');
        if (modal) modal.style.display = 'none';
    },

    requestCallEstablishment(targetUserPseudo) {
        const motif = prompt(`[IA GATEWAY] Saisissez le motif de cet appel avec ${targetUserPseudo} :`);
        if (!motif) return false;

        const lowerMotif = motif.toLowerCase();
        const keywordsInutiles = ['discuter', 'meteo', 'rien', 'passer le temps', 'coucou'];
        const isFrivolous = keywordsInutiles.some(word => lowerMotif.includes(word));

        if (isFrivolous || motif.length < 8) {
            alert(`❌ [IA BLOCK] Appel rejeté. Le motif saisi semble propice à la distraction. Gardez votre focus.`);
            return false;
        }

        alert(`✅ [IA APPROVED] Motif validé : "${motif}". Liaison WebRTC en cours...`);
        BeezCall.start(targetUserPseudo);
        return true;
    },

    checkDailyDebrief() {
        const now = new Date();
        // Déclenchement automatique calé par défaut tous les soirs à 21h30
        if (now.getHours() === 21 && now.getMinutes() === 30 && now.getSeconds() === 0) {
            this.triggerDailyDebrief();
        }
    },

    triggerDailyDebrief() {
        const modalHTML = `
            <div id="ia-debrief-modal" class="modal-overlay">
                <div class="modal-card" style="border: 1px solid var(--color-gold);">
                    <div class="ia-avatar-pulse" style="border-color:var(--color-gold);">📊</div>
                    <h3>Débriefing IA Obligatoire</h3>
                    <p style="margin-top:10px; color:var(--color-muted);">Analyse algorithmique de vos efforts de la journée.</p>
                    <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:12px; margin-top:15px; text-align:left; font-size:0.9rem;">
                        <strong>Bilan :</strong> Vos checkpoints ont été analysés. Rapport d'efficacité enregistré localement. Restez rigoureux.
                    </div>
                    <button onclick="document.getElementById('ia-debrief-modal').remove()" class="btn-premium">Fermer & Sceller la Journée</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
};

// ==========================================================================
// INTERACTION APPELS & LIMITATION ANTICANALISATION
// ==========================================================================
const BeezCall = {
    start(user) {
        appState.activeCall = user;
        appState.callDuration = 0;
        BeezUI.switchView('live');
        alert(`En appel de groupe sécurisé : ${user}`);
    },

    checkTimer() {
        if (!appState.activeCall) return;
        appState.callDuration++;

        // Alerte à 60 minutes (3600 secondes) pour éviter le bavardage passif
        if (appState.callDuration === 3600) {
            this.triggerTimeAlert();
        }
    },

    triggerTimeAlert() {
        const alertHTML = `
            <div id="call-time-alert" class="modal-overlay" style="z-index:10001;">
                <div class="modal-card" style="border:2px solid var(--color-red); text-align:center;">
                    <div style="font-size:3rem; margin-bottom:10px;">⏳</div>
                    <h3>Alerte Temporelle</h3>
                    <p style="margin-top:10px;">Votre session dure depuis 1 heure. L'IA demande confirmation pour s'assurer que vous restez productifs.</p>
                    <button onclick="BeezCall.confirmEngagement(true)" class="btn-premium" style="background:var(--color-green); color:#000; margin-top:20px;">Je confirme être productif</button>
                    <button onclick="BeezCall.confirmEngagement(false)" class="btn-premium" style="background:var(--color-red); color:#fff;">Raccrocher et retourner au travail</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', alertHTML);
    },

    confirmEngagement(continueCall) {
        const alertElement = document.getElementById('call-time-alert');
        if (alertElement) alertElement.remove();
        
        if (!continueCall) {
            appState.activeCall = null;
            alert("Appel interrompu pour préserver votre temps.");
            BeezUI.switchView('dashboard');
        } else {
            alert("Session prolongée. Maintenez l'effort.");
        }
    }
};

// ==========================================================================
// GESTIONNAIRE DES COMMUNAUTÉS (BOÎTES CLICQUABLES AVEC TÉMOIGNAGES)
// ==========================================================================
const BeezCommunity = {
    dismissBanner() {
        const banner = document.getElementById('community-welcome-banner');
        if (banner) banner.style.display = 'none';
        localStorage.setItem('beez_banner_dismissed', 'true');
    },

    togglePriceInput() {
        const type = document.getElementById('comm-access-type').value;
        const priceZone = document.getElementById('comm-price-zone');
        if (priceZone) {
            priceZone.style.display = (type === 'paid') ? 'block' : 'none';
        }
    },

    createCommunity() {
        const name = document.getElementById('comm-name').value.trim();
        const desc = document.getElementById('comm-desc').value.trim();
        const type = document.getElementById('comm-access-type').value;
        const price = parseFloat(document.getElementById('comm-price').value) || 0;

        if (!name || !desc) {
            alert('Veuillez remplir les champs obligatoires.');
            return;
        }

        const newComm = {
            id: 'comm-' + Date.now(),
            name, desc, type, price,
            members: 1,
            witnesses: []
        };

        appState.communities.push(newComm);
        localStorage.setItem('beez_communities', JSON.stringify(appState.communities));
        
        this.renderGrid();
        BeezUI.closeModal('community-modal');
        
        document.getElementById('comm-name').value = '';
        document.getElementById('comm-desc').value = '';
    },

    renderGrid() {
        const container = document.getElementById('communities-grid-container');
        if (!container) return;

        container.innerHTML = appState.communities.map(c => `
            <div class="community-box-card" onclick="BeezCommunity.handleBoxClick('${c.id}')">
                <span class="badge-access badge-${c.type}">${c.type === 'paid' ? `${c.price}€` : c.type}</span>
                <h3 style="margin-top:10px; font-size:1.15rem; color:var(--color-text-pure);">${c.name}</h3>
                <p style="color:var(--color-muted); font-size:0.88rem; margin-top:8px; flex-grow:1;">${c.desc}</p>
                
                <div class="witness-container">
                    <span style="font-size:0.75rem; font-weight:700; color:var(--color-gold);">💬 Preuves de Progression :</span>
                    ${c.witnesses && c.witnesses.length ? c.witnesses.map(w => `
                        <div class="witness-bubble">
                            <div class="witness-author">👤 ${w.author} <span class="proof-badge">✓ Profil Vérifié</span></div>
                            "${w.text}"
                        </div>
                    `).join('') : '<p style="font-size:0.75rem; color:var(--color-muted); margin-top:4px;">Aucun témoignage partagé.</p>'}
                </div>
                
                <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; color:var(--color-blue);">👥 ${c.members} membres</span>
                    <button class="btn-premium" style="margin:0; padding:8px 14px; font-size:0.8rem; width:auto;">Entrer dans la Boîte</button>
                </div>
            </div>
        `).join('');
    },

    handleBoxClick(id) {
        const comm = appState.communities.find(c => c.id === id);
        if (!comm) return;

        if (comm.type === 'paid') {
            const accept = confirm(`Cette communauté d'élite requiert une place de membre à ${comm.price}€. Souhaitez-vous acquérir votre accès ?`);
            if (!accept) return;
        }

        const action = confirm(`Bienvenue dans la communauté "${comm.name}". Souhaitez-vous lancer un appel de groupe encadré par l'IA ?`);
        if (action) {
            BeezIA.requestCallEstablishment(`Salon - ${comm.name}`);
        }
    }
};

// ==========================================================================
// AGENDA VISUEL : COMPOSANT CARTE MENTALE INTERACTIVE
// ==========================================================================
const BeezAgenda = {
    renderMap() {
        const container = document.getElementById('view-agenda');
        if (!container) return;

        const mapHTML = `
            <div style="margin-top:20px;">
                <div class="section-header-flex">
                    <h3 style="font-size:1.1rem; margin-bottom:10px;">🗺️ Feuille de Route Quotidienne (Format Carte Mentale)</h3>
                    <button onclick="alert('Configuration de l Itinéraire activée.')" class="btn-premium" style="width:auto; margin:0; padding:6px 12px; font-size:0.8rem; background:transparent; border:1px solid var(--color-gold); color:var(--color-gold);">⚙️ Configurer Itinéraire</button>
                </div>
                <div class="agenda-map-wrapper" id="map-canvas">
                    <div class="map-checkpoint-node" style="top: 20%; left: 15%;" onclick="BeezAgenda.openCheckpoint('08h00 - Séance Sport Élite', 'Statut: Obligatoire.')"></div>
                    <div class="map-route-line" style="top: 20%; left: 15%; width: 30%; transform: rotate(25deg);"></div>
                    <div class="map-checkpoint-node" style="top: 35%; left: 45%;" onclick="BeezAgenda.openCheckpoint('14h00 - Session Productivité intensive', 'Statut: Stratégique.')"></div>
                    <div class="map-route-line" style="top: 35%; left: 45%; width: 40%; transform: rotate(-15deg);"></div>
                    <div class="map-checkpoint-node" style="top: 25%; left: 85%;" onclick="BeezAgenda.openCheckpoint('20h30 - Analyse IA & Lecture', 'Statut: Clôture de la ruche.')"></div>
                </div>
            </div>`;
        
        if (!document.getElementById('map-canvas')) {
            container.insertAdjacentHTML('beforeend', mapHTML);
        }
    },

    openCheckpoint(title, details) {
        alert(`📍 [CHECKPOINT AGENDA] \n\nObjectif : ${title}\nPrécisions : ${details}`);
    }
};

// ==========================================================================
// MOTEUR SECONDAIRE : COMPOSANT DES TÂCHES SIMPLES
// ==========================================================================
const BeezTasks = {
    render() {
        const container = document.getElementById('tasks-container');
        if (!container) return;
        container.innerHTML = `<p style="color:var(--color-muted); font-size:0.9rem;">Aucune action planifiée. Votre agenda pilote votre journée.</p>`;
    }
};

// ==========================================================================
// NAVIGATION INTERFACE & PASSAGE DES VUES (BEEZ-UI)
// ==========================================================================
const BeezUI = {
    switchView(viewId) {
        appState.currentView = viewId;
        
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(section => section.style.display = 'none');
        
        const activeNavButton = document.getElementById(`nav-${viewId}`);
        const activeSection = document.getElementById(`view-${viewId}`);
        
        if (activeNavButton) activeNavButton.classList.add('active');
        if (activeSection) activeSection.style.display = 'block';

        if (viewId === 'agenda') {
            BeezAgenda.renderMap();
        }
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }
};

// ==========================================================================
// 4. MOTEUR DE PAIEMENT & CONTRÔLE DES ACCÈS PREMIUM (MOBILE MONEY & CARTE)
// ==========================================================================
const BeezPayment = {
    triggerPaywall(featureName, callbackOnSuccess) {
        if (appState.user && appState.user.isPremium) {
            callbackOnSuccess();
            return;
        }

        const paywallHTML = `
            <div id="beez-paywall-modal" class="modal-overlay" style="z-index: 20000;">
                <div class="modal-card" style="border: 2px solid var(--color-gold);">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">👑</div>
                    <h3>Accès Élite Requis</h3>
                    <p style="color: var(--color-muted); font-size: 0.85rem; margin-top: 5px;">
                        La fonctionnalité <strong>${featureName}</strong> est réservée aux membres Premium.
                    </p>
                    
                    <div style="margin-top: 20px; text-align: left;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: var(--color-gold);">Choisissez votre mode d'activation :</label>
                        <select id="payment-method-select" class="premium-input" onchange="BeezPayment.toggleMethodFields()">
                            <option value="mobile_money">📱 Mobile Money (Orange, MTN, Airtel, Moov...)</option>
                            <option value="card">💳 Carte Bancaire / Carte Prépayée</option>
                        </select>
                    </div>

                    <div id="field-mobile-money" class="payment-method-fields" style="margin-top: 15px; text-align: left;">
                        <p style="font-size: 0.8rem; color: var(--color-muted); margin-bottom: 8px;">
                            Un message de confirmation contenant un code de validation vous sera envoyé par SMS, comme pour l'activation d'un forfait internet.
                        </p>
                        <input type="tel" id="pay-phone" placeholder="Numéro de téléphone (ex: +242...)" class="premium-input">
                    </div>

                    <div id="field-card" class="payment-method-fields" style="margin-top: 15px; text-align: left; display: none;">
                        <input type="text" id="card-number" placeholder="Numéro de carte (16 chiffres)" class="premium-input">
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <input type="text" id="card-expiry" placeholder="MM/AA" class="premium-input" style="flex: 1;">
                            <input type="text" id="card-cvc" placeholder="CVC" class="premium-input" style="flex: 1;">
                        </div>
                    </div>

                    <button onclick="BeezPayment.process('${featureName}')" class="btn-premium" style="margin-top: 25px;">⚡ Confirmer le Paiement (9.99€)</button>
                    <button onclick="document.getElementById('beez-paywall-modal').remove()" class="btn-gold" style="background:transparent; border:none; color:var(--color-muted); margin-top:10px; box-shadow:none;">Plus tard</button>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', paywallHTML);
    },

    toggleMethodFields() {
        const method = document.getElementById('payment-method-select').value;
        document.getElementById('field-mobile-money').style.display = (method === 'mobile_money') ? 'block' : 'none';
        document.getElementById('field-card').style.display = (method === 'card') ? 'block' : 'none';
    },

    process(featureName) {
        const method = document.getElementById('payment-method-select').value;
        
        if (method === 'mobile_money') {
            const phone = document.getElementById('pay-phone').value.trim();
            if (!phone) { alert('Veuillez entrer votre numéro de téléphone mobile.'); return; }
            alert(`[INFO] Demande d'activation envoyée au réseau pour le numéro ${phone}.\n\nPour simuler la confirmation : répondez OUI au SMS virtuel ou tapez votre code PIN secret sur le téléphone.`);
        } else {
            const card = document.getElementById('card-number').value.trim();
            if (!card) { alert('Veuillez remplir les informations de votre carte.'); return; }
        }

        appState.isPremium = true;
        localStorage.setItem('beez_premium', 'true');
        if (appState.user) {
            appState.user.isPremium = true;
            localStorage.setItem('beez_user', JSON.stringify(appState.user));
        }
        
        alert(`🎉 Activation réussie ! Accès Premium déverrouillé pour : ${featureName}`);
        
        const modal = document.getElementById('beez-paywall-modal');
        if (modal) modal.remove();
        
        location.reload(); // Recharge la page pour appliquer les nouveaux accès
    }
};

// ==========================================================================
// INTERCEPTEUR DE SÉCURITÉ POUR LES VUES REQUIS PREMIUM
// ==========================================================================
const OriginalSwitchView = BeezUI.switchView;
BeezUI.switchView = function(viewId) {
    if ((viewId === 'live' || viewId === 'community') && !appState.isPremium) {
        BeezPayment.triggerPaywall(viewId === 'live' ? "Sessions Live & Débats" : "Communautés d'Émulation", () => {
            OriginalSwitchView(viewId);
        });
        return;
    }
    OriginalSwitchView(viewId);
};