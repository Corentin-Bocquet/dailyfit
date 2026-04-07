// UI Renderer - Gestionnaire d'interface pour DailyFit
export class UIRenderer {
    constructor(app) {
        this.app = app;
        this.currentView = 'home';
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

        let content = `
            <div class="home-grid animate-fade-in">
                <section class="hero-section">
                    <div class="weather-widget card" id="weather-widget">
                        <p class="text-center">Chargement météo...</p>
                    </div>
                    <div class="welcome-text">
                        <h1>Bonjour, ${settings.userName || 'Ami'} !</h1>
                        <p class="text-secondary">Voici votre suggestion pour aujourd'hui.</p>
                    </div>
                </section>

                <section class="daily-suggestion card">
                    <div id="outfit-display">
                        ${this.renderOutfitDisplay(todayOutfit ? todayOutfit.outfitId : null)}
                    </div>
                </section>

                <section class="quick-stats-grid">
                    <div class="stat-card card">
                        <h3>Ma Garde-robe</h3>
                        <p class="stat-value">${this.app.data.getPieces().length} pièces</p>
                    </div>
                    <div class="stat-card card">
                        <h3>Tenues portées</h3>
                        <p class="stat-value">${history.length}</p>
                    </div>
                </section>
            </div>
        `;

        container.innerHTML = content;
        this.updateWeatherWidget();
    }

    renderWardrobe(container, filters = {}) {
        const pieces = this.app.data.getPieces();
        const categories = [...new Set(pieces.map(p => p.category))];
        
        const filteredPieces = pieces.filter(p => {
            if (filters.category && p.category !== filters.category) return false;
            if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
            return true;
        });

        container.innerHTML = `
            <div class="wardrobe-view animate-fade-in">
                <header class="view-header">
                    <h2>Ma Garde-robe</h2>
                    <button class="btn btn-primary" id="add-piece-btn">
                        <span class="icon">+</span> Ajouter une pièce
                    </button>
                </header>

                <div class="filter-bar card">
                    <input type="text" id="wardrobe-search" placeholder="Rechercher..." value="${filters.search || ''}">
                    <select id="category-filter">
                        <option value="">Toutes les catégories</option>
                        ${categories.map(c => `<option value="${c}" ${filters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>

                <div class="wardrobe-grid">
                    ${filteredPieces.length > 0 ? filteredPieces.map(p => this.renderPieceCard(p)).join('') : '<p class="text-center col-full">Aucun vêtement trouvé.</p>'}
                </div>
            </div>
        `;

        // Events
        document.getElementById('add-piece-btn').onclick = () => this.showAddModal();
        document.getElementById('wardrobe-search').oninput = (e) => this.renderWardrobe(container, { ...filters, search: e.target.value });
        document.getElementById('category-filter').onchange = (e) => this.renderWardrobe(container, { ...filters, category: e.target.value });
    }

    renderHistory(container) {
        const history = this.app.data.getHistory();
        const pieces = this.app.data.getPieces();

        container.innerHTML = `
            <div class="history-view animate-fade-in">
                <header class="view-header">
                    <h2>Historique des tenues</h2>
                </header>

                <div class="history-list">
                    ${history.length > 0 ? history.sort((a,b) => new Date(b.date) - new Date(a.date)).map(entry => {
                        const outfit = this.app.data.getOutfit(entry.outfitId);
                        return `
                            <div class="history-item card">
                                <div class="history-date">${new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                <div class="history-outfit-preview">
                                    ${outfit ? outfit.pieces.map(pid => {
                                        const p = pieces.find(x => x.id === pid);
                                        return p ? \`<span class="mini-chip" style="border-left: 3px solid \${this.getColorHex(p.color)}">\${p.name}</span>\` : '';
                                    }).join('') : 'Tenue supprimée'}
                                </div>
                                <div class="history-mood">\${entry.mood || 'Normal'}</div>
                            </div>
                        `;
                    }).join('') : '<p class="text-center">Aucun historique pour le moment.</p>'}
                </div>
            </div>
        `;
    }

    renderStats(container) {
        const history = this.app.data.getHistory();
        const pieces = this.app.data.getPieces();
        
        // Calcul simple pour démo (normalement Chart.js)
        const categoryCounts = pieces.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});

        container.innerHTML = `
            <div class="stats-view animate-fade-in">
                <header class="view-header">
                    <h2>Statistiques & Insights</h2>
                </header>

                <div class="stats-grid">
                    <div class="stat-card card">
                        <h3>Utilisation par catégorie</h3>
                        <div class="simple-bar-chart">
                            ${Object.entries(categoryCounts).map(([cat, count]) => `
                                <div class="chart-row">
                                    <span class="label">${cat}</span>
                                    <div class="bar-container"><div class="bar" style="width: ${(count/pieces.length)*100}%"></div></div>
                                    <span class="value">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="stat-card card">
                        <h3>Taux de rotation</h3>
                        <p class="stat-value big">64%</p>
                        <p class="text-secondary">Vos vêtements circulent bien !</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettings(container) {
        const settings = this.app.data.getSettings();

        container.innerHTML = `
            <div class="settings-view animate-fade-in">
                <header class="view-header">
                    <h2>Paramètres</h2>
                </header>

                <div class="settings-sections">
                    <section class="settings-card card">
                        <h3>Profil & Localisation</h3>
                        <div class="form-group">
                            <label>Nom d'utilisateur</label>
                            <input type="text" id="set-username" value="${settings.userName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Ville pour la météo</label>
                            <input type="text" id="set-city" value="${settings.ville || ''}">
                        </div>
                        <button class="btn btn-primary" id="save-settings-btn">Enregistrer</button>
                    </section>

                    <section class="settings-card card">
                        <h3>Données</h3>
                        <div class="data-actions">
                            <button class="btn btn-outline" id="export-btn">Exporter JSON</button>
                            <label class="btn btn-outline">
                                Importer JSON
                                <input type="file" id="import-input" style="display:none">
                            </label>
                            <button class="btn btn-danger" id="reset-btn">Réinitialiser tout</button>
                        </div>
                    </section>
                </div>
            </div>
        `;

        document.getElementById('save-settings-btn').onclick = () => {
            const name = document.getElementById('set-username').value;
            const city = document.getElementById('set-city').value;
            this.app.settings.updateUserPrefs({ userName: name, ville: city });
            this.app.showToast('Paramètres enregistrés', 'success');
        };

        document.getElementById('export-btn').onclick = () => this.app.data.exportData();
        document.getElementById('import-input').onchange = (e) => this.app.data.importData(e.target.files[0]);
        document.getElementById('reset-btn').onclick = () => {
            if(confirm('Êtes-vous sûr de vouloir tout supprimer ?')) {
                localStorage.clear();
                location.reload();
            }
        };
    }

    // --- Helpers Composants ---
    renderOutfitDisplay(outfitId) {
        if (!outfitId) {
            return \`
                <div class="no-outfit text-center">
                    <p>Aucune tenue générée pour aujourd'hui.</p>
                    <button class="btn btn-primary btn-large" id="generate-main-btn">Générer une tenue</button>
                </div>
            \`;
        }

        const outfit = this.app.data.getOutfit(outfitId);
        const pieces = this.app.data.getPieces();

        return \`
            <div class="outfit-card">
                <h3>Votre tenue idéale</h3>
                <div class="outfit-pieces-list">
                    \${outfit.pieces.map(pid => {
                        const p = pieces.find(x => x.id === pid);
                        return this.renderPieceCard(p, true);
                    }).join('')}
                </div>
                <div class="outfit-actions">
                    <button class="btn btn-success" id="confirm-wear-btn">Je porte ça !</button>
                    <button class="btn btn-outline" id="regenerate-btn">Une autre idée ?</button>
                </div>
            </div>
        \`;
    }

    renderPieceCard(piece, isMini = false) {
        if (!piece) return '';
        return \`
            <div class="piece-card card \${isMini ? 'mini' : ''}" data-id="\${piece.id}">
                <div class="piece-color-indicator" style="background: \${this.getColorHex(piece.color)}"></div>
                <div class="piece-info">
                    <span class="piece-category">\${piece.category}</span>
                    <h4 class="piece-name">\${piece.name}</h4>
                    \${!isMini ? \`<span class="piece-status \${piece.isClean ? 'clean' : 'dirty'}">\${piece.isClean ? 'Propre' : 'Sale'}</span>\` : ''}
                </div>
            </div>
        \`;
    }

    showAddModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay animate-fade-in';
        modal.innerHTML = \`
            <div class="modal card">
                <h3>Ajouter un nouveau vêtement</h3>
                <form id="add-piece-form">
                    <div class="form-group">
                        <label>Nom</label>
                        <input type="text" name="name" required placeholder="ex: T-shirt blanc coton">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Catégorie</label>
                            <select name="category" required>
                                <option value="Haut">Haut</option>
                                <option value="Bas">Bas</option>
                                <option value="Chaussures">Chaussures</option>
                                <option value="Veste">Veste</option>
                                <option value="Accessoire">Accessoire</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Couleur</label>
                            <select name="color">
                                <option value="noir">Noir</option>
                                <option value="blanc">Blanc</option>
                                <option value="gris">Gris</option>
                                <option value="bleu">Bleu</option>
                                <option value="rouge">Rouge</option>
                                <option value="vert">Vert</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" id="close-modal">Annuler</button>
                        <button type="submit" class="btn btn-primary">Ajouter</button>
                    </div>
                </form>
            </div>
        \`;
        document.body.appendChild(modal);

        document.getElementById('close-modal').onclick = () => modal.remove();
        document.getElementById('add-piece-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newPiece = {
                id: Date.now().toString(),
                name: formData.get('name'),
                category: formData.get('category'),
                color: formData.get('color'),
                style: 'casual',
                minTemp: 10,
                maxTemp: 30,
                isClean: true,
                image: null
            };
            this.app.data.addPiece(newPiece);
            modal.remove();
            this.renderWardrobe(document.getElementById('main-content'));
            this.app.showToast('Vêtement ajouté !', 'success');
        };
    }

    async updateWeatherWidget() {
        const widget = document.getElementById('weather-widget');
        const settings = this.app.data.getSettings();
        if (!widget) return;
        
        try {
            const meteo = await this.app.weather.getWeather(settings.ville, settings.latitude, settings.longitude, settings.apiWeatherKey);
            widget.innerHTML = \`
                <div class="weather-display">
                    <img src="https://openweathermap.org/img/wn/\${meteo.icon}@2x.png" width="40">
                    <div class="weather-details">
                        <span class="temp">\${Math.round(meteo.temperature)}°C</span>
                        <span class="city">\${meteo.city}</span>
                    </div>
                </div>
            \`;
        } catch (e) {
            widget.innerHTML = '<p class="text-secondary">Météo indisponible</p>';
        }
    }

    getColorHex(color) {
        const colors = {
            'noir': '#1a1a1a', 'blanc': '#ffffff', 'gris': '#8e8e93',
            'bleu': '#007aff', 'rouge': '#ff3b30', 'vert': '#4cd964'
        };
        return colors[color] || '#ddd';
    }
}
