export class SettingsManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // --- Onboarding ---
    showOnboardingStep(step) {
        const container = document.getElementById('onboarding-container');
        if (!container) return;
         // Settings Logic Update
        let html = '';
        switch(step) {
            case 1:
                html = `
                    <div class=\"onboarding-step active animate__animated animate__fadeIn\">
                        <h2>Bienvenue sur DailyFit</h2>
                        <p>L'assistant qui choisit la meilleure tenue pour vous selon la météo et vos activités.</p>
                        <div class=\"onboarding-image\">👕</div>
                        <button class=\"btn btn-primary btn-lg w-100\" onclick=\"window.settingsManager.showOnboardingStep(2)\">Commencer l'aventure</button>
                    </div>
                `;
                break;
            case 2:
                html = `
                    <div class=\"onboarding-step active animate__animated animate__fadeIn\">
                        <h2>Configuration Météo</h2>
                        <p>Entrez votre ville pour que DailyFit puisse consulter la météo locale.</p>
                        <div class=\"form-group\">
                            <label>Votre ville</label>
                            <input type=\"text\" id=\"onboarding-city\" placeholder=\"Ex: Paris, FR\" class=\"form-control\">
                        </div>
                        <button class=\"btn btn-primary w-100\" onclick=\"window.settingsManager.saveOnboardingData()\">Suivant</button>
                    </div>
                `;
                break;
            case 3:
                html = `
                    <div class=\"onboarding-step active animate__animated animate__fadeIn\">
                        <h2>C'est prêt !</h2>
                        <p>DailyFit est configuré. Vous pouvez maintenant ajouter vos vêtements dans la garde-robe.</p>
                        <div class=\"permission-box card bg-surface-2 p-3 mb-3\">
                            <i class=\"fas fa-check-circle text-success mb-2\" style=\"font-size: 2rem;\"></i>
                            <p class=\"mb-0\">Configuration terminée avec succès</p>
                        </div>
                        <button class=\"btn btn-primary w-100\" onclick=\"window.settingsManager.finishOnboarding()\">Terminer</button>
                    </div>
                `;
                break;
        }
        container.innerHTML = html;
    }

    saveOnboardingData() {
        const city = document.getElementById('onboarding-city').value;
        if (!city) {
            if (window.app && window.app.ui) window.app.ui.showToast('Veuillez entrer une ville', 'error');
            return;
        }
        this.dataManager.saveSettings({ city });
        this.showOnboardingStep(3);
    }

    finishOnboarding() {
        if (window.app && window.app.ui) window.app.ui.closeModal();
        const currentSettings = this.dataManager.getSettings();
        this.dataManager.saveSettings({ ...currentSettings, onboardingComplete: true });
        setTimeout(() => location.reload(), 500);
    }

    // --- Thème ---
    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.dataManager.saveSettings({ theme });
    }

    // --- Import / Export ---
    exportData() {
        const data = {
            pieces: this.dataManager.getPieces(),
            outfits: this.dataManager.getOutfits(),
            historique: this.dataManager.getHistory(),
            settings: this.dataManager.getSettings()
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dailyfit_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Validation basique
                if (data.pieces && data.settings) {
                    localStorage.setItem('dailyfit_pieces', JSON.stringify(data.pieces));
                    localStorage.setItem('dailyfit_outfits', JSON.stringify(data.outfits || []));
                    localStorage.setItem('dailyfit_history', JSON.stringify(data.historique || []));
                    localStorage.setItem('dailyfit_settings', JSON.stringify(data.settings));
                    
                    if (window.app && window.app.ui) {
                        window.app.ui.showToast('Données importées avec succès !', 'success');
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        location.reload();
                    }
                } else {
                    throw new Error('Format de fichier invalide');
                }
            } catch (err) {
                console.error('Import error:', err);
                if (window.app && window.app.ui) window.app.ui.showToast('Erreur lors de l\\'importation', 'error');
            }
        };
        reader.readAsText(file);
    }
}
