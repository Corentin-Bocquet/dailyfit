// UI Renderer - Gestionnaire d'interface pour DailyFit
export class UIRenderer {
    constructor(app) {
        this.app = app;
    }

    // --- Vues Principales ---
    renderOnboarding(container) {
        container.innerHTML = `
            <div class="onboarding-container animate-fade-in">
                <div class="onboarding-card card">
                    <h2 class="text-center">Bienvenue sur DailyFit</h2>
                    <p class="text-center text-secondary">L'assistant qui choisit la meilleure tenue pour vous selon la météo et vos activités.</p>
                    <div id="onboarding-content"></div>
                </div>
            </div>
        `;
        this.app.settings.showOnboardingStep(1);
    }

    async renderHome(container) {
        const settings = this.app.data.getSettings();
        const history = this.app.data.getHistory();
        const today = new Date().toISOString().split('T')[0];
        const todayOutfit = history.find(h => h.date === today);

        container.innerHTML = `
            <div class="dashboard-grid animate-slide-up">
                <header class="dashboard-header">
                    <h1>Bonjour, ${settings.userName || 'l\'ami'}</h1>
                    <p class="text-secondary">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </header>

                <section class="card weather-card" id="weather-widget">
                    <div class="skeleton-text"></div>
                </section>

                <section class="card outfit-suggestion-card">
                    <div class="card-header">
                        <h3 class="card-title">Tenue du jour</h3>
                        ${todayOutfit ? '<span class="badge badge-success">Portée</span>' : ''}
                    </div>
                    <div id="daily-suggestion-container">
                        ${todayOutfit ? this.createOutfitPreview(todayOutfit) : this.createEmptySuggestion()}
                    </div>
                </section>

                <section class="card stats-preview-card">
                    <h3 class="card-title">Aperçu semaine</h3>
                    <div class="stats-row">
                        <div class="stat-item">
                            <span class="stat-value">${history.length}</span>
                            <span class="stat-label">Portés</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">85%</span>
                            <span class="stat-label">Style</span>
                        </div>
                    </div>
                </section>
            </div>
        `;
        this.updateWeatherWidget();
    }

    renderWardrobe(container) {
        const pieces = this.app.data.getPieces();
        container.innerHTML = `
            <div class="page-header animate-fade-in">
                <h1>Ma Garde-robe</h1>
                <button class="btn btn-primary" id="btn-add-piece">
                    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                    Ajouter
                </button>
            </div>

            <div class="filter-bar">
                <button class="filter-chip active" data-filter="all">Tout</button>
                <button class="filter-chip" data-filter="haut">Hauts</button>
                <button class="filter-chip" data-filter="bas">Bas</button>
                <button class="filter-chip" data-filter="chaussures">Chaussures</button>
            </div>

            <div class="pieces-grid grid grid-4 animate-slide-up">
                ${pieces.length > 0 ? pieces.map(p => this.createPieceCard(p)).join('') : this.createEmptyState('Votre garde-robe est vide')}
            </div>
        `;
        
        document.getElementById('btn-add-piece').onclick = () => this.openAddPieceModal();
    }

    renderOutfits(container) {
        const outfits = this.app.data.getOutfits();
        container.innerHTML = `
            <div class="page-header animate-fade-in">
                <h1>Mes Tenues</h1>
                <button class="btn btn-primary" id="btn-create-outfit">Créer une tenue</button>
            </div>
            <div class="outfits-grid grid grid-2 animate-slide-up">
                ${outfits.length > 0 ? outfits.map(o => this.createOutfitCard(o)).join('') : this.createEmptyState('Aucune tenue enregistrée')}
            </div>
        `;
    }

    renderHistory(container) {
        const history = this.app.data.getHistory();
        container.innerHTML = `
            <div class="page-header animate-fade-in">
                <h1>Historique</h1>
            </div>
            <div class="history-list animate-slide-up">
                ${history.length > 0 ? history.reverse().map(h => this.createHistoryItem(h)).join('') : this.createEmptyState('Aucun historique')}
            </div>
        `;
    }

    async renderPlanning(container) {
        container.innerHTML = `
            <div class="page-header animate-fade-in">
                <h1>Planification</h1>
            </div>
            <div class="calendar-container animate-slide-up">
                <p class="text-center text-secondary">Fonctionnalité de calendrier en cours de développement.</p>
            </div>
        `;
    }

    renderStats(container) {
        container.innerHTML = `
            <div class="page-header animate-fade-in">
                <h1>Statistiques</h1>
            </div>
            <div class="stats-grid grid grid-2 animate-slide-up">
                <div class="card">
                    <h3 class="card-title">Répartition par catégorie</h3>
                    <div class="chart-placeholder"></div>
                </div>
                <div class="card">
                    <h3 class="card-title">Utilisation des couleurs</h3>
                    <div class="chart-placeholder"></div>
                </div>
            </div>
        `;
    }

    renderSettings(container) {
        const settings = this.app.data.getSettings();
        container.innerHTML = `
            <div class="page-header animate-fade-in">
                <h1>Paramètres</h1>
            </div>
            <div class="settings-container card animate-slide-up">
                <div class="form-group">
                    <label class="form-label">Prénom</label>
                    <input type="text" class="form-input" id="setting-name" value="${settings.userName || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Ville (Météo)</label>
                    <input type="text" class="form-input" id="setting-city" value="${settings.ville || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Thème</label>
                    <select class="form-select" id="setting-theme">
                        <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Auto (Système)</option>
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Clair</option>
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Sombre</option>
                    </select>
                </div>
                <div class="settings-actions">
                    <button class="btn btn-primary" id="btn-save-settings">Enregistrer</button>
                    <button class="btn btn-secondary" id="btn-reset-data">Réinitialiser tout</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-save-settings').onclick = () => {
            const updates = {
                userName: document.getElementById('setting-name').value,
                ville: document.getElementById('setting-city').value,
                theme: document.getElementById('setting-theme').value
            };
            this.app.data.updateSettings(updates);
            this.app.applyTheme(updates.theme);
            this.app.showToast('Paramètres enregistrés', 'success');
        };
    }

    // --- Composants ---
    createPieceCard(piece) {
        return `
            <div class="piece-card card" data-id="${piece.id}">
                <div class="piece-image" style="background-color: ${this.getColorHex(piece.couleurs[0])}">
                    <span class="piece-category-badge">${piece.categorie}</span>
                </div>
                <div class="piece-info">
                    <h4>${piece.nom}</h4>
                    <p class="text-secondary">${piece.moods.join(', ')}</p>
                </div>
            </div>
        `;
    }

    createOutfitCard(outfit) {
        return `
            <div class="outfit-card card" data-id="${outfit.id}">
                <div class="outfit-preview">
                    ${outfit.pieces.slice(0, 3).map(pId => `<div class="mini-piece"></div>`).join('')}
                </div>
                <h4>${outfit.nom}</h4>
                <div class="outfit-tags">
                    ${outfit.moods.map(m => `<span class="badge badge-accent">${m}</span>`).join('')}
                </div>
            </div>
        `;
    }

    createHistoryItem(item) {
        return `
            <div class="history-item card">
                <div class="history-date">${new Date(item.date).toLocaleDateString('fr-FR')}</div>
                <div class="history-content">
                    <strong>${item.mood}</strong> - ${item.commentaire || 'Pas de commentaire'}
                </div>
            </div>
        `;
    }

    createEmptySuggestion() {
        return `
            <div class="empty-suggestion text-center">
                <p>Besoin d'aide pour choisir ?</p>
                <button class="btn btn-primary" onclick="window.App.generateDailyOutfit()">Générer un outfit</button>
            </div>
        `;
    }

    createOutfitPreview(outfit) {
        return `
            <div class="outfit-preview-display">
                <p>Votre tenue est prête !</p>
                <!-- Détails ici -->
            </div>
        `;
    }

    createEmptyState(text) {
        return `<div class="empty-state text-center text-secondary">${text}</div>`;
    }

    // --- Modales ---
    openAddPieceModal() {
        // Logique modale ajout pièce
        this.app.showToast('Ajout de pièce bientôt disponible', 'info');
    }

    // --- Météo ---
    async updateWeatherWidget() {
        const widget = document.getElementById('weather-widget');
        const settings = this.app.data.getSettings();
        if (!settings.apiWeatherKey) {
            widget.innerHTML = '<p class="text-center">Configurez votre clé API météo dans les paramètres.</p>';
            return;
        }
        try {
            const meteo = await this.app.weather.getWeather(settings.ville, settings.latitude, settings.longitude, settings.apiWeatherKey);
            widget.innerHTML = `
                <div class="weather-info">
                    <span class="weather-temp">${Math.round(meteo.temperature)}°C</span>
                    <span class="weather-desc">${meteo.conditions}</span>
                    <span class="weather-city">${meteo.city}</span>
                </div>
            `;
        } catch (e) {
            widget.innerHTML = '<p class="text-center">Erreur météo</p>';
        }
    }

    // --- Utilitaires ---
    getColorHex(color) {
        const colors = { 'noir': '#1a1a1a', 'blanc': '#ffffff', 'gris': '#8e8e93', 'bleu': '#007aff', 'rouge': '#ff3b30', 'vert': '#4cd964', 'jaune': '#ffcc00', 'beige': '#f5f5dc' };
        return colors[color] || '#ddd';
    }
}
