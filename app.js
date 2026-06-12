// app.js - Main game engine loop and tracking mechanics
const GameEngine = {
    // Current daily match parameters configuration (loaded dynamically)
    challenge: {
        date: "",
        start: "",
        target: ""
    },

    // Dynamic gameplay metric counters state tracking
    state: {
        currentPage: "",
        clicks: 0,
        backtracks: 0,
        seconds: 0,
        history: [],
        timerInterval: null,
        isActive: false
    },

    // Cache structural elements from DOM interface layout
    dom: {},

    // Gather elements and bootstrap application listeners
    init() {
        this.dom = {
            timer: document.getElementById("timer"),
            clickCount: document.getElementById("click-count"),
            backtrackCount: document.getElementById("backtrack-count"),
            startNode: document.getElementById("start-node"),
            targetNode: document.getElementById("target-node"),
            bestTime: document.getElementById("best-time"),
            bestClicks: document.getElementById("best-clicks"),
            heading: document.getElementById("firstHeading"),
            bodyContent: document.getElementById("bodyContent"),
            backBtn: document.getElementById("back-btn"),
            restartBtn: document.getElementById("restart-btn"),
            victoryModal: document.getElementById("victory-modal"),
            finalTime: document.getElementById("final-time"),
            finalClicks: document.getElementById("final-clicks"),
            finalBacktracks: document.getElementById("final-backtracks"),
            closeModalBtn: document.getElementById("close-modal-btn")
        };

        this.bindEvents();
        this.loadDailyChallenge();
    },

    // Attach interaction click handlers across system buttons
    bindEvents() {
        this.dom.backBtn.addEventListener("click", () => this.handleBacktrack());
        this.dom.restartBtn.addEventListener("click", () => this.startNewRun());
        this.dom.closeModalBtn.addEventListener("click", () => {
            this.dom.victoryModal.classList.add("hidden");
        });

        // Watch for link selections directly inside text articles
        this.dom.bodyContent.addEventListener("click", (e) => this.handleContentClick(e));
    },

    // Fetches the challenges list file and matches today's date
    async loadDailyChallenge() {
        this.dom.bodyContent.innerHTML = "<p>Syncing with the Wiki Runner challenge satellite...</p>";
        
        try {
            const response = await fetch("challenges.json");
            if (!response.ok) throw new Error("Could not load challenge database.");
            
            const challengesList = await response.json();
            
            // Get today's calendar date in YYYY-MM-DD format based on local time
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const todayStr = `${year}-${month}-${day}`;

            // Check if we have an entry for today, otherwise fall back to a default match
            if (challengesList[todayStr]) {
                this.challenge = {
                    date: todayStr,
                    start: challengesList[todayStr].start,
                    target: challengesList[todayStr].target
                };
            } else {
                // Default fallback backup if you forget to update the file
                this.challenge = {
                    date: todayStr,
                    start: "Earth",
                    target: "Inland Taipan"
                };
            }

            // Start up the run now that our coordinates are ready
            this.startNewRun();

        } catch (error) {
            console.error("Initialization error:", error);
            this.dom.bodyContent.innerHTML = `<p style="color:red;">Failed to initialize game data: ${error.message}</p>`;
        }
    },

    // Set up standard run data metrics and load initial data
    async startNewRun() {
        this.stopTimer();
        
        this.state.clicks = 0;
        this.state.backtracks = 0;
        this.state.seconds = 0;
        this.state.history = [];
        this.state.isActive = true;

        this.dom.startNode.textContent = this.challenge.start;
        this.dom.targetNode.textContent = this.challenge.target;
        
        this.updateDisplayMetrics();
        this.loadLocalRecords();
        await this.navigateToPage(this.challenge.start, false);
        
        this.startTimer();
    },

    // Render text data values back to visible counter nodes
    updateDisplayMetrics() {
        this.dom.clickCount.textContent = this.state.clicks;
        this.dom.backtrackCount.textContent = this.state.backtracks;
        
        const mins = String(Math.floor(this.state.seconds / 60)).padStart(2, "0");
        const secs = String(this.state.seconds % 60).padStart(2, "0");
        this.dom.timer.textContent = `${mins}:${secs}`;
    },

    // Refresh display panels matching stored local records
    loadLocalRecords() {
        const records = GameStorage.getBestScores(this.challenge.start, this.challenge.target);
        
        if (records.time !== null) {
            const mins = String(Math.floor(records.time / 60)).padStart(2, "0");
            const secs = String(records.time % 60).padStart(2, "0");
            this.dom.bestTime.textContent = `${mins}:${secs}`;
        } else {
            this.dom.bestTime.textContent = "--";
        }
        
        this.dom.bestClicks.textContent = records.clicks !== null ? records.clicks : "--";
    },

    // Download article content and load into framework container
    async navigateToPage(pageTitle, isLinkClick = true) {
        this.dom.bodyContent.innerHTML = "<p>Downloading Wikipedia transmission data stream...</p>";
        this.dom.heading.textContent = pageTitle.replace(/_/g, " ");

        const rawHtml = await WikipediaAPI.fetchArticle(pageTitle);
        this.dom.bodyContent.innerHTML = rawHtml;

        this.state.currentPage = pageTitle;
        
        if (isLinkClick) {
            this.state.clicks++;
            this.state.history.push(pageTitle);
        } else {
            this.state.history.push(pageTitle);
        }

        this.updateDisplayMetrics();
        this.cleanInjectedLinks();
        this.checkWinCondition();
    },

    // Modify standard wiki internal routing actions to intercept jumps
    cleanInjectedLinks() {
        const anchors = this.dom.bodyContent.getElementsByTagName("a");
        for (let anchor of anchors) {
            const href = anchor.getAttribute("href");
            
            // Check if link points safely to standard internal article pages
            if (href && href.startsWith("/wiki/") && !href.includes(":")) {
                const targetTitle = href.substring(6);
                anchor.setAttribute("data-wiki-target", targetTitle);
                anchor.removeAttribute("href"); // Drop normal redirect actions
            } else {
                // Dim down irrelevant external elements out of play area
                anchor.style.color = "#72777d";
                anchor.style.cursor = "default";
                anchor.style.textDecoration = "none";
                anchor.addEventListener("click", (e) => e.preventDefault());
            }
        }
    },

    // Click handler checking intercept tags on article components
    handleContentClick(e) {
        if (!this.state.isActive) return;
        
        const targetTitle = e.target.getAttribute("data-wiki-target");
        if (targetTitle) {
            this.navigateToPage(targetTitle, true);
        }
    },

    // Step backward along saved navigation breadcrumb links
    handleBacktrack() {
        if (!this.state.isActive || this.state.history.length <= 1) return;

        this.state.history.pop(); // Drop current element page position
        const previousPage = this.state.history[this.state.history.length - 1];
        
        this.state.backtracks++;
        this.navigateToPage(previousPage, false);
    },

    // Background timer clock interval control methods
    startTimer() {
        this.state.timerInterval = setInterval(() => {
            this.state.seconds++;
            this.updateDisplayMetrics();
        }, 1000);
    },

    stopTimer() {
        clearInterval(this.state.timerInterval);
    },

    // Compare matches checking current titles against terminal values
    checkWinCondition() {
        const normalizedCurrent = this.state.currentPage.toLowerCase().replace(/_/g, " ");
        const normalizedTarget = this.challenge.target.toLowerCase().replace(/_/g, " ");

        if (normalizedCurrent === normalizedTarget) {
            this.handleVictory();
        }
    },

    // Halt systems, trigger score evaluation storage and open modal
    handleVictory() {
        this.stopTimer();
        this.state.isActive = false;

        GameStorage.saveRun(
            this.challenge.start, 
            this.challenge.target, 
            this.state.seconds, 
            this.state.clicks
        );

        this.dom.finalTime.textContent = this.state.seconds;
        this.dom.finalClicks.textContent = this.state.clicks;
        this.dom.finalBacktracks.textContent = this.state.backtracks;
        
        this.dom.victoryModal.classList.remove("hidden");
        this.loadLocalRecords();
    }
};

// Fire startup trigger routine when document tree maps ready
document.addEventListener("DOMContentLoaded", () => GameEngine.init());
