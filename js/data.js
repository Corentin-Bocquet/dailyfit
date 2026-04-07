// DAILYFIT - Data Manager
// Gestion des données localStorage

export const STORAGE_KEYS = {
  PIECES: 'dailyfit_pieces',
  OUTFITS: 'dailyfit_outfits',
  HISTORY: 'dailyfit_history',
  SETTINGS: 'dailyfit_settings',
};

const DEFAULT_SETTINGS = {
  ville: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  theme: 'dark',
  langue: 'fr',
  autoGenerateOnOpen: true,
  distinguerMeteoMatinSoir: true,
  seuilEcartMatin: 8,
  eviterRepetitionCouleur: true,
  fenetreRepetition: 7,
  apiWeatherKey: '',
  semaineType: {
    lundi: 'travail', mardi: 'travail', mercredi: 'travail',
    jeudi: 'travail', vendredi: 'chill',
    samedi: 'chill', dimanche: 'chill'
  },
  seuilsTemperature: {
    hiverFroid: 5, hiverDoux: 10, miSaison: 18, printemps: 22, ete: 26, etChaud: 999
  },
  modeVoyage: false,
  piecesVoyage: []
};

const FRAICHEUR_DEFAUT = {
  'sous-vetement': { maxPortsParSemaine: 1, maxPortsConsecutifs: 1, jourReposMini: 1 },
  'chaussettes': { maxPortsParSemaine: 1, maxPortsConsecutifs: 1, jourReposMini: 1 },
  'haut': { maxPortsParSemaine: 1, maxPortsConsecutifs: 1, jourReposMini: 1 },
  'pull': { maxPortsParSemaine: 3, maxPortsConsecutifs: 2, jourReposMini: 1 },
  'bas': { maxPortsParSemaine: 7, maxPortsConsecutifs: 7, jourReposMini: 0 },
  'chaussures': { maxPortsParSemaine: 99, maxPortsConsecutifs: 99, jourReposMini: 0 },
  'manteau': { maxPortsParSemaine: 99, maxPortsConsecutifs: 99, jourReposMini: 0 },
  'veste': { maxPortsParSemaine: 99, maxPortsConsecutifs: 99, jourReposMini: 0 },
  'accessoire': { maxPortsParSemaine: 99, maxPortsConsecutifs: 99, jourReposMini: 0 },
};

export class DataManager {
  constructor() {
    this._saveTimeout = null;
  }

  _load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erreur chargement', key, e);
      return null;
    }
  }

  _save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Erreur sauvegarde', key, e);
    }
  }

  _debouncedSave(key, data) {
    clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => this._save(key, data), 500);
  }

  // ======= PIECES =======
  getPieces() { return this._load(STORAGE_KEYS.PIECES) || []; }
  savePieces(pieces) { this._save(STORAGE_KEYS.PIECES, pieces); }

  addPiece(piece) {
    const pieces = this.getPieces();
    const newPiece = {
      id: crypto.randomUUID(),
      nom: piece.nom || 'Sans nom',
      categorie: piece.categorie || 'haut',
      photos: piece.photos || [],
      couleurs: piece.couleurs || [],
      moods: piece.moods || ['chill'],
      saisons: piece.saisons || ['printemps', 'ete', 'automne', 'hiver'],
      tempMin: piece.tempMin ?? -10,
      tempMax: piece.tempMax ?? 40,
      pluie: piece.pluie || false,
      fraicheur: piece.fraicheur || FRAICHEUR_DEFAUT[piece.categorie] || {},
      disponible: true,
      enLavage: false,
      dateEnLavage: null,
      favori: false,
      archived: false,
      createdAt: new Date().toISOString()
    };
    pieces.push(newPiece);
    this.savePieces(pieces);
    return newPiece;
  }

  updatePiece(id, updates) {
    const pieces = this.getPieces();
    const idx = pieces.findIndex(p => p.id === id);
    if (idx !== -1) {
      pieces[idx] = { ...pieces[idx], ...updates };
      this.savePieces(pieces);
      return pieces[idx];
    }
    return null;
  }

  deletePiece(id) {
    let pieces = this.getPieces();
    pieces = pieces.filter(p => p.id !== id);
    this.savePieces(pieces);
  }

  // ======= OUTFITS =======
  getOutfits() { return this._load(STORAGE_KEYS.OUTFITS) || []; }
  saveOutfits(outfits) { this._save(STORAGE_KEYS.OUTFITS, outfits); }

  addOutfit(outfit) {
    const outfits = this.getOutfits();
    const newOutfit = {
      id: crypto.randomUUID(),
      nom: outfit.nom || 'Nouvel outfit',
      pieces: outfit.pieces || [],
      moods: outfit.moods || ['chill'],
      saisons: outfit.saisons || ['printemps', 'ete', 'automne', 'hiver'],
      couleursGlobales: outfit.couleursGlobales || [],
      tempMin: outfit.tempMin ?? 0,
      tempMax: outfit.tempMax ?? 35,
      pluieOK: outfit.pluieOK || false,
      score: 0,
      nombrePorts: 0,
      dernierPort: null,
      favori: false,
      archived: false,
      disponible: true,
      notes: [],
      createdAt: new Date().toISOString()
    };
    outfits.push(newOutfit);
    this.saveOutfits(outfits);
    return newOutfit;
  }

  updateOutfit(id, updates) {
    const outfits = this.getOutfits();
    const idx = outfits.findIndex(o => o.id === id);
    if (idx !== -1) {
      outfits[idx] = { ...outfits[idx], ...updates };
      this.saveOutfits(outfits);
      return outfits[idx];
    }
    return null;
  }

  deleteOutfit(id) {
    let outfits = this.getOutfits();
    outfits = outfits.filter(o => o.id !== id);
    this.saveOutfits(outfits);
  }

  // ======= HISTORIQUE =======
  getHistory() { return this._load(STORAGE_KEYS.HISTORY) || []; }
  saveHistory(history) { this._save(STORAGE_KEYS.HISTORY, history); }

  addToHistory(entry) {
    const history = this.getHistory();
    const newEntry = {
      date: entry.date || new Date().toISOString().split('T')[0],
      outfitId: entry.outfitId,
      mood: entry.mood,
      meteo: entry.meteo || null,
      note: entry.note || null,
      commentaire: entry.commentaire || ''
    };
    // Remove existing entry for same date
    const filtered = history.filter(h => h.date !== newEntry.date);
    filtered.push(newEntry);
    this.saveHistory(filtered);

    // Update outfit stats
    if (entry.outfitId) {
      this.updateOutfit(entry.outfitId, {
        nombrePorts: (this.getOutfits().find(o => o.id === entry.outfitId)?.nombrePorts || 0) + 1,
        dernierPort: newEntry.date
      });
    }
    return newEntry;
  }

  // ======= SETTINGS =======
  getSettings() {
    const saved = this._load(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  saveSettings(settings) {
    this._save(STORAGE_KEYS.SETTINGS, settings);
  }

  updateSettings(updates) {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.saveSettings(updated);
    return updated;
  }

  // ======= UTILS =======
  hasData() {
    const pieces = this.getPieces();
    return pieces.length > 0;
  }

  backup() {
    const date = new Date().toISOString().split('T')[0];
    const backup = {
      pieces: this.getPieces(),
      outfits: this.getOutfits(),
      historique: this.getHistory(),
      settings: this.getSettings()
    };
    localStorage.setItem(`dailyfit-backup-${date}`, JSON.stringify(backup));
    return backup;
  }

  exportData() {
    return this.backup();
  }

  importData(data, merge = false) {
    if (!data.pieces || !data.outfits) {
      throw new Error('Format de données invalide');
    }
    if (!merge) {
      this.backup();
    }
    if (data.pieces) this.savePieces(merge ? [...this.getPieces(), ...data.pieces] : data.pieces);
    if (data.outfits) this.saveOutfits(merge ? [...this.getOutfits(), ...data.outfits] : data.outfits);
    if (data.historique) this.saveHistory(merge ? [...this.getHistory(), ...data.historique] : data.historique);
    if (data.settings) this.saveSettings({ ...this.getSettings(), ...data.settings });
  }

  resetData() {
    this.backup();
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  getStorageSize() {
    let total = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      total += (localStorage.getItem(key) || '').length;
    });
    return total;
  }

  getRecentPorts(pieceId, jours = 7) {
    const history = this.getHistory();
    const outfits = this.getOutfits();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - jours);
    
    return history.filter(h => {
      if (!h.date || new Date(h.date) < cutoff) return false;
      const outfit = outfits.find(o => o.id === h.outfitId);
      return outfit && outfit.pieces.includes(pieceId);
    });
  }

  isEnRepos(piece) {
    const fr = piece.fraicheur;
    if (!fr) return false;
    const history = this.getHistory();
    const outfits = this.getOutfits();
    const recent = history
      .filter(h => {
        const outfit = outfits.find(o => o.id === h.outfitId);
        return outfit && outfit.pieces.includes(piece.id);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (recent.length === 0) return false;
    const lastPort = new Date(recent[0].date);
    const today = new Date();
    const daysSince = Math.floor((today - lastPort) / (1000 * 60 * 60 * 24));
    return daysSince < fr.jourReposMini;
  }

  isPieceFraiche(piece) {
    if (piece.enLavage || !piece.disponible || piece.archived) return false;
    const fr = piece.fraicheur;
    if (!fr) return true;
    const portsRecents = this.getRecentPorts(piece.id, 7);
    return portsRecents.length < (fr.maxPortsParSemaine || 99);
  }
}

export { FRAICHEUR_DEFAUT };
