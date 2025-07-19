// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp(); // Initializes with default credentials from the environment
const db = admin.firestore(); // Firestore instance

// OpenAI API (still here, but its direct triggers are disabled for now)
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: functions.config().openai.api_key,
});

// Firebase Storage (still here, if needed for other purposes later)
const { getStorage } = require('firebase-admin/storage');
const bucket = getStorage().bucket();

// Node.js built-in module for making HTTP requests
const https = require('https');

// Define your Pipedream webhook URL
const PIPEDREAM_WEBHOOK_URL = 'https://eo7litc6m5hqwus.m.pipedream.net'; // Ensure this is your correct Pipedream URL

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

// --- EXACT PROMPT TEMPLATES (as provided by you) ---

const PROMPT_TEMPLATE_499_PLAN = `You are a prompt engineer tasked with creating a website-generation prompt for a minimal, modern 1-page static website, your job is to create a prompt which will be copy pasted to other AI agent for code generation, and the prompt must include all user details. make sure the generated website using this prompt should look professional.

Use the following user details to personalize the output prompt:

- Name: {{USER_NAME}}
- Business Name: {{BUSINESS_NAME}}
- Business Type: {{BUSINESS_TYPE}}
- Phone Number: {{PHONE_NUMBER}}
- Email Address: {{EMAIL_ADDRESS}}
- Brand Colors (if any): {{BRAND_COLORS}}
- Address or City: {{CITY_LOCATION}}
- Services Offered: {{SERVICES_LIST}}

Now create a prompt that asks an AI (like GPT-4 or Gemini) to generate:
- A single-page responsive static website (HTML/CSS/JS only)
- Sections: {{SECTIONS_LIST}}
- Clean and fast UI (no animations or effects)
- Mention to use Fonts selected by user
- Include contact info and business branding
- Output code that’s SEO-friendly and easy to host
- Should include all the details filled by user in the end of prompt in double coma's
The generated prompt must be clear, concise, and require no design skills to execute. End the prompt with “Generate a full HTML/CSS/JS code for this.”`;


const PROMPT_TEMPLATE_1299_PLAN = `You are a prompt engineer creating a rich website-generation prompt based on these user details: your job is to create a prompt which will be copy pasted to other AI agent for code generation, and the prompt must include all user details. make sure the generated website using this prompt should look professional.

- Name: {{USER_NAME}}
- Business Name: {{BUSINESS_NAME}}
- Business Type: {{BUSINESS_TYPE}}
- Phone Number: {{PHONE_NUMBER}}
- Email Address: {{EMAIL_ADDRESS}}
- Address or City: {{CITY_LOCATION}}
- Brand Colors or Preferences: {{BRAND_COLORS}}
- Font Preferences (if any): {{FONT_PREFERENCES}}
- Services/Products Offered: {{SERVICES_LIST}}
- Target Audience: {{TARGET_AUDIENCE}}

Write a detailed prompt that will instruct GPT-4 or Gemini to generate:
- Preloader with user's business name text
- A single-page, modern, visually impressive website (HTML/CSS/JS only)
- Smooth animations (on scroll, hover, etc.)
- sections - {{SECTIONS_LIST}}
- Mobile responsive layout
- Use of premium-looking fonts and UI polish
- Embedded HTML contact form
- Subtle effects, transitions, and refined spacing
- Clean and SEO-ready structure (title, meta tags, etc.)
- Personalized with user branding and business info
- Should include all the details filled by user in the end of prompt in double coma's
- Prompt should must include the text Pretend to be an expert In web development and with an experience of more than 20 years, craft this professionally and at the level of agencies.
End the prompt with: “Now generate complete HTML, CSS, and JS code for the site above.”

Ensure the AI understands that this is for a modern, creative Indian business or freelancer, and it must be impressive and polished.`;


/**
 * Helper function to format font names for prompts.
 */
function formatFontName(fontPairing, customFontDescription) {
    if (fontPairing === 'custom-font') {
        return `Custom: ${customFontDescription || 'User-defined fonts'}`;
    }
    // Capitalize each word and replace hyphens for readability
    return fontPairing.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Helper function to format color scheme/theme for prompts.
 * This function is updated to handle the new "theme" selection structure.
 */
function formatColorScheme(colorScheme, customColorDescription) {
    const themeType = colorScheme.type; // Now refers to data-theme-type
    const themeValue = colorScheme.value; // Now refers to data-theme-value

    if (themeType === 'our-choice') {
        return `Readyflow's recommended theme.`;
    } else if (themeType === 'custom') {
        return `Custom Theme: ${customColorDescription || 'User-defined preference'}`;
    } else if (themeType === 'predefined') {
        // Handle "dark" and "light" predefined themes
        return `Predefined Theme: ${themeValue.charAt(0).toUpperCase() + themeValue.slice(1)} Theme`;
    }
    // Fallback for any old color schemes or unexpected values
    return `Unknown/Default Theme (${themeValue || 'Not specified'})`;
}


/**
 * Helper function to format section names for prompts.
 */
function formatSectionNames(sectionsArray, customSectionDescription) {
    if (!sectionsArray || sectionsArray.length === 0) {
        return 'No specific sections selected.';
    }
    return sectionsArray.map(s => {
        switch(s) {
            case 'hero': return 'Hero / Main Banner';
            case 'about': return 'About Us';
            case 'services': return 'Services / Offerings';
            case 'products': return 'Products Display';
            case 'portfolio': return 'Portfolio / Gallery';
            case 'testimonials': return 'Testimonials / Reviews';
            case 'faq': return 'FAQ Section';
            case 'contact': return 'Contact Form / Info';
            case 'blog': return 'Blog / News Feed';
            case 'cta': return 'Call to Action (CTA)';
            case 'team': return 'Team / Staff Showcase';
            case 'custom-section': return `Custom Section: ${customSectionDescription || 'User-defined'}`;
            // Advanced effects (for 1299 plan)
            case 'effect-hero-flyin': return 'Hero Fly-In / Morph Animation';
            case 'effect-parallax-scroll': return 'Parallax Scroll Effect';
            case 'effect-glassmorphism': return 'Glassmorphism UI Elements';
            case 'effect-magnetic-hover': return 'Magnetic Hover Effect';
            case 'effect-scroll-timeline': return 'Scroll-Driven Timeline Effect';
            case 'effect-live-counters': return 'Animated Counters / Data on Scroll';
            case 'effect-custom-animation': return `Custom Advanced Animation: ${customSectionDescription || 'User-defined'}`;
            default: return s; // Fallback for any unmapped or raw sections
        }
    }).join(', ');
}


/**
 * Main function to generate the AI prompt by templating the raw text.
 */
function generateTemplatedAIPrompt(designChoices, customerInfo) {
    const selectedPlan = designChoices.selectedPlan;
    let selectedTemplate = '';

    if (selectedPlan === 'basic') {
        selectedTemplate = PROMPT_TEMPLATE_499_PLAN;
    } else if (selectedPlan === 'growth') {
        selectedTemplate = PROMPT_TEMPLATE_1299_PLAN;
    } else {
        console.warn(`Unknown plan selected: ${selectedPlan}. Using default 499 plan template.`);
        selectedTemplate = PROMPT_TEMPLATE_499_PLAN;
    }

    // --- Replace placeholders in the selected template ---
    let populatedPrompt = selectedTemplate;

    // Customer Info Replacements
    populatedPrompt = populatedPrompt.replace('{{USER_NAME}}', customerInfo.userName || 'Not provided');
    populatedPrompt = populatedPrompt.replace('{{BUSINESS_NAME}}', customerInfo.businessName || 'Not provided');
    populatedPrompt = populatedPrompt.replace('{{BUSINESS_TYPE}}', customerInfo.businessType || 'Not provided');
    populatedPrompt = populatedPrompt.replace('{{PHONE_NUMBER}}', customerInfo.contactNumber || 'Not provided');
    populatedPrompt = populatedPrompt.replace('{{EMAIL_ADDRESS}}', customerInfo.contactEmail || 'Not provided');
    populatedPrompt = populatedPrompt.replace('{{CITY_LOCATION}}', customerInfo.cityLocation || 'Not provided');
    populatedPrompt = populatedPrompt.replace('{{SERVICES_LIST}}', customerInfo.servicesOffered || 'Not provided');
    populatedPrompt = populatedPrompt.replace('{{TARGET_AUDIENCE}}', customerInfo.targetAudience || 'Not provided'); // Only for 1299 plan, will remain {{TARGET_AUDIENCE}} in 499 if not replaced.

    // Design Choices Replacements
    // Sections list is common to both templates
    populatedPrompt = populatedPrompt.replace('{{SECTIONS_LIST}}', formatSectionNames(designChoices.websiteSections, designChoices.customSectionDescription));
    
    // Updated to use the new theme structure
    populatedPrompt = populatedPrompt.replace('{{BRAND_COLORS}}', formatColorScheme(designChoices.colorScheme, designChoices.customColorDescription));
    
    populatedPrompt = populatedPrompt.replace('{{FONT_PREFERENCES}}', formatFontName(designChoices.fontPairing, designChoices.customFontDescription)); // Only for 1299 plan, will remain {{FONT_PREFERENCES}} in 499 if not replaced.

    return populatedPrompt;
}


/**
 * Firebase Cloud Function to send request data to Pipedream immediately on document creation.
 * This function will be deployed to a specific region for South East Asia.
 */
exports.sendRequestToPipedreamOnCreate = functions
    .region('asia-southeast1') // Specify the region for deployment
    .firestore
    .document('codeGenerationRequests/{requestId}')
    .onCreate(async (snapshot, context) => {
        const newRequestData = snapshot.data();
        const requestId = context.params.requestId;

        console.log(`New request created: ${requestId}. Generating templated prompt and sending to Pipedream from asia-southeast1.`);

        // Generate the detailed creativeText/AI prompt using the templating logic
        const creativeText = generateTemplatedAIPrompt(newRequestData.designChoices, newRequestData.customerInfo);

        // Prepare data for Pipedream
        const dataToSend = {
            customerInfo: newRequestData.customerInfo, // Sending raw data too, as it might be useful for Pipedream
            designChoices: newRequestData.designChoices, // Sending raw data too
            estimatedPrice: newRequestData.estimatedPrice,
            status: 'templated_prompt_sent_to_pipedream', // Updated status
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            creativeText: creativeText, // creativeText now contains the fully constructed prompt string
        };

        try {
            await sendToPipedream(requestId, dataToSend);
            console.log(`Templated prompt for request ${requestId} successfully sent to Pipedream.`);
            // Optionally update Firestore document status after sending to Pipedream
            await snapshot.ref.update({
                status: 'pipedream_code_generation_triggered_with_templated_prompt', // Updated status
                pipedreamSentTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error(`Failed to send data to Pipedream for request ${requestId}:`, error);
            // Update Firestore document status to indicate failure
            await snapshot.ref.update({
                status: 'pipedream_send_failed',
                errorMessage: `Pipedream send failed: ${error.message}`
            });
        }

        return null;
    });

/**
 * DISABLED: Firebase Cloud Function to create a Razorpay order.
 * This function is commented out as Razorpay integration is temporarily removed.
 */
/*
const Razorpay = require('razorpay'); // Re-introduce Razorpay import if needed
const razorpay = new Razorpay({
    key_id: functions.config().razorpay.key_id,
    key_secret: functions.config().razorpay.key_secret,
});

exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
    if (!data.amount || !data.currency || !data.receipt) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing amount, currency, or receipt.');
    }

    const amountInPaisa = Math.round(data.amount);

    try {
        const order = await razorpay.orders.create({
            amount: amountInPaisa,
            currency: data.currency,
            receipt: data.receipt,
            notes: data.notes || {},
        });
        console.log('Razorpay Order Created:', order.id);
        return order;
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new functions.https.HttpsError('internal', 'Unable to create Razorpay order.', error.message);
    }
});
*/

/**
 * DISABLED: Firebase Cloud Function to verify Razorpay payment signature.
 * This function is commented out as Razorpay integration is temporarily removed.
 */
/*
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestore_request_id } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !firestore_request_id) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing payment verification data.');
    }

    try {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', functions.config().razorpay.key_secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            console.log(`Payment successfully verified for order ${razorpay_order_id}`);

            const requestRef = db.collection('codeGenerationRequests').doc(firestore_request_id);
            const docSnap = await requestRef.get();
            if (!docSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Request document not found for verification.');
            }
            const requestData = docSnap.data();

            await requestRef.update({
                status: 'payment_successful',
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                paymentVerificationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            await sendToPipedream(firestore_request_id, {
                customerInfo: requestData.customerInfo,
                designChoices: requestData.designChoices,
                estimatedPrice: requestData.estimatedPrice,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                status: 'payment_successful_pipedream_sent',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }).catch(e => console.error(`Failed to send data to Pipedream for verified payment ${firestore_request_id}:`, e));

            return { verified: true, message: "Payment successful and verified!" };
        } else {
            console.warn(`Payment verification failed for order ${razorpay_order_id}: Signature mismatch.`);
            const requestRef = db.collection('codeGenerationRequests').doc(firestore_request_id);
            await requestRef.update({
                status: 'payment_verification_failed',
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                paymentVerificationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                verificationError: "Signature mismatch"
            });
            throw new functions.https.HttpsError('unauthenticated', 'Payment verification failed: Signature mismatch.');
        }
    } catch (error) {
        console.error('Error during payment verification:', error);
        throw new functions.https.HttpsError('internal', 'Error verifying payment.', error.message);
    }
});
*/

/**
 * DISABLED: Cloud Function to trigger AI code generation.
 * This function is commented out as AI generation will now be
 * triggered by the Pipedream workflow, not directly by Firebase.
 */
/*
exports.generateWebsiteCode = functions.firestore
    .document('codeGenerationRequests/{requestId}')
    .onUpdate(async (change, context) => {
        const newRequestData = change.after.data();
        const oldRequestData = change.before.data();
        const requestId = context.params.requestId;

        if (newRequestData.status === 'payment_successful' && oldRequestData.status !== 'payment_successful') {
            console.log(`Processing AI generation for paid request: ${requestId}`);

            const designChoices = newRequestData.designChoices;
            if (!designChoices || !designChoices.selectedPlan) {
                console.error(`Missing designChoices or selectedPlan for request ${requestId}.`);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: 'Missing design choices or selected plan for AI generation.'
                });
                return null;
            }

            // --- CODE GENERATION PROMPT (for OpenAI) ---
            let openAIPrompt = `...`; // Content is large, omitted for brevity

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
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: `OpenAI API error: ${apiError.message || 'Unknown Storage Error.'}`
                });
                return null;
            }

            const rawContent = completion.choices[0].message.content;
            const htmlMatch = rawContent.match(/```html\s+([\s\S]*?)\s+```/);
            const cssMatch = rawContent.match(/```css\s+([\s\S]*?)\s+```/);
            const jsMatch = rawContent.match(/```javascript\s+([\s\S]*?)\s+```/);

            let htmlCode = htmlMatch ? htmlMatch[1].trim() : '';
            let cssCode = cssMatch ? cssCode[1].trim() : '';
            let jsCode = jsMatch ? jsCode[1].trim() : '';

            if (!htmlCode || !cssCode || !jsCode) {
                console.error(`Failed to parse all code blocks for request ${requestId}.`);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: 'Failed to parse generated HTML, CSS, or JS code from AI response.'
                });
                return null;
            }

            let htmlUrl = '';
            let cssUrl = '';
            jsUrl = '';

            try {
                const htmlFileName = `generated-websites/${requestId}/index.html`;
                const htmlFile = bucket.file(htmlFileName);
                await htmlFile.save(htmlCode, { contentType: 'text/html', resumable: false });
                await htmlFile.makePublic();
                htmlUrl = htmlFile.publicUrl();

                const cssFileName = `generated-websites/${requestId}/style.css`;
                const cssFile = bucket.file(cssFileName);
                await cssFile.save(cssCode, { contentType: 'text/css', resumable: false });
                await cssFile.makePublic();
                cssUrl = cssFile.publicUrl();

                const jsFileName = `generated-websites/${requestId}/script.js`;
                const jsFile = bucket.file(jsFileName);
                await jsFile.save(jsCode, { contentType: 'application/javascript', resumable: false });
                await jsFile.makePublic();
                jsUrl = jsFile.publicUrl();

            } catch (storageError) {
                console.error(`Error uploading code to Firebase Storage for request ${requestId}:`, storageError);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: `Storage upload error: ${storageError.message || 'Unknown Storage Error.'}`
                });
                return null;
            }

            let pipedreamTrackingPrompt = `...`; // Content is large, omitted for brevity

            sendToPipedream(requestId, {
                customerInfo: newRequestData.customerInfo,
                designChoices: newRequestData.designChoices,
                estimatedPrice: newRequestData.estimatedPrice,
                generatedHtmlUrl: htmlUrl,
                generatedCssUrl: cssUrl,
                generatedJsUrl: jsUrl,
                creativeText: pipedreamTrackingPrompt,
                status: 'code-generated-and-sent-to-pipedream',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }).catch(e => console.error(`Failed to send data to Pipedream for ${requestId}:`, e));

            try {
                await change.after.ref.update({
                    status: 'code-generated',
                    generatedHtmlUrl: htmlUrl,
                    generatedCssUrl: cssUrl,
                    generatedJsUrl: jsUrl,
                    generationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    redoAttempts: newRequestData.redoAttempts !== undefined ? newRequestData.redoAttempts : 2
                });
            } catch (firestoreError) {
                console.error(`Error updating Firestore document for request ${requestId}:`, firestoreError);
                return null;
            }
        }
        return null;
    }, { timeoutSeconds: 420 });
*/

/**
 * DISABLED: Cloud Function for handling re-generation requests.
 * This function is commented out as AI generation will now be
 * triggered by the Pipedream workflow, not directly by Firebase.
 */
/*
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

            const designChoices = newRequestData.designChoices;
            let openAIPrompt = `...`; // Content is large, omitted for brevity

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
                console.error(`OpenAI API call failed for re-generation request ${requestId}:`, apiError);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: `OpenAI API error during re-generation: ${apiError.message || 'Unknown Storage Error.'}`
                });
                return null;
            }

            const rawContent = completion.choices[0].message.content;
            const htmlMatch = rawContent.match(/```html\s+([\s\S]*?)\s+```/);
            const cssMatch = rawContent.match(/```css\s+([\s\S]*?)\s+```/);
            const jsMatch = rawContent.match(/```javascript\s+([\s\S]*?)\s+```/);

            let htmlCode = htmlMatch ? htmlMatch[1].trim() : '';
            let cssCode = cssMatch ? cssCode[1].trim() : '';
            let jsCode = jsMatch ? jsCode[1].trim() : '';

            if (!htmlCode || !cssCode || !jsCode) {
                console.error(`Failed to parse all code blocks for re-generation request ${requestId}.`);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: 'Failed to parse generated HTML, CSS, or JS code from AI re-generation response.'
                });
                return null;
            }

            let htmlUrl = '';
            let cssUrl = '';
            jsUrl = '';

            try {
                const htmlFileName = `generated-websites/${requestId}/index.html`;
                const htmlFile = bucket.file(htmlFileName);
                await htmlFile.save(htmlCode, { contentType: 'text/html', resumable: false });
                await htmlFile.makePublic();
                htmlUrl = htmlFile.publicUrl();

                const cssFileName = `generated-websites/${requestId}/style.css`;
                const cssFile = bucket.file(cssFileName);
                await cssFile.save(cssCode, { contentType: 'text/css', resumable: false });
                await cssFile.makePublic();
                cssUrl = cssFile.publicUrl();

                const jsFileName = `generated-websites/${requestId}/script.js`;
                const jsFile = bucket.file(jsFileName);
                await jsFile.save(jsCode, { contentType: 'application/javascript', resumable: false });
                await jsFile.makePublic();
                jsUrl = jsFile.publicUrl();

            } catch (storageError) {
                console.error(`Error uploading re-generated code to Firebase Storage for request ${requestId}:`, storageError);
                await change.after.ref.update({
                    status: 'failed',
                    errorMessage: `Storage upload error: ${storageError.message || 'Unknown Storage Error.'}`
                });
                return null;
            }

            let pipedreamTrackingPrompt = `...`; // Content is large, omitted for brevity

            sendToPipedream(requestId, {
                customerInfo: newRequestData.customerInfo,
                designChoices: newRequestData.designChoices,
                estimatedPrice: newRequestData.estimatedPrice,
                generatedHtmlUrl: htmlUrl,
                generatedCssUrl: cssUrl,
                generatedJsUrl: jsUrl,
                creativeText: pipedreamTrackingPrompt,
                status: 'code-generated-and-sent-to-pipedream',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }).catch(e => console.error(`Failed to send data to Pipedream for re-gen ${requestId}:`, e));

            try {
                await change.after.ref.update({
                    status: 'code-generated',
                    generatedHtmlUrl: htmlUrl,
                    generatedCssUrl: cssUrl,
                    generatedJsUrl: jsUrl,
                    generationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    redoAttempts: newRequestData.redoAttempts !== undefined ? newRequestData.redoAttempts : 2
                });
            } catch (firestoreError) {
                console.error(`Error updating Firestore document after re-generation for request ${requestId}:`, firestoreError);
                return null;
            }
        }
        return null;
    }, { timeoutSeconds: 420 });
*/