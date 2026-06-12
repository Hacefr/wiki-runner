// storage.js - Manages permanent tracking data inside the browser
const GameStorage = {
    // Unique key prefix for local storage namespacing
    PREFIX: "wiki_runner_",

    // Generates a lookup key combining start and target page info
    makeKey(start, target) {
        return `${this.PREFIX}${start.replace(/\s+/g, '_')}_to_${target.replace(/\s+/g, '_')}`;
    },

    // Retrieves saved personal best data for a specific route match
    getBestScores(start, target) {
        const key = this.makeKey(start, target);
        const savedData = localStorage.getItem(key);
        
        if (savedData) {
            return JSON.parse(savedData);
        }
        
        return {
            time: null,
            clicks: null
        };
    },

    // Saves new record runs if they beat old saved baselines
    saveRun(start, target, finalTime, finalClicks) {
        const key = this.makeKey(start, target);
        const currentBest = this.getBestScores(start, target);
        let updated = false;

        // Verify if time score is lower than previous record
        if (currentBest.time === null || finalTime < currentBest.time) {
            currentBest.time = finalTime;
            updated = true;
        }

        // Verify if total click score is lower than previous record
        if (currentBest.clicks === null || finalClicks < currentBest.clicks) {
            currentBest.clicks = finalClicks;
            updated = true;
        }

        if (updated) {
            localStorage.setItem(key, JSON.stringify(currentBest));
        }
        
        return currentBest;
    }
};
