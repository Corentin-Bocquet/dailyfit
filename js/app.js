// DAILYFIT - Application Principal
import { DataManager } from './data.js';
import { WeatherService } from './weather.js';
import { OutfitGenerator } from './generator.js';
import { UIRenderer } from './ui.js';
import { SettingsManager } from './settings.js';

const App = {
    currentView: 'home',
    data: null,
    weather: null,
    generator: null,
    ui: null,
    settings: null,

    async init() {
        console.log('DailyFit Initializing...');
        
        // Modules
        this.data = new DataManager();
        this.weather = new WeatherService();
        this.generator = new OutfitGenerator(this.data);
        this.ui = new UIRenderer(this);
        this.settings = new SettingsManager(this.data);

        // Theme
        const prefs = this.data.getSettings();
        this.applyTheme(prefs.theme || 'auto');

        // Navigation
        this.setupNavigation();

        // Initial Route
        if (!this.data.getPieces().length && !prefs.userName) {
            this.navigateTo('onboarding');
        } else {
            this.navigateTo('home');
        }
    },

    setupNavigation() {
        const navHandler = (e) => {
            const link = e.target.closest('.nav-link');
            if (!link) return;
            e.preventDefault();
            const view = link.dataset.view;
            if (view) this.navigateTo(view);
        };

        document.addEventListener('click', navHandler);
    },

    async navigateTo(view) {
        this.currentView = view;
        
        // Update UI Active states
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.view === view);
        });

        const main = document.getElementById('main-content');
        if (!main) return;

        main.innerHTML = '<div class="loader">Chargement...</div>';

        try {
            switch(view) {
                case 'onboarding': this.ui.renderOnboarding(main); break;
                case 'home': await this.ui.renderHome(main); break;
                case 'wardrobe': this.ui.renderWardrobe(main); break;
                case 'history': this.ui.renderHistory(main); break;
                case 'stats': this.ui.renderStats(main); break;
                case 'settings': this.ui.renderSettings(main); break;
                default: await this.ui.renderHome(main);
            }
        } catch (err) {
            console.error('Navigation error:', err);
            main.innerHTML = '<p class="text-danger">Erreur de chargement de la page.</p>';
        }
    },

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else if (theme === 'light') {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', prefersDark);
        }
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-fade-in`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
export default App;
