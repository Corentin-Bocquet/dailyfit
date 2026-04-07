// Module de génération intelligente d'outfits
// Algorithme de scoring, filtrage et recommandation

export class OutfitGenerator {
    constructor(dataManager) {
        this.data = dataManager;
        this.lastGeneratedTime = null;
    }

    // Génère un outfit selon les critères
    async generateOutfit(options = {}) {
        const {
            meteo = null,
            mood = 'chill',
            couleursPref = [],
            excludePieces = []
        } = options;

        const pieces = this.data.getPieces();
        const history = this.data.getHistory();
        const settings = this.data.getSettings();

        // 1. Filtrer les pièces disponibles et fraîches
        let available = pieces.filter(p => {
            if (p.enLavage || !p.disponible || p.archived) return false;
            if (excludePieces.includes(p.id)) return false;
            
            // Vérification fraîcheur (via dataManager helper si dispo ou logique ici)
            const recentPorts = this.getRecentPorts(p.id, history);
            return recentPorts.length < (p.fraicheur?.maxPortsParSemaine || 2);
        });

        if (available.length < 2) {
            throw new Error('Pas assez de pièces disponibles');
        }

        // 2. Créer des combinaisons (Haut + Bas + Chaussures)
        const hauts = available.filter(p => p.categorie === 'haut');
        const bas = available.filter(p => p.categorie === 'bas');
        const chaussures = available.filter(p => p.categorie === 'chaussures');

        if (hauts.length === 0 || bas.length === 0) {
            throw new Error('Manque de hauts ou de bas disponibles');
        }

        // 3. Algorithme de scoring simple pour démo
        const combinations = [];
        for (let h of hauts) {
            for (let b of bas) {
                const combo = [h, b];
                if (chaussures.length > 0) combo.push(chaussures[0]); // Simplification
                
                combinations.push({
                    pieces: combo,
                    score: this.scoreCombo(combo, meteo, mood, settings)
                });
            }
        }

        combinations.sort((a, b) => b.score - a.score);
        const best = combinations[0];

        return {
            pieces: best.pieces.map(p => p.id),
            score: best.score,
            raison: `Adapté pour un style ${mood}`
        };
    }

    scoreCombo(pieces, meteo, mood, settings) {
        let score = 100;
        // Logique de score...
        return score;
    }

    getRecentPorts(pieceId, history) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return history.filter(h => h.outfitId && new Date(h.date) > weekAgo); // Simplifié
    }
}
