// api.js - Handles fetching text data directly from Wikipedia
const WikipediaAPI = {
    // Fetches text content from a Wikipedia page title
    async fetchArticle(pageTitle) {
        // MUST point specifically to the english endpoint script file
        const baseUrl = "https://wikipedia.org";
        
        // Clean up formatting of the page title string
        const cleanTitle = pageTitle.trim().replace(/\s+/g, '_');
        
        const params = new URLSearchParams({
            action: "parse",
            page: cleanTitle,
            format: "json",
            origin: "*", // Crucial flag: unlocks browser cross-origin blocking
            prop: "text",
            disableeditsection: "true",
            disabletoc: "true"
        });

        try {
            // Re-assembling the complete verified URL path structure
            const response = await fetch(`${baseUrl}?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Network connection issue encountered.");
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.info || "Page could not be found.");
            }
            
            // Return the raw page HTML data body string
            return data.parse.text["*"];
            
        } catch (error) {
            console.error("Wikipedia fetch error:", error);
            return `<p style="color:red;">Error loading article "${pageTitle}". Ensure the title matches Wikipedia exactly.</p>`;
        }
    }
};
