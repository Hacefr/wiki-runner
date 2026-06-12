// api.js - Handles fetching text data directly from Wikipedia
const WikipediaAPI = {
    // Fetches text content from a Wikipedia page title
    async fetchArticle(pageTitle) {
        // Using the Rest API endpoint handles browser security formatting better
        const cleanTitle = encodeURIComponent(pageTitle.trim().replace(/\s+/g, '_'));
        const url = `https://wikipedia.org{cleanTitle}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Network connection issue encountered.");
            }
            
            const htmlText = await response.text();
            return htmlText;
            
        } catch (error) {
            console.error("Wikipedia fetch error:", error);
            return `<p style="color:red;">Error loading article "${pageTitle}". Ensure the title matches Wikipedia exactly.</p>`;
        }
    }
};
