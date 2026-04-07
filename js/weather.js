// DAILYFIT - Weather Service
// Intégration API OpenWeatherMap

export class WeatherService {
    constructor() {
        this._cache = null;
        this._cacheTime = null;
        this.CACHE_TTL = 30 * 60 * 1000; // 30 minutes
    }

    async getWeather(ville = 'Paris', lat = 48.8566, lon = 2.3522, apiKey = '') {
        if (!apiKey) {
            // Mock data if no API key for demonstration
            return {
                temperature: 18,
                conditions: 'Partiellement nuageux',
                city: ville,
                icon: '02d'
            };
        }

        // Check session cache
        if (this._cache && this._cacheTime && (Date.now() - this._cacheTime) < this.CACHE_TTL) {
            return this._cache;
        }

        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`);
            if (!res.ok) throw new Error('Erreur API météo');
            
            const data = await res.json();
            const result = {
                temperature: data.main.temp,
                conditions: data.weather[0].description,
                city: data.name,
                icon: data.weather[0].icon
            };
            
            this._cache = result;
            this._cacheTime = Date.now();
            return result;
        } catch (e) {
            console.error('WeatherService:', e);
            throw e;
        }
    }
}
