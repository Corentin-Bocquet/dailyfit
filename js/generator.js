// Module de génération intelligente d'outfits
// Algorithme de scoring, filtrage et recommandation
export class OutfitGenerator {
    constructor(dataManager) {
        this.data = dataManager;
    }

    async generateOutfit(options = {}) {
        const {
            meteo = null,
            mood = 'chill',
            excludePieces = []
        } = options;

        const pieces = this.data.getPieces();
        const history = this.data.getHistory();
        const settings = this.data.getSettings();

        // 1. Filtrer les pièces disponibles et adaptées
        let available = pieces.filter(p => {
            if (p.enLavage || !p.disponible || p.archived) return false;
            if (excludePieces.includes(p.id)) return false;
            
            // Mode Voyage
            if (settings.modeVoyage && !settings.piecesVoyage.includes(p.id)) return false;

            // Météo & Saisons
            if (meteo) {
                const temp = meteo.temperature;
                if (temp < p.tempMin || temp > p.tempMax) return false;
                if (!p.pluie && (meteo.conditions.toLowerCase().includes('pluie') || meteo.conditions.toLowerCase().includes('averse'))) return false;
            }

            // Fraîcheur
            return this.data.isPieceFraiche(p);
        });

        if (available.length === 0) throw new Error('Aucune pièce disponible avec ces critères');

        // 2. Catégorisation
        const categorized = {
            haut: available.filter(p => p.categorie === 'haut'),
            bas: available.filter(p => p.categorie === 'bas'),
            chaussures: available.filter(p => p.categorie === 'chaussures'),
            manteau: available.filter(p => p.categorie === 'manteau'),
            veste: available.filter(p => p.categorie === 'veste'),
            pull: available.filter(p => p.categorie === 'pull'),
            accessoire: available.filter(p => p.categorie === 'accessoire')
        };

        // 3. Logique de combinaison (Haut + Bas + Chaussures obligatoire)
        if (categorized.haut.length === 0 || categorized.bas.length === 0 || categorized.chaussures.length === 0) {
            throw new Error('Garde-robe incomplète pour générer une tenue complète');
        }

        const possibleCombos = [];
        // Limitation pour éviter l'explosion combinatoire
        const poolH = categorized.haut.slice(0, 10);
        const poolB = categorized.bas.slice(0, 10);
        const poolC = categorized.chaussures.slice(0, 10);

        for (const h of poolH) {
            for (const b of poolB) {
                for (const c of poolC) {
                    const combo = [h, b, c];
                    
                    // Ajouts optionnels selon météo
                    if (meteo && meteo.temperature < 15) {
                        if (categorized.pull.length > 0) combo.push(categorized.pull[0]);
                        if (meteo.temperature < 10 && categorized.manteau.length > 0) combo.push(categorized.manteau[0]);
                        else if (categorized.veste.length > 0) combo.push(categorized.veste[0]);
                    }

                    possibleCombos.push({
                        pieces: combo,
                        score: this.scoreCombo(combo, meteo, mood, history, settings)
                    });
                }
            }
        }

        if (possibleCombos.length === 0) throw new Error('Impossible de créer une combinaison valide');

        // Trier par score décroissant
        possibleCombos.sort((a, b) => b.score - a.score);
        
        // Prendre le meilleur (ou un top random pour varier)
        const topCount = Math.min(3, possibleCombos.length);
        const selected = possibleCombos[Math.floor(Math.random() * topCount)];

        return {
            id: crypto.randomUUID(),
            pieces: selected.pieces.map(p => p.id),
            score: selected.score,
            mood: mood,
            date: new Date().toISOString().split('T')[0],
            raison: this.generateReason(selected.pieces, meteo, mood)
        };
    }

    scoreCombo(pieces, meteo, mood, history, settings) {
        let score = 50; // Base

        // Mood match (très important)
        const moodMatch = pieces.filter(p => p.moods.includes(mood)).length / pieces.length;
        score += moodMatch * 40;

        // Harmonie des couleurs (simplifié : bonus si peu de couleurs différentes ou couleurs compatibles)
        const uniqueColors = new Set(pieces.flatMap(p => p.couleurs));
        if (uniqueColors.size <= 3) score += 10;
        
        // Bonus pour les favoris
        score += pieces.filter(p => p.favori).length * 5;

        return Math.min(100, score);
    }

    generateReason(pieces, meteo, mood) {
        if (meteo && meteo.temperature < 10) return `Une tenue chaude et stylée pour un temps à ${Math.round(meteo.temperature)}°C.`;
        if (mood === 'travail') return `Parfait pour rester pro tout en étant confortable au bureau.`;
        return `Un look ${mood} idéal pour aujourd'hui !`;
    }
}
