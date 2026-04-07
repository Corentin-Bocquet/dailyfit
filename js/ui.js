// Gestionnaire d'interface utilisateur (UI)
// Centralise le rendu des composants et les interactions

class UIManager {
    constructor() {
        this.mainContent = document.getElementById('main-content');
        this.pageTitle = document.getElementById('current-page-title');
        this.modals = {
            onboarding: document.getElementById('modal-onboarding'),
            addPiece: document.getElementById('modal-add-piece'),
            outfitDetails: document.getElementById('modal-outfit-details')
        };
        this.setupEventListeners();
    }

    // --- Navigation & Routage ---

    renderView(viewId) {
        // Nettoyer le contenu
        this.mainContent.innerHTML = '<div class="skeleton-loader"></div>';
        
        // Simuler chargement (animation skeleton)
        setTimeout(() => {
            switch(viewId) {
                case 'home': this.renderHome(); break;
                case 'closet': this.renderCloset(); break;
                case 'outfits': this.renderOutfits(); break;
                case 'history': this.renderHistory(); break;
                case 'calendar': this.renderCalendar(); break;
                case 'stats': this.renderStats(); break;
                case 'settings': this.renderSettings(); break;
                default: this.renderHome();
            }
        }, 300);
    }

    // --- Vues Spécifiques ---

    renderHome() {
        this.pageTitle.textContent = 'Aujourd\'hui';
        
        this.mainContent.innerHTML = `
            <div class="dashboard-grid">
                <section class="card meteo-card">
                    <div id="weather-widget">
                        <div class="skeleton-text"></div>
                    </div>
                </section>
                
                <section class="card outfit-suggestion-card">
                    <h3>Suggestion du jour</h3>
                    <div id="daily-suggestion-container" class="outfit-display">
                        <div class="empty-state">
                            <p>Prêt pour une nouvelle tenue ?</p>
                            <button class="btn btn-primary" onclick="app.generateDailyOutfit()">
                                <i class="fas fa-magic"></i> Générer
                            </button>
                        </div>
                    </div>
                </section>
                
                <section class="card quick-stats">
                    <h3>Aperçu semaine</h3>
                    <div class="stats-mini-grid">
                        <div class="mini-stat">
                            <span class="label">Portés</span>
                            <span class="value">12</span>
                        </div>
                        <div class="mini-stat">
                            <span class="label">Score style</span>
                            <span class="value">85%</span>
                        </div>
                    </div>
                </section>
            </div>
        `;
        
        this.updateWeatherWidget();
    }

    renderCloset() {
        this.pageTitle.textContent = 'Ma Garde-robe';
        const pieces = window.dataManager.getAllPieces();
        
        this.mainContent.innerHTML = `
            <div class="closet-controls">
                <div class="filters-bar">
                    <button class="filter-chip active">Tout</button>
                    <button class="filter-chip">Hauts</button>
                    <button class="filter-chip">Bas</button>
                    <button class="filter-chip">Chaussures</button>
                </div>
                <button class="btn btn-primary" onclick="ui.openModal('addPiece')">
                    <i class="fas fa-plus"></i> Ajouter
                </button>
            </div>
            <div class="pieces-grid" id="pieces-grid">
                ${pieces.length > 0 ? pieces.map(p => this.createPieceCard(p)).join('') : this.createEmptyState('Votre garde-robe est vide')}
            </div>
        `;
    }

    renderOutfits() {
        this.pageTitle.textContent = 'Mes Tenues';
        const outfits = window.dataManager.getOutfits();
        
        this.mainContent.innerHTML = `
            <div class="outfits-grid">
                ${outfits.length > 0 ? outfits.map(o => this.createOutfitCard(o)).join('') : this.createEmptyState('Aucune tenue enregistrée')}
            </div>
        `;
    }

    renderHistory() {
        this.pageTitle.textContent = 'Historique';
        const historique = window.dataManager.getHistorique();
        
        this.mainContent.innerHTML = `
            <div class="history-list">
                ${historique.length > 0 ? historique.map(h => this.createHistoryItem(h)).join('') : this.createEmptyState('Aucun historique')}
            </div>
        `;
    }

    renderStats() {
        this.pageTitle.textContent = 'Statistiques';
        this.mainContent.innerHTML = `
            <div class="stats-container">
                <div class="card chart-card">
                    <h3>Répartition par catégorie</h3>
                    <canvas id="chart-categories"></canvas>
                </div>
                <div class="card chart-card">
                    <h3>Utilisation des couleurs</h3>
                    <canvas id="chart-colors"></canvas>
                </div>
            </div>
        `;
        this.initCharts();
    }

    renderSettings() {
        this.pageTitle.textContent = 'Paramètres';
        const settings = window.dataManager.getSettings();
        
        this.mainContent.innerHTML = `
            <div class="settings-form card">
                <div class="form-group">
                    <label>Prénom</label>
                    <input type="text" value="${settings.userName}" onchange="window.dataManager.saveSettings({userName: this.value})">
                </div>
                <div class="form-group">
                    <label>Ville (Météo)</label>
                    <input type="text" value="${settings.location}" onchange="window.dataManager.saveSettings({location: this.value})">
                </div>
                <div class="form-group">
                    <label>Mode Voyage</label>
                    <label class="switch">
                        <input type="checkbox" ${settings.modeVoyage ? 'checked' : ''} onchange="window.dataManager.saveSettings({modeVoyage: this.checked})">
                        <span class="slider"></span>
                    </label>
                </div>
                <hr>
                <div class="actions">
                    <button class="btn btn-outline" onclick="app.exportData()">Exporter JSON</button>
                    <button class="btn btn-danger" onclick="app.resetApp()">Réinitialiser</button>
                </div>
            </div>
        `;
    }

    // --- Composants UI ---

    createPieceCard(piece) {
        return `
            <div class="piece-card" data-id="${piece.id}">
                <div class="piece-image" style="background-color: ${this.getColorHex(piece.couleur)}">
                    <img src="${piece.imageUrl || 'https://via.placeholder.com/150'}" alt="${piece.nom}">
                    <span class="badge badge-${piece.statut}">${piece.statut}</span>
                </div>
                <div class="piece-info">
                    <h4>${piece.nom}</h4>
                    <p>${piece.categorie} • ${piece.couleur}</p>
                </div>
            </div>
        `;
    }

    createOutfitCard(outfit) {
        return `
            <div class="outfit-card">
                <div class="outfit-previews">
                    ${outfit.pieces.slice(0, 3).map(pId => \`<div class="mini-preview" data-id="\${pId}"></div>\`).join('')}
                </div>
                <div class="outfit-info">
                    <h4>${outfit.nom || 'Tenue sans nom'}</h4>
                    <div class="outfit-meta">
                        <span class="score"><i class="fas fa-star"></i> ${outfit.score}</span>
                    </div>
                </div>
            </div>
        `;
    }

    createEmptyState(text) {
        return \`<div class="empty-state"><i class="fas fa-box-open"></i><p>\${text}</p></div>\`;
    }

    // --- Gestion des Modales ---

    openModal(id) {
        const modal = this.modals[id];
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(id) {
        const modal = this.modals[id];
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // --- Météo ---

    async updateWeatherWidget() {
        const widget = document.getElementById('weather-widget');
        try {
            const meteo = await window.weatherService.getWeather();
            widget.innerHTML = \`
                <div class="meteo-main">
                    <img src="\${window.weatherService.getWeatherIconUrl(meteo.icon)}" alt="icon">
                    <span class="temp">\${Math.round(meteo.temperature)}°C</span>
                </div>
                <div class="meteo-details">
                    <p class="city">\${meteo.city}</p>
                    <p class="desc">\${meteo.description}</p>
                </div>
            \`;
        } catch (e) {
            widget.innerHTML = '<p>Météo non disponible</p>';
        }
    }

    // --- Utilitaires ---

    getColorHex(color) {
        const colors = {
            'noir': '#1a1a1a', 'blanc': '#ffffff', 'gris': '#8e8e93',
            'bleu': '#007aff', 'rouge': '#ff3b30', 'vert': '#4cd964',
            'jaune': '#ffcc00', 'beige': '#f5f5dc', 'marine': '#000080'
        };
        return colors[color] || '#ddd';
    }

    setupEventListeners() {
        // Fermer les modales au clic sur l'overlay
        Object.values(this.modals).forEach(modal => {
            if (!modal) return;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id.replace('modal-', ''));
            });
        });
    }

    initCharts() {
        console.log('Initialisation des graphiques...');
    }
}

// Export global
window.ui = new UIManager();
