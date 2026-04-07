// DAILYFIT - Application Principal
// Point d'entrée, routing, initialisation

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
    // Initialize modules
    this.data = new DataManager();
    this.weather = new WeatherService();
    this.generator = new OutfitGenerator(this.data);
    this.ui = new UIRenderer(this);
    this.settings = new SettingsManager(this.data);
    
    // Apply saved theme
    const settings = this.data.getSettings();
    this.applyTheme(settings.theme);
    
    // Setup navigation
    this.setupNavigation();
    
    // Check if first launch
    if (!this.data.hasData()) {
      this.renderView('onboarding');
    } else {
      this.renderView('home');
      if (settings.autoGenerateOnOpen) {
        await this.generateDailyOutfit();
      }
    }
  },
  
  setupNavigation() {
    // Desktop sidebar
    document.querySelectorAll('.sidebar-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.navigateTo(view);
      });
    });
    
    // Mobile bottom nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.navigateTo(view);
      });
    });
  },
  
  navigateTo(view) {
    this.currentView = view;
    
    // Update active states
    document.querySelectorAll('.sidebar-item, .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    this.renderView(view);
  },
  
  async renderView(view) {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    
    switch(view) {
      case 'onboarding': this.ui.renderOnboarding(main); break;
      case 'home': await this.ui.renderHome(main); break;
      case 'wardrobe': this.ui.renderWardrobe(main); break;
      case 'outfits': this.ui.renderOutfits(main); break;
      case 'history': this.ui.renderHistory(main); break;
      case 'planning': await this.ui.renderPlanning(main); break;
      case 'stats': this.ui.renderStats(main); break;
      case 'settings': this.ui.renderSettings(main); break;
      default: await this.ui.renderHome(main);
    }
  },
  
  async generateDailyOutfit(mood = null) {
    const settings = this.data.getSettings();
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const dayName = days[dayOfWeek];
    
    const effectiveMood = mood || settings.semaineType?.[dayName] || 'chill';
    
    // Get weather
    let meteo = null;
    try {
      meteo = await this.weather.getWeather(settings.ville, settings.latitude, settings.longitude, settings.apiWeatherKey);
    } catch(e) {
      console.warn('Meteo non disponible:', e);
    }
    
    // Generate outfit
    const result = this.generator.genererOutfit(effectiveMood, today, meteo);
    return result;
  },
  
  applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      // Auto - follow system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!prefersDark) document.documentElement.setAttribute('data-theme', 'light');
    }
  },
  
  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-down`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;cursor:pointer;color:inherit">x</button>
    `;
    container.appendChild(toast);
    if (duration > 0) {
      setTimeout(() => toast.remove(), duration);
    }
  }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());

export default App;
