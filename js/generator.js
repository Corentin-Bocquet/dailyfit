// Module de génération intelligente d'outfits
// Algorithme de scoring, filtrage et recommandation

class OutfitGenerator {
    constructor() {
        this.lastGeneratedTime = null;
        this.minTimeBetweenGenerations = 3600000; // 1 heure en ms
    }

    // Génère un outfit selon les critères
    async generateOutfit(options = {}) {
        const {
            meteo = null,
            occasion = null,
            couleursPref = [],
            excludePieces = [],
            modeVoyage = false
        } = options;

        const pieces = window.dataManager.getAllPieces();
        const historique = window.dataManager.getHistorique();
        const settings = window.dataManager.getSettings();

        // Filtrer les pièces disponibles
        let available = this.filterAvailablePieces(pieces, historique, settings, modeVoyage);
        
        // Exclure les pièces demandées
        if (excludePieces.length > 0) {
            available = available.filter(p => !excludePieces.includes(p.id));
        }

        if (available.length < 4) {
            throw new Error('Pas assez de pièces disponibles dans la garde-robe');
        }

        // Générer plusieurs combinaisons et scorer
        const combinations = this.generateCombinations(available, 20);
        const scored = combinations.map(combo => ({
            pieces: combo,
            score: this.scoreOutfit(combo, meteo, occasion, couleursPref, historique, settings)
        }));

        // Trier par score décroissant
        scored.sort((a, b) => b.score - a.score);

        // Retourner la meilleure combinaison
        const best = scored[0];
        
        return {
            pieces: best.pieces.map(p => p.id),
            score: best.score,
            raison: this.generateRaison(best.pieces, meteo, occasion)
        };
    }

    // Filtre les pièces selon les règles de fraîcheur
    filterAvailablePieces(pieces, historique, settings, modeVoyage) {
        const now = Date.now();
        const recentDays = 7; // Période de fraîcheur
        const cutoff = now - (recentDays * 86400000);

        return pieces.filter(piece => {
            // Pièces propres uniquement
            if (piece.statut !== 'propre') return false;

            // Mode voyage : seulement pièces dans valise
            if (modeVoyage && !piece.dansValise) return false;

            // Vérifier la fraîcheur
            const recentUse = historique
                .filter(h => h.date >= cutoff)
                .flatMap(h => h.pieces)
                .filter(pid => pid === piece.id);

            const useCount = recentUse.length;
            
            // Règle : pas porté plus de 2 fois dans les 7 derniers jours
            return useCount < 2;
        });
    }

    // Génère N combinaisons aléatoires
    generateCombinations(pieces, count) {
        const combinations = [];
        const categories = {
            haut: pieces.filter(p => p.categorie === 'haut'),
            bas: pieces.filter(p => p.categorie === 'bas'),
            chaussures: pieces.filter(p => p.categorie === 'chaussures'),
            accessoire: pieces.filter(p => p.categorie === 'accessoire')
        };

        for (let i = 0; i < count; i++) {
            const combo = [];
            
            // Toujours un haut et un bas
            if (categories.haut.length > 0) {
                combo.push(this.randomPick(categories.haut));
            }
            if (categories.bas.length > 0) {
                combo.push(this.randomPick(categories.bas));
            }
            
            // Chaussures (80% de chance)
            if (categories.chaussures.length > 0 && Math.random() > 0.2) {
                combo.push(this.randomPick(categories.chaussures));
            }
            
            // Accessoire (50% de chance)
            if (categories.accessoire.length > 0 && Math.random() > 0.5) {
                combo.push(this.randomPick(categories.accessoire));
            }

            if (combo.length >= 2) {
                combinations.push(combo);
            }
        }

        return combinations;
    }

    // Calcule le score d'un outfit
    scoreOutfit(pieces, meteo, occasion, couleursPref, historique, settings) {
        let score = 100;

        // 1. Cohérence météo (+/- 30 points)
        if (meteo) {
            score += this.scoreMeteo(pieces, meteo);
        }

        // 2. Adéquation occasion (+/- 20 points)
        if (occasion) {
            score += this.scoreOccasion(pieces, occasion);
        }

        // 3. Harmonie couleurs (+/- 25 points)
        score += this.scoreCouleurs(pieces, couleursPref);

        // 4. Fraîcheur / Renouvellement (+/- 15 points)
        score += this.scoreFraicheur(pieces, historique);

        // 5. Style cohérent (+/- 10 points)
        score += this.scoreStyle(pieces);

        return Math.max(0, Math.min(200, score));
    }

    // Scoring météo
    scoreMeteo(pieces, meteo) {
        let score = 0;
        const temp = meteo.temperature;

        pieces.forEach(piece => {
            const meteoTags = piece.tags.filter(t => 
                ['chaud', 'froid', 'pluie', 'neige', 'vent', 'soleil'].includes(t)
            );

            meteoTags.forEach(tag => {
                if (temp < 10 && tag === 'chaud') score += 8;
                if (temp < 10 && tag === 'froid') score -= 5;
                if (temp > 25 && tag === 'froid') score += 8;
                if (temp > 25 && tag === 'chaud') score -= 5;
                if (meteo.conditions.includes('rain') && tag === 'pluie') score += 10;
                if (meteo.conditions.includes('snow') && tag === 'neige') score += 10;
            });
        });

        return score;
    }

    // Scoring occasion
    scoreOccasion(pieces, occasion) {
        let score = 0;
        
        pieces.forEach(piece => {
            if (piece.occasion.includes(occasion)) {
                score += 5;
            }
        });

        return score;
    }

    // Scoring couleurs
    scoreCouleurs(pieces, couleursPref) {
        let score = 0;
        const couleurs = pieces.map(p => p.couleur);

        // Préférences utilisateur
        couleursPref.forEach(pref => {
            if (couleurs.includes(pref)) score += 5;
        });

        // Harmonie basique (éviter trop de couleurs vives)
        const vives = ['rouge', 'orange', 'jaune', 'rose'];
        const countVives = couleurs.filter(c => vives.includes(c)).length;
        if (countVives > 2) score -= 10;

        // Bonus pour neutres + accent
        const neutres = ['noir', 'blanc', 'gris', 'beige', 'marine'];
        const countNeutres = couleurs.filter(c => neutres.includes(c)).length;
        if (countNeutres >= 2 && countVives === 1) score += 8;

        return score;
    }

    // Scoring fraîcheur
    scoreFraicheur(pieces, historique) {
        let score = 0;
        const now = Date.now();
        const recent = historique.filter(h => now - h.date < 7 * 86400000);

        pieces.forEach(piece => {
            const uses = recent.filter(h => h.pieces.includes(piece.id)).length;
            // Plus c'est récent, moins de points
            score -= uses * 3;
        });

        return score;
    }

    // Scoring style
    scoreStyle(pieces) {
        let score = 0;
        const styles = pieces.flatMap(p => 
            p.tags.filter(t => ['casual', 'formel', 'sport', 'streetwear', 'vintage'].includes(t))
        );

        // Cohérence : un style dominant
        const counts = {};
        styles.forEach(s => counts[s] = (counts[s] || 0) + 1);
        const max = Math.max(...Object.values(counts));
        
        if (max >= 2) score += 8;

        return score;
    }

    // Génère une raison pour l'outfit
    generateRaison(pieces, meteo, occasion) {
        const raisons = [];

        if (meteo) {
            if (meteo.temperature < 10) {
                raisons.push('Parfait pour le froid');
            } else if (meteo.temperature > 25) {
                raisons.push('Idéal pour la chaleur');
            }
            if (meteo.conditions.includes('rain')) {
                raisons.push('Adapté à la pluie');
            }
        }

        if (occasion) {
            const occMap = {
                'travail': 'Pour le travail',
                'soirée': 'Pour une soirée',
                'sport': 'Pour le sport',
                'décontracté': 'Pour un moment décontracté'
            };
            raisons.push(occMap[occasion] || 'Pour cette occasion');
        }

        const couleurs = pieces.map(p => p.couleur);
        if (couleurs.includes('noir') && couleurs.includes('blanc')) {
            raisons.push('Un classique intemporel');
        }

        return raisons.length > 0 
            ? raisons.join(' • ') 
            : 'Une belle combinaison pour aujourd\'hui';
    }

    // Utilitaire : pick aléatoire
    randomPick(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Export global
window.outfitGenerator = new OutfitGenerator();
