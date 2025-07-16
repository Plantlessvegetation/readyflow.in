// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp(); // Initializes with default credentials from the environment

// OpenAI API
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: functions.config().openai.api_key,
});

// Firebase Storage
const { getStorage } = require('firebase-admin/storage');
const bucket = getStorage().bucket();

// Node.js built-in module for making HTTP requests
const https = require('https');

// Define your Pipedream webhook URL
const PIPEDREAM_WEBHOOK_URL = 'https://eo7litc6m5hqwus.m.pipedream.net';

/**
 * Helper function to send data to Pipedream.
 * Runs in the background and doesn't block the main function's execution.
 */
async function sendToPipedream(requestId, dataToSend) {
    const postData = JSON.stringify({
        requestId: requestId,
        ...dataToSend // Send all relevant data to Pipedream
    });

    const url = new URL(PIPEDREAM_WEBHOOK_URL);
    const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`Pipedream successfully received data for request ${requestId}. Status: ${res.statusCode}`);
                    resolve();
                } else {
                    console.error(`Pipedream request failed for ${requestId}. Status: ${res.statusCode}, Body: ${responseBody}`);
                    reject(new Error(`Pipedream failed: ${res.statusCode} - ${responseBody}`));
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Pipedream connection error for ${requestId}: ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Cloud Function to trigger on new Firestore document creation for code generation requests.
 * It generates code via GPT-4o, stores it, updates Firestore, and sends a tracking prompt to Pipedream.
 */
exports.generateWebsiteCode = functions.firestore
    .document('codeGenerationRequests/{requestId}')
    .onCreate(async (snap, context) => {
        const requestData = snap.data();
        const requestId = context.params.requestId;

        console.log(`Processing new code generation request: ${requestId}`);

        if (requestData.status !== 'pending-code-generation') {
            console.log(`Request ${requestId} not in 'pending-code-generation' status. Exiting.`);
            return null;
        }

        const designChoices = requestData.designChoices;
        if (!designChoices || !designChoices.selectedPlan) {
            console.error(`Missing designChoices or selectedPlan for request ${requestId}.`);
            await snap.ref.update({
                status: 'failed',
                errorMessage: 'Missing design choices or selected plan.'
            });
            return null;
        }

        // --- CODE GENERATION PROMPT (for OpenAI) ---
        let openAIPrompt = `
You are an expert web developer with 20 plus years of experience, known for his master work in web development and AI assistant specializing in generating production-ready, agency-level website code (HTML, CSS, JavaScript) based on user specifications. Your goal is to generate clean, modern, responsive, and highly professional code.

--- USER REQUIREMENTS ---

BUSINESS_INFO:
- Business Name: ${requestData.customerInfo.businessName || 'Undefined Business'}
- Contact Number: ${requestData.customerInfo.contactNumber || 'N/A'}
- Contact Email: ${requestData.customerInfo.contactEmail || 'N/A'}

DESIGN_CHOICES:
- Selected Plan: ${designChoices.selectedPlan}
- Website Type: ${designChoices.websiteType} ${designChoices.customWebsiteTypeDescription ? `(${designChoices.customWebsiteTypeDescription})` : ''}
- Page Count: ${designChoices.websitePageCount} pages
- Color Scheme: ${designChoices.colorScheme.type} (${designChoices.colorScheme.value})${designChoices.customColorDescription ? ` (${designChoices.customColorDescription})` : ''}
- Button Shape: ${designChoices.buttonShape}${designChoices.customButtonShapeDescription ? ` (${designChoices.customButtonShapeDescription})` : ''}
- Button Effect: ${designChoices.buttonEffect}${designChoices.customButtonEffectDescription ? ` (${designChoices.customButtonEffectDescription})` : ''}
- Website Sections: ${designChoices.websiteSections.join(', ')}
${designChoices.customSectionDescription ? `- Custom Section/Animation Details: ${designChoices.customSectionDescription}` : ''}
- Image Display Style: ${designChoices.imageDisplay}${designChoices.customImageStyleDescription ? ` (${designChoices.customImageStyleDescription})` : ''}
- Font Pairing: ${designChoices.fontPairing}${designChoices.customFontDescription ? ` (${designChoices.customFontDescription})` : ''}
`;

        if (designChoices.selectedPlan === 'growth') {
            openAIPrompt += `
--- REQUIRED QUALITY LEVEL ---
- Output must meet professional agency standards (used for paid client websites).
- Must include a subtle, elegant **preloader animation** (fade-in, pulse, minimal spinner, or similar).
- Must include **modern UI/UX** features like glassmorphism containers, hover effects, smooth transitions, scroll animations, and if not provided, infer the best based on industry type and design choices.

--- KEY INSTRUCTIONS ---

1.  **Deliver Complete Code:**
    - Provide full HTML for \`index.html\`, a modern \`style.css\`, and functional \`script.js\`.
    - For multiple pages, generate them as \`page1.html\`, \`about.html\`, etc. or use single-page layout with internal navigation.
2.  **Modern, Responsive, Polished Design:**
    - Site must be pixel-perfect on mobile, tablet, and desktop.
    - Use flexbox/grid, mobile-first CSS, and elegant spacing.
    - Apply global font/color styles from user choices.
3.  **Functionality & Interactivity:**
    - Implement all user-selected effects or smartly assign effects based on design logic.
    - Add preloader to show before page load (only on first load).
    - Functional scroll transitions, hover animations, contact forms, and carousels.
    - Avoid third-party libraries (unless requested) — use vanilla JavaScript.
4.  **Glassmorphism & Hover Effects:**
    - If glassmorphism is requested or inferred, apply it to major containers (hero cards, CTA boxes, section blocks).
    - Include elegant hover effects for buttons, images, and cards.
    - Use backdrop-filter, rgba, blur, and smooth transitions.
5.  **Accessibility & SEO Readiness:**
    - Use semantic tags (nav, section, header, etc.).
    - Alt tags on all images (relevant, not lorem).
    - Ensure keyboard accessibility and good contrast.
6.  **Placeholder Content:**
    - Use realistic placeholder content based on the business type.
    - No generic “lorem ipsum”. Use industry-appropriate titles, CTAs, and service blurbs.
7.  **No Frameworks Unless Explicitly Requested:**
    - Only vanilla HTML, CSS, JS unless user asks for React, Vue, or other.
    - For animations: use keyframes, CSS transitions, JS scroll triggers.
8.  **Output Format:**
    - Wrap each file in proper markdown code blocks and label:
        \`\`\`html index.html \`\`\`
        \`\`\`css style.css \`\`\`
        \`\`\`javascript script.js \`\`\`
9.  **Performance & Clean Code:**
    - Avoid bloat, keep JS minimal but powerful.
    - Responsive images, optimized layout.
10. **Fallback Effect Logic:**
    - If user doesn’t select button effect, font, or image style:
      → Smartly infer best option using color scheme, website type, and section layout.
`;
        } else if (designChoices.selectedPlan === 'basic') {
            openAIPrompt += `
--- REQUIRED QUALITY LEVEL ---
- Output must be clean, responsive, and functional.
- Prioritize simplicity and fast loading. Avoid complex animations unless specifically requested and essential for a basic site.

--- KEY INSTRUCTIONS ---

1.  **Deliver Complete Code:**
    - Provide full HTML for \`index.html\`, a clean \`style.css\`, and functional \`script.js\`.
    - For a 1-page site, ensure all content is on \`index.html\`.
2.  **Modern & Responsive Design:**
    - Site must be responsive across devices.
    - Use clean, efficient CSS for layout and basic styling.
    - Apply global font/color styles from user choices.
3.  **Functionality:**
    - Implement basic interactive elements (e.g., simple contact form, basic image display).
    - Avoid complex animations or effects.
4.  **Accessibility & SEO Readiness:**
    - Use semantic tags.
    - Alt tags on all images (relevant).
    - Ensure basic readability and navigation.
5.  **Placeholder Content:**
    - Use relevant placeholder content based on the business type. No generic “lorem ipsum.”
6.  **No Frameworks/Libraries:**
    - Use only vanilla HTML, CSS, and JavaScript.
7.  **Output Format:**
    - Wrap each file in proper markdown code blocks and label:
        \`\`\`html index.html \`\`\`
        \`\`\`css style.css \`\`\`
        \`\`\`javascript script.js \`\`\`
8.  **Performance & Clean Code:**
    - Optimize for very fast loading. Keep code concise.
`;
        }

        openAIPrompt += `
--- CONTEXTUAL BEHAVIOR ---
- If Plan is 'basic' → prioritize clarity, fast loading, fewer animations
- If Plan is 'growth' → more creative transitions, hover cards, glassmorphism
- If Plan is 'e-commerce-store' (regardless of main plan, this is a specific type) → product grid, pricing emphasis, clean CTA, mini cart simulation (non-functional)

--- FINAL NOTE ---
Always aim to impress. These websites are used to build real businesses. Keep aesthetics, speed, clarity, and interactivity in perfect balance.

--- GENERATE CODE BELOW ---
`;

        // --- Call GPT-4o API for Code Generation ---
        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { "role": "system", "content": "You are an expert web developer and AI assistant specializing in generating production-ready website code. Generate only the code blocks as requested in the user prompt, without extra conversational text before or after the code." },
                    { "role": "user", "content": openAIPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
            });
        } catch (apiError) {
            console.error(`OpenAI API call failed for request ${requestId}:`, apiError);
            await snap.ref.update({
                status: 'failed',
                errorMessage: `OpenAI API error: ${apiError.message || 'Unknown Storage Error.'}`
            });
            return null;
        }

        const rawContent = completion.choices[0].message.content;
        console.log(`Raw GPT-4o response for ${requestId}:`, rawContent);

        // --- Parse Generated Code ---
        const htmlMatch = rawContent.match(/```html\s+([\s\S]*?)\s+```/);
        const cssMatch = rawContent.match(/```css\s+([\s\S]*?)\s+```/);
        const jsMatch = rawContent.match(/```javascript\s+([\s\S]*?)\s+```/);

        let htmlCode = htmlMatch ? htmlMatch[1].trim() : '';
        let cssCode = cssMatch ? cssMatch[1].trim() : '';
        let jsCode = jsMatch ? jsMatch[1].trim() : '';

        if (!htmlCode || !cssCode || !jsCode) {
            console.error(`Failed to parse all code blocks for request ${requestId}.`);
            await snap.ref.update({
                status: 'failed',
                errorMessage: 'Failed to parse generated HTML, CSS, or JS code from AI response.'
            });
            return null;
        }

        // --- Store Generated Code in Firebase Storage ---
        let htmlUrl = '';
        let cssUrl = '';
        let jsUrl = '';

        try {
            const htmlFileName = `generated-websites/${requestId}/index.html`;
            const htmlFile = bucket.file(htmlFileName);
            await htmlFile.save(htmlCode, {
                contentType: 'text/html',
                resumable: false,
            });
            await htmlFile.makePublic();
            htmlUrl = htmlFile.publicUrl();
            console.log(`HTML uploaded to: ${htmlUrl}`);

            const cssFileName = `generated-websites/${requestId}/style.css`;
            const cssFile = bucket.file(cssFileName);
            await cssFile.save(cssCode, {
                contentType: 'text/css',
                resumable: false
            });
            await cssFile.makePublic();
            cssUrl = cssFile.publicUrl();
            console.log(`CSS uploaded to: ${cssUrl}`);

            const jsFileName = `generated-websites/${requestId}/script.js`;
            const jsFile = bucket.file(jsFileName);
            await jsFile.save(jsCode, {
                contentType: 'application/javascript',
                resumable: false
            });
            await jsFile.makePublic();
            jsUrl = jsFile.publicUrl();
            console.log(`JS uploaded to: ${jsUrl}`);

        } catch (storageError) {
            console.error(`Error uploading code to Firebase Storage for request ${requestId}:`, storageError);
            await snap.ref.update({
                status: 'failed',
                errorMessage: `Storage upload error: ${storageError.message || 'Unknown Storage Error.'}`
            });
            return null;
        }

        // --- Update Firestore Document with Status and URLs ---
        try {
            await snap.ref.update({
                status: 'code-generated',
                generatedHtmlUrl: htmlUrl,
                generatedCssUrl: cssUrl,
                generatedJsUrl: jsUrl,
                generationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                redoAttempts: requestData.redoAttempts !== undefined ? requestData.redoAttempts : 2
            });
            console.log(`Firestore document ${requestId} updated with generated code URLs.`);
        } catch (firestoreError) {
            console.error(`Error updating Firestore document for request ${requestId}:`, firestoreError);
            return null;
        }

        // --- NEW: Tracking Prompt for Pipedream (STATIC PROMPT TEXT TEMPLATE LITERALS) ---
        let pipedreamTrackingPrompt = '';

        if (designChoices.selectedPlan === 'basic') {
            pipedreamTrackingPrompt = `
Create a prompt that will instruct an AI developer to generate a complete, mobile-responsive, modern one-page website using only HTML, CSS, and JavaScript.

The prompt should:
- Ask for three files: index.html, style.css, and script.js
- Instruct the AI to avoid any animations, loaders, or transitions
- Focus on clean layout, responsiveness across devices, and semantic structure
- Use user-provided inputs like business name: "${requestData.customerInfo.businessName || 'Undefined'}", contact info: "${requestData.customerInfo.contactNumber || 'N/A'}", "${requestData.customerInfo.contactEmail || 'N/A'}", website type: "${designChoices.websiteType}"${designChoices.customWebsiteTypeDescription ? ` (${designChoices.customWebsiteTypeDescription})` : ''}, color scheme: "${designChoices.colorScheme.type}" ("${designChoices.colorScheme.value}")${designChoices.customColorDescription ? ` (${designChoices.customColorDescription})` : ''}, selected sections: "${designChoices.websiteSections.join(', ')}", font pairing: "${designChoices.fontPairing}"${designChoices.customFontDescription ? ` (${designChoices.customFontDescription})` : ''}, and button style: "${designChoices.buttonShape}" with "${designChoices.buttonEffect}" effect${designChoices.customButtonShapeDescription ? ` (${designChoices.customButtonShapeDescription})` : ''}${designChoices.customButtonEffectDescription ? ` (${designChoices.customButtonEffectDescription})` : ''}.
- Generate placeholder content that feels relevant to the business type — avoid lorem ipsum
- Ensure accessibility and modern styling with a nice UI but no heavy effects
- Avoid any external frameworks or libraries (pure vanilla code)

The prompt should be output in a clear, complete format, ready to be used for code generation.
`;
        } else if (designChoices.selectedPlan === 'growth') {
            // --- MODIFIED PROMPT FOR GROWTH PLAN TO INCLUDE CUSTOMER DATA ---
            pipedreamTrackingPrompt = `
Create a prompt that will instruct an AI developer to generate a premium, production-ready website using HTML, CSS, and JavaScript.
It must say to AI and must include this line that = "consider that you are a web developer and designer for past 20 years, a veteran and understands the Indian market very well, i want you to generate a website which matches the level of agencies"
The prompt should:
- Ask for three files: index.html, style.css, and script.js
- Instruct the AI to create a modern, agency-level, multi-section website (single-page or multipage structure based on input)
- Ensure full mobile responsiveness using grid/flex layouts and proper spacing
- Include advanced styling features like:
  - Preloader (minimal and elegant)
  - Smooth scroll animations (fade-ins, slide-ins)
  - Hover effects on buttons, cards, and links
  - Glassmorphism-style containers where appropriate
  - Responsive hero section with bold CTA
- Use placeholder content that fits the user's business type (avoid lorem ipsum)
- Apply a consistent, professional color scheme and font pairing based on user input
- Include semantic HTML5 structure, accessibility considerations, and clean code
- Avoid using any external libraries or frameworks unless explicitly mentioned
- Include the following customer and design details in the generated website and these details should also be present in the generated prompt:
    - Business Name: "${requestData.customerInfo.businessName || 'Undefined Business'}"
    - Contact Number: "${requestData.customerInfo.contactNumber || 'N/A'}"
    - Contact Email: "${requestData.customerInfo.contactEmail || 'N/A'}"
    - Website Type: "${designChoices.websiteType}" ${designChoices.customWebsiteTypeDescription ? `(${designChoices.customWebsiteTypeDescription})` : ''}
    - Preferred Color Scheme: "${designChoices.colorScheme.type}" ("${designChoices.colorScheme.value}")${designChoices.customColorDescription ? ` (${designChoices.customColorDescription})` : ''}
    - Font Pairing Style: "${designChoices.fontPairing}"${designChoices.customFontDescription ? ` (${designChoices.customFontDescription})` : ''}
    - Button Style Preference: "${designChoices.buttonShape}" with "${designChoices.buttonEffect}" effect${designChoices.customButtonShapeDescription ? ` (${designChoices.customButtonShapeDescription})` : ''}${designChoices.customButtonEffectDescription ? ` (${designChoices.customButtonEffectDescription})` : ''}
    ${designChoices.customSectionDescription ? `- Custom Section/Animation Details: ${designChoices.customSectionDescription}` : ''}

The generated prompt should be clear, structured, and optimized to help an AI developer produce visually stunning, functional frontend code. Output the prompt in a format ready to be used directly for code generation.
`;
        } else {
            // Fallback for unknown plan, interpolating key details for traceability
            pipedreamTrackingPrompt = `Request Summary: User selected an unknown plan (${designChoices.selectedPlan || 'N/A'}). Request ID: ${requestId}.
Business Name: ${requestData.customerInfo.businessName || 'Undefined Business'}
Contact Email: ${requestData.customerInfo.contactEmail || 'N/A'}
Website Type: ${designChoices.websiteType || 'N/A'}
`;
        }

        sendToPipedream(requestId, {
            customerInfo: requestData.customerInfo,
            designChoices: requestData.designChoices,
            estimatedPrice: requestData.estimatedPrice,
            generatedHtmlUrl: htmlUrl,
            generatedCssUrl: cssUrl,
            generatedJsUrl: jsUrl,
            creativeText: pipedreamTrackingPrompt, // Send the NEW tracking prompt here (interpolated text)
            status: 'code-generated-and-sent-to-pipedream',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        }).catch(e => console.error(`Failed to send data to Pipedream for ${requestId}:`, e));

        return null;
    }, { timeoutSeconds: 420 });

/**
 * Cloud Function to handle re-generation requests.
 * Triggers when `status` changes to 'pending-code-generation-redo' and re-runs generation logic.
 */
exports.regenerateWebsiteCode = functions.firestore
    .document('codeGenerationRequests/{requestId}')
    .onUpdate(async (change, context) => {
        const newRequestData = change.after.data();
        const oldRequestData = change.before.data();
        const requestId = context.params.requestId;

        if (newRequestData.status === 'pending-code-generation-redo' && oldRequestData.status !== 'pending-code-generation-redo') {
            console.log(`Processing re-generation request: ${requestId}`);

            if (newRequestData.redoAttempts === undefined || newRequestData.redoAttempts < 0) {
                console.warn(`Re-generation requested for ${requestId}, but redoAttempts is invalid or exhausted. Current: ${newRequestData.redoAttempts}`);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: 'No redo attempts left or invalid attempt count.'
                });
                return null;
            }

            // --- CODE GENERATION PROMPT (for OpenAI) ---
            const designChoices = newRequestData.designChoices;
            let openAIPrompt = `
You are an expert web developer with 20 plus years of experience, known for his master work in web development and AI assistant specializing in generating production-ready, agency-level website code (HTML, CSS, JavaScript) based on user specifications. Your goal is to generate clean, modern, responsive, and highly professional code.

--- USER REQUIREMENTS ---

BUSINESS_INFO:
- Business Name: ${newRequestData.customerInfo.businessName || 'Undefined Business'}
- Contact Number: ${newRequestData.customerInfo.contactNumber || 'N/A'}
- Contact Email: ${newRequestData.customerInfo.contactEmail || 'N/A'}

DESIGN_CHOICES:
- Selected Plan: ${designChoices.selectedPlan}
- Website Type: ${designChoices.websiteType} ${designChoices.customWebsiteTypeDescription ? `(${designChoices.customWebsiteTypeDescription})` : ''}
- Page Count: ${designChoices.websitePageCount} pages
- Color Scheme: ${designChoices.colorScheme.type} (${designChoices.colorScheme.value})${designChoices.customColorDescription ? ` (${designChoices.customColorDescription})` : ''}
- Button Shape: ${designChoices.buttonShape}${designChoices.customButtonShapeDescription ? ` (${designChoices.customButtonShapeDescription})` : ''}
- Button Effect: ${designChoices.buttonEffect}${designChoices.customButtonEffectDescription ? ` (${designChoices.customButtonEffectDescription})` : ''}
- Website Sections: ${designChoices.websiteSections.join(', ')}
${designChoices.customSectionDescription ? `- Custom Section/Animation Details: ${designChoices.customSectionDescription}` : ''}
- Image Display Style: ${designChoices.imageDisplay}${designChoices.customImageStyleDescription ? ` (${designChoices.customImageStyleDescription})` : ''}
- Font Pairing: ${designChoices.fontPairing}${designChoices.customFontDescription ? ` (${designChoices.customFontDescription})` : ''}
`;

            if (designChoices.selectedPlan === 'growth') {
                openAIPrompt += `
--- REQUIRED QUALITY LEVEL ---
- Output must meet professional agency standards (used for paid client websites).
- Must include a subtle, elegant **preloader animation** (fade-in, pulse, minimal spinner, or similar).
- Must include **modern UI/UX** features like glassmorphism containers, hover effects, smooth transitions, scroll animations, and if not provided, infer the best based on industry type and design choices.

--- KEY INSTRUCTIONS ---

1.  **Deliver Complete Code:**
    - Provide full HTML for \`index.html\`, a modern \`style.css\`, and functional \`script.js\`.
    - For multiple pages, generate them as \`page1.html\`, \`about.html\`, etc. or use single-page layout with internal navigation.
2.  **Modern, Responsive, Polished Design:**
    - Site must be pixel-perfect on mobile, tablet, and desktop.
    - Use flexbox/grid, mobile-first CSS, and elegant spacing.
    - Apply global font/color styles from user choices.
3.  **Functionality & Interactivity:**
    - Implement all user-selected effects or smartly assign effects based on design logic.
    - Add preloader to show before page load (only on first load).
    - Functional scroll transitions, hover animations, contact forms, and carousels.
    - Avoid third-party libraries (unless requested) — use vanilla JavaScript.
4.  **Glassmorphism & Hover Effects:**
    - If glassmorphism is requested or inferred, apply it to major containers (hero cards, CTA boxes, section blocks).
    - Include elegant hover effects for buttons, images, and cards.
    - Use backdrop-filter, rgba, blur, and smooth transitions.
5.  **Accessibility & SEO Readiness:**
    - Use semantic tags.
    - Alt tags on all images (relevant).
    - Ensure keyboard accessibility and good contrast.
6.  **Placeholder Content:**
    - Use realistic placeholder content based on the business type.
    - No generic “lorem ipsum”. Use industry-appropriate titles, CTAs, and service blurbs.
7.  **No Frameworks Unless Explicitly Requested:**
    - Only vanilla HTML, CSS, JS unless user asks for React, Vue, or other.
    - For animations: use keyframes, CSS transitions, JS scroll triggers.
8.  **Output Format:**
    - Wrap each file in proper markdown code blocks and label:
        \`\`\`html index.html \`\`\`
        \`\`\`css style.css \`\`\`
        \`\`\`javascript script.js \`\`\`
9.  **Performance & Clean Code:**
    - Avoid bloat, keep JS minimal but powerful.
    - Responsive images, optimized layout.
10. **Fallback Effect Logic:**
    - If user doesn’t select button effect, font, or image style:
      → Smartly infer best option using color scheme, website type, and section layout.
`;
            } else if (designChoices.selectedPlan === 'basic') {
                openAIPrompt += `
--- REQUIRED QUALITY LEVEL ---
- Output must be clean, responsive, and functional.
- Prioritize simplicity and fast loading. Avoid complex animations unless specifically requested and essential for a basic site.

--- KEY INSTRUCTIONS ---

1.  **Deliver Complete Code:**
    - Provide full HTML for \`index.html\`, a clean \`style.css\`, and functional \`script.js\`.
    - For a 1-page site, ensure all content is on \`index.html\`.
2.  **Modern & Responsive Design:**
    - Site must be responsive across devices.
    - Use clean, efficient CSS for layout and basic styling.
    - Apply global font/color styles from user choices.
3.  **Functionality:**
    - Implement basic interactive elements (e.g., simple contact form, basic image display).
    - Avoid complex animations or effects.
4.  **Accessibility & SEO Readiness:**
    - Use semantic tags.
    - Alt tags on all images (relevant).
    - Ensure basic readability and navigation.
5.  **Placeholder Content:**
    - Use relevant placeholder content based on the business type. No generic “lorem ipsum.”
6.  **No Frameworks/Libraries:**
    - Use only vanilla HTML, CSS, and JavaScript.
7.  **Output Format:**
    - Wrap each file in proper markdown code blocks and label:
        \`\`\`html index.html \`\`\`
        \`\`\`css style.css \`\`\`
        \`\`\`javascript script.js \`\`\`
8.  **Performance & Clean Code:**
    - Optimize for very fast loading. Keep code concise.
`;
            }

            openAIPrompt += `
--- CONTEXTUAL BEHAVIOR ---
- If Plan is 'basic' → prioritize clarity, fast loading, fewer animations
- If Plan is 'growth' → more creative transitions, hover cards, glassmorphism
- If Plan is 'e-commerce-store' (regardless of main plan, this is a specific type) → product grid, pricing emphasis, clean CTA, mini cart simulation (non-functional)

--- FINAL NOTE ---
Always aim to impress. These websites are used to build real businesses. Keep aesthetics, speed, clarity, and interactivity in perfect balance.

--- GENERATE CODE BELOW ---
`;

            // Call GPT-4o API (same logic as in onCreate trigger)
            let completion;
            try {
                completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { "role": "system", "content": "You are an expert web developer and AI assistant specializing in generating production-ready website code. Generate only the code blocks as requested in the user prompt, without extra conversational text before or after the code." },
                        { "role": "user", "content": openAIPrompt } // Use openAIPrompt here
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                });
            } catch (apiError) {
                console.error(`OpenAI API call failed for re-generation request ${requestId}:`, apiError);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: `OpenAI API error during re-generation: ${apiError.message || 'Unknown Storage Error.'}`
                });
                return null;
            }

            const rawContent = completion.choices[0].message.content;
            console.log(`Raw GPT-4o re-generation response for ${requestId}:`, rawContent);

            // --- Parse Generated Code ---
            const htmlMatch = rawContent.match(/```html\s+([\s\S]*?)\s+```/);
            const cssMatch = rawContent.match(/```css\s+([\s\S]*?)\s+```/);
            const jsMatch = rawContent.match(/```javascript\s+([\s\S]*?)\s+```/);

            let htmlCode = htmlMatch ? htmlMatch[1].trim() : '';
            let cssCode = cssMatch ? cssMatch[1].trim() : '';
            let jsCode = jsMatch ? jsMatch[1].trim() : '';

            if (!htmlCode || !cssCode || !jsCode) {
                console.error(`Failed to parse all code blocks for re-generation request ${requestId}.`);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: 'Failed to parse generated HTML, CSS, or JS code from AI re-generation response.'
                });
                return null;
            }

            // --- Store Generated Code in Firebase Storage ---
            let htmlUrl = '';
            let cssUrl = '';
            jsUrl = '';

            try {
                const htmlFileName = `generated-websites/${requestId}/index.html`;
                const htmlFile = bucket.file(htmlFileName);
                await htmlFile.save(htmlCode, { contentType: 'text/html', resumable: false });
                await htmlFile.makePublic();
                htmlUrl = htmlFile.publicUrl();
                console.log(`HTML uploaded to: ${htmlUrl}`);

                const cssFileName = `generated-websites/${requestId}/style.css`;
                const cssFile = bucket.file(cssFileName);
                await cssFile.save(cssCode, { contentType: 'text/css', resumable: false });
                await cssFile.makePublic();
                cssUrl = cssFile.publicUrl();
                console.log(`CSS uploaded to: ${cssUrl}`);

                const jsFileName = `generated-websites/${requestId}/script.js`;
                const jsFile = bucket.file(jsFileName);
                await jsFile.save(jsCode, { contentType: 'application/javascript', resumable: false });
                await jsFile.makePublic();
                jsUrl = jsFile.publicUrl();
                console.log(`JS uploaded to: ${jsUrl}`);

            } catch (storageError) {
                console.error(`Error uploading re-generated code to Firebase Storage for request ${requestId}:`, storageError);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: `Storage upload error: ${storageError.message || 'Unknown Storage Error.'}`
                });
                return null;
            }

            // --- Update Firestore Document with Status and URLs ---
            try {
                await change.after.ref.update({
                    status: 'code-generated',
                    generatedHtmlUrl: htmlUrl,
                    generatedCssUrl: cssUrl,
                    generatedJsUrl: jsUrl,
                    generationTimestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Firestore document ${requestId} updated with re-generated code URLs.`);
            } catch (firestoreError) {
                console.error(`Error updating Firestore document after re-generation for request ${requestId}:`, firestoreError);
                return null;
            }

            // --- NEW: Tracking Prompt for Pipedream (STATIC PROMPT TEXT TEMPLATE LITERALS) ---
            let pipedreamTrackingPrompt = '';
            if (designChoices.selectedPlan === 'basic') {
                pipedreamTrackingPrompt = `
Create a prompt that will instruct an AI developer to generate a complete, mobile-responsive, modern one-page website using only HTML, CSS, and JavaScript.

The prompt should:
- Ask for three files: index.html, style.css, and script.js
- Instruct the AI to avoid any animations, loaders, or transitions
- Focus on clean layout, responsiveness across devices, and semantic structure
- Use user-provided inputs like business name: "${newRequestData.customerInfo.businessName || 'Undefined'}", contact info: "${newRequestData.customerInfo.contactNumber || 'N/A'}", "${newRequestData.customerInfo.contactEmail || 'N/A'}", website type: "${designChoices.websiteType}"${designChoices.customWebsiteTypeDescription ? ` (${designChoices.customWebsiteTypeDescription})` : ''}, color scheme: "${designChoices.colorScheme.type}" ("${designChoices.colorScheme.value}")${designChoices.customColorDescription ? ` (${designChoices.customColorDescription})` : ''}, selected sections: "${designChoices.websiteSections.join(', ')}", font pairing: "${designChoices.fontPairing}"${designChoices.customFontDescription ? ` (${designChoices.customFontDescription})` : ''}, and button style: "${designChoices.buttonShape}" with "${designChoices.buttonEffect}" effect${designChoices.customButtonShapeDescription ? ` (${designChoices.customButtonShapeDescription})` : ''}${designChoices.customButtonEffectDescription ? ` (${designChoices.customButtonEffectDescription})` : ''}.
- Generate placeholder content that feels relevant to the business type — avoid lorem ipsum
- Ensure accessibility and modern styling with a nice UI but no heavy effects
- Avoid any external frameworks or libraries (pure vanilla code)

The prompt should be output in a clear, complete format, ready to be used for code generation.
`;
            } else if (designChoices.selectedPlan === 'growth') {
                // --- MODIFIED PROMPT FOR GROWTH PLAN TO INCLUDE CUSTOMER DATA ---
                pipedreamTrackingPrompt = `
Create a prompt that will instruct an AI developer to generate a premium, production-ready website using HTML, CSS, and JavaScript.
It must say to AI and must include this line that = "consider that you are a web developer and designer for past 20 years, a veteran and understands the Indian market very well, i want you to generate a website which matches the level of agencies"
The prompt should:
- Ask for three files: index.html, style.css, and script.js
- In prompt all the customer details should be included which are sent 
- Instruct the AI to create a modern, agency-level, multi-section website (single-page or multipage structure based on input)
- Ensure full mobile responsiveness using grid/flex layouts and proper spacing
- Include advanced styling features like:
  - Preloader (minimal and elegant)
  - Smooth scroll animations (fade-ins, slide-ins)
  - Hover effects on buttons, cards, and links
  - Glassmorphism-style containers where appropriate
  - Responsive hero section with bold CTA
- Use placeholder content that fits the user's business type (avoid lorem ipsum)
- Apply a consistent, professional color scheme and font pairing based on user input
- Include semantic HTML5 structure, accessibility considerations, and clean code
- Avoid using any external libraries or frameworks unless explicitly mentioned
- Include the following customer and design details in the generated website:
    - Business Name: "${newRequestData.customerInfo.businessName || 'Undefined Business'}"
    - Contact Number: "${newRequestData.customerInfo.contactNumber || 'N/A'}"
    - Contact Email: "${newRequestData.customerInfo.contactEmail || 'N/A'}"
    - Website Type: "${designChoices.websiteType}" ${designChoices.customWebsiteTypeDescription ? `(${designChoices.customWebsiteTypeDescription})` : ''}
    - Preferred Color Scheme: "${designChoices.colorScheme.type}" ("${designChoices.colorScheme.value}")${designChoices.customColorDescription ? ` (${designChoices.customColorDescription})` : ''}
    - Font Pairing Style: "${designChoices.fontPairing}"${designChoices.customFontDescription ? ` (${designChoices.customFontDescription})` : ''}
    - Button Style Preference: "${designChoices.buttonShape}" with "${designChoices.buttonEffect}" effect${designChoices.customButtonShapeDescription ? ` (${designChoices.customButtonShapeDescription})` : ''}${designChoices.customButtonEffectDescription ? ` (${designChoices.customButtonEffectDescription})` : ''}
    ${designChoices.customSectionDescription ? `- Custom Section/Animation Details: ${designChoices.customSectionDescription}` : ''}

The generated prompt should be clear, structured, and optimized to help an AI developer produce visually stunning, functional frontend code. Output the prompt in a format ready to be used directly for code generation.
`;
            } else {
                // Fallback for unknown plan, interpolating key details for traceability
                pipedreamTrackingPrompt = `Request Summary: User selected an unknown plan (${newRequestData.designChoices.selectedPlan || 'N/A'}). Request ID: ${requestId}.
Business Name: ${newRequestData.customerInfo.businessName || 'Undefined Business'}
Contact Email: ${newRequestData.customerInfo.contactEmail || 'N/A'}
Website Type: ${newRequestData.designChoices.websiteType || 'N/A'}
`;
            }

            sendToPipedream(requestId, {
                customerInfo: newRequestData.customerInfo,
                designChoices: newRequestData.designChoices,
                estimatedPrice: newRequestData.estimatedPrice,
                generatedHtmlUrl: htmlUrl,
                generatedCssUrl: cssUrl,
                generatedJsUrl: jsUrl,
                creativeText: pipedreamTrackingPrompt, // Send the NEW tracking prompt here (interpolated text)
                status: 'code-generated-and-sent-to-pipedream',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }).catch(e => console.error(`Failed to send data to Pipedream for re-gen ${requestId}:`, e));

        }
        return null;
    }, { timeoutSeconds: 420 });