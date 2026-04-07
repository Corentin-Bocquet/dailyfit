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
      throw new Error('Clé API OpenWeatherMap non configurée');
    }

    // Check session cache
    if (this._cache && this._cacheTime && (Date.now() - this._cacheTime) < this.CACHE_TTL) {
      return this._cache;
    }

    try {
      // Get current weather
      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`)
      ]);

      if (!currentRes.ok || !forecastRes.ok) {
        throw new Error('Erreur API météo');
      }

      const current = await currentRes.json();
      const forecast = await forecastRes.json();
      
      const result = this._processWeather(current, forecast);
      this._cache = result;
      this._cacheTime = Date.now();
      return result;
    } catch (e) {
      console.error('WeatherService:', e);
      throw e;
    }
  }

  _processWeather(current, forecast) {
    const now = new Date();
    const matin = new Date(); matin.setHours(9, 0, 0, 0);
    const soir = new Date(); soir.setHours(18, 0, 0, 0);
    
    // Filter forecasts for today
    const todayStr = now.toISOString().split('T')[0];
    const todayForecasts = forecast.list.filter(f => f.dt_txt.startsWith(todayStr));
    
    // Morning (6-12h)
    const matinForecast = forecast.list.find(f => {
      const d = new Date(f.dt * 1000);
      return f.dt_txt.startsWith(todayStr) && d.getHours() >= 6 && d.getHours() <= 12;
    }) || todayForecasts[0] || forecast.list[0];
    
    // Afternoon (12-20h)
    const apremForecast = forecast.list.find(f => {
      const d = new Date(f.dt * 1000);
      return f.dt_txt.startsWith(todayStr) && d.getHours() >= 12 && d.getHours() <= 18;
    }) || todayForecasts[1] || forecast.list[1];
    
    // Min/Max du jour
    const temps = todayForecasts.map(f => f.main.temp);
    const tempMin = Math.min(...temps, current.main.temp_min);
    const tempMax = Math.max(...temps, current.main.temp_max);
    
    // Probability of rain
    const pop = Math.max(...todayForecasts.map(f => f.pop || 0), 0);
    
    return {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      tempMin: Math.round(tempMin),
      tempMax: Math.round(tempMax),
      pluie: pop > 0.4,
      pop: Math.round(pop * 100),
      vent: Math.round(current.wind.speed * 3.6), // m/s to km/h
      description: current.weather[0]?.description || 'N/A',
      icone: current.weather[0]?.icon || '01d',
      saison: this._getSaison(Math.round(current.main.feels_like)),
      matin: {
        temp: Math.round(matinForecast?.main?.feels_like || current.main.feels_like),
        description: matinForecast?.weather?.[0]?.description || current.weather[0]?.description,
        pluie: (matinForecast?.pop || 0) > 0.4
      },
      aprem: {
        temp: Math.round(apremForecast?.main?.feels_like || current.main.feels_like),
        description: apremForecast?.weather?.[0]?.description || current.weather[0]?.description,
        pluie: (apremForecast?.pop || 0) > 0.4
      },
      ecartMatinSoir: Math.abs(
        (matinForecast?.main?.temp || current.main.temp) - 
        (apremForecast?.main?.temp || current.main.temp)
      )
    };
  }

  _getSaison(feelsLike) {
    if (feelsLike <= 5) return 'hiver';
    if (feelsLike <= 10) return 'hiverdoux';
    if (feelsLike <= 18) return 'mi-saison';
    if (feelsLike <= 22) return 'printemps';
    if (feelsLike <= 26) return 'ete';
    return 'etchaud';
  }

  getWeatherIconUrl(icon) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  getSaisonLabel(saison) {
    const labels = {
      'hiver': 'Hiver froid',
      'hiverdoux': 'Hiver doux',
      'mi-saison': 'Mi-saison',
      'printemps': 'Printemps',
      'ete': 'Eté',
      'etchaud': 'Eté chaud',
      'automne': 'Automne'
    };
    return labels[saison] || saison;
  }

  clearCache() {
    this._cache = null;
    this._cacheTime = null;
  }

  async testConnection(apiKey, lat = 48.8566, lon = 2.3522) {
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
      return res.ok;
    } catch (e) {
      return false;
    }
  }
}
