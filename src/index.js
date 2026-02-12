export default {
    async fetch(request) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*", // Allow ALL origins (simplest for GitHub Pages)
            "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
            "Access-Control-Max-Age": "86400",
        };

        const url = new URL(request.url);
        
        // 1. Handle Preflight (OPTIONS)
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    ...corsHeaders,
                    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
                },
            });
        }

        // 2. Extract Target URL
        // Usage: https://your-worker.workers.dev/?apiurl=https://www.allbreedpedigree.com/chicado+v
        const apiUrl = url.searchParams.get("apiurl");

        if (!apiUrl) {
            return new Response("Missing 'apiurl' query parameter", { status: 400, headers: corsHeaders });
        }

        // 3. Prepare the Proxy Request
        // We create a FRESH request to avoid carrying over Cloudflare-specific headers that might confuse the target
        const proxyRequest = new Request(apiUrl, {
            method: request.method,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; HorsePedigreeApp/1.0)", // Be polite!
                "Accept": "text/html,application/xhtml+xml",
            }
        });

        try {
            const response = await fetch(proxyRequest);

            // 4. Prepare the Response
            // We must recreate the response to modify headers (original response headers are immutable)
            const newResponse = new Response(response.body, response);

            // Add CORS headers so YOUR browser accepts it
            newResponse.headers.set("Access-Control-Allow-Origin", "*");
            newResponse.headers.append("Vary", "Origin");

            return newResponse;
        } catch (e) {
            return new Response(`Proxy Error: ${e.message}`, { status: 500, headers: corsHeaders });
        }
    },
};