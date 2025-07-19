// assets/js/generated-code-preview.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('generated-code-preview.js loaded.');

    // Get the query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const requestId = urlParams.get('id');

    const requestSubmittedState = document.getElementById('request-submitted-state');
    const generatedCodeDisplay = document.getElementById('generated-code-display');
    const errorState = document.getElementById('error-state');

    const displayBusinessName = document.getElementById('display-business-name');
    const displayContactNumber = document.getElementById('display-contact-number');
    const displayContactEmail = document.getElementById('display-contact-email');
    const displaySelectedPlan = document.getElementById('display-selected-plan');
    const displayWebsiteType = document.getElementById('display-website-type');
    const displayColorScheme = document.getElementById('display-color-scheme');
    const displayButtonShape = document.getElementById('display-button-shape');
    const displayButtonEffect = document.getElementById('display-button-effect');
    const displayWebsiteSections = document.getElementById('display-website-sections');
    const displayImageDisplay = document.getElementById('display-image-display');
    const displayFonts = document.getElementById('display-fonts');
    const displayCustomDomain = document.getElementById('display-custom-domain');
    const displayBlogUpsellLi = document.getElementById('display-blog-upsell-li');
    const displayBlogContentPlan = document.getElementById('display-blog-content-plan');
    const displayEstimatedPrice = document.getElementById('display-estimated-price');
    const whatsappCtaBtn = document.getElementById('whatsapp-cta-btn');
    const returnHomeBtn = document.getElementById('return-home-btn');

    // Function to format price
    function formatPrice(price) {
        return `₹${price.toLocaleString('en-IN')}`;
    }

    if (status === 'submitted' && requestId) {
        requestSubmittedState.style.display = 'block';
        generatedCodeDisplay.style.display = 'none';
        errorState.style.display = 'none';

        // Retrieve custom selections from sessionStorage
        const storedSelections = sessionStorage.getItem('currentCustomSelections');
        if (storedSelections) {
            const customSelections = JSON.parse(storedSelections);
            console.log('Retrieved custom selections:', customSelections);

            // Populate the display fields
            if (displayBusinessName) displayBusinessName.textContent = customSelections.businessName || 'N/A';
            if (displayContactNumber) displayContactNumber.textContent = customSelections.contactNumber || 'N/A';
            if (displayContactEmail) displayContactEmail.textContent = customSelections.contactEmail || 'N/A';
            
            if (displaySelectedPlan) displaySelectedPlan.textContent = customSelections.selectedPlan ?
                                                    (customSelections.selectedPlan === 'basic' ? 'Launch Plan (Basic)' : 'Growth Plan (Advanced)') : 'N/A';

            if (displayWebsiteType) {
                // For website type, we need to map the data-type value to a more readable string
                let websiteTypeText = customSelections.websiteType || 'N/A';
                switch(customSelections.websiteType) {
                    case 'informational-landing': websiteTypeText = 'Informational Landing Page'; break;
                    case 'portfolio': websiteTypeText = 'Portfolio Website'; break;
                    case 'ecommerce-store': websiteTypeText = 'E-commerce Store'; break;
                    case 'blog': websiteTypeText = 'Blog'; break;
                    case 'event-page': websiteTypeText = 'Event Page'; break;
                    case 'personal-brand': websiteTypeText = 'Personal Brand Website'; break;
                    case 'community-forum': websiteTypeText = 'Community Forum'; break;
                    case 'directory-listing': websiteTypeText = 'Directory Listing'; break;
                    case 'online-course': websiteTypeText = 'Online Course Platform'; break;
                    case 'custom-type': websiteTypeText = `Custom: ${customSelections.customWebsiteTypeDescription || 'N/A'}`; break;
                    // Add more cases if you have other specific website types with readable names
                }
                displayWebsiteType.textContent = websiteTypeText;
            }

            let colorText = 'N/A';
            if (customSelections.colorScheme.type === 'simple') {
                colorText = `Simple: ${customSelections.colorScheme.value.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}`;
            } else if (customSelections.colorScheme.type === 'gradient') {
                colorText = `Gradient: ${customSelections.colorScheme.value.replace('gradient-', '').replace(/-/g, ' ')}`;
            } else if (customSelections.colorScheme.type === 'combination') {
                // Assuming combinations are like "red-blue" and need to be "Red Blue Combination"
                const comboParts = customSelections.colorScheme.value.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1));
                colorText = `Combination: ${comboParts.join(' ')}`;
            } else if (customSelections.colorScheme.type === 'custom') {
                colorText = `Custom: ${customSelections.customColorDescription || 'N/A'}`;
            } else if (customSelections.colorScheme.type === 'our-choice') {
                colorText = `Left to ReadyFlow (Our Choice)`;
            }
            if (displayColorScheme) displayColorScheme.textContent = colorText;

            if (displayButtonShape) {
                displayButtonShape.textContent = customSelections.buttonShape === 'custom-shape' ?
                    `Custom: ${customSelections.customButtonShapeDescription || 'N/A'}` :
                    (customSelections.buttonShape ? customSelections.buttonShape.charAt(0).toUpperCase() + customSelections.buttonShape.slice(1) : 'N/A'); // Capitalize first letter
            }

            if (displayButtonEffect) {
                displayButtonEffect.textContent = customSelections.buttonEffect === 'custom-effect' ?
                    `Custom: ${customSelections.customButtonEffectDescription || 'N/A'}` :
                    (customSelections.buttonEffect ? customSelections.buttonEffect.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'N/A');
            }

            if (displayWebsiteSections) {
                const sectionsText = customSelections.websiteSections.length > 0 ?
                    customSelections.websiteSections.map(s => {
                        if (s === 'custom-section' && customSelections.customSectionDescription) {
                            return `Custom Section: ${customSelections.customSectionDescription}`;
                        }
                        if (s === 'effect-custom-animation' && customSelections.customSectionDescription) {
                            return `Custom Advanced Animation: ${customSelections.customSectionDescription}`;
                        }
                        // Default formatting for other sections/effects
                        return s.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); 
                    }).join(', ') : 'None selected';
                displayWebsiteSections.textContent = sectionsText;
            }

            if (displayImageDisplay) {
                displayImageDisplay.textContent = customSelections.imageDisplay === 'custom-image-style' ?
                    `Custom: ${customSelections.customImageStyleDescription || 'N/A'}` :
                    (customSelections.imageDisplay ? customSelections.imageDisplay.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'N/A');
            }

            if (displayFonts) {
                displayFonts.textContent = customSelections.fontPairing === 'custom-font' ?
                    `Custom: ${customSelections.customFontDescription || 'N/A'}` :
                    (customSelections.fontPairing ? customSelections.fontPairing.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'N/A');
            }
            
            if (displayCustomDomain) displayCustomDomain.textContent = customSelections.customDomainSetup ? 'Yes' : 'No';

            if (customSelections.blogContentUpsell && customSelections.blogContentUpsell.selectedPlan !== 'none') {
                if (displayBlogUpsellLi) displayBlogUpsellLi.style.display = 'list-item';
                if (displayBlogContentPlan) displayBlogContentPlan.textContent = customSelections.blogContentUpsell.selectedPlan === 'daily-uploads' ?
                    'Daily Uploads (30 Days)' : 'Unlimited Monthly Changes';
            } else {
                if (displayBlogUpsellLi) displayBlogUpsellLi.style.display = 'none';
            }

            if (displayEstimatedPrice) displayEstimatedPrice.textContent = formatPrice(customSelections.estimatedPrice || 0);

            // Construct WhatsApp message
            const whatsappMessage = `Hello ReadyFlow! I've submitted my custom website request with ID: ${requestId}. Here are my details:\n\n` +
                                    `Business Name: ${displayBusinessName.textContent}\n` +
                                    `Contact Number: ${displayContactNumber.textContent}\n` +
                                    `Email: ${displayContactEmail.textContent}\n` +
                                    `Selected Plan: ${displaySelectedPlan.textContent}\n` +
                                    `Website Type: ${displayWebsiteType.textContent}\n` +
                                    `Color Scheme: ${displayColorScheme.textContent}\n` +
                                    `Button Shape: ${displayButtonShape.textContent}\n` +
                                    `Button Effect: ${displayButtonEffect.textContent}\n` +
                                    `Website Sections: ${displayWebsiteSections.textContent}\n` +
                                    `Image Display Style: ${displayImageDisplay.textContent}\n` +
                                    `Fonts: ${displayFonts.textContent}\n` +
                                    `Custom Domain Setup: ${displayCustomDomain.textContent}\n` +
                                    (displayBlogUpsellLi.style.display === 'list-item' ? `Blog Content Plan: ${displayBlogContentPlan.textContent}\n` : '') +
                                    `Estimated Price: ${displayEstimatedPrice.textContent}\n\n` +
                                    `Please find a screenshot of this page attached for faster processing.`;

            if (whatsappCtaBtn) {
                // Encode the message for URL
                const encodedMessage = encodeURIComponent(whatsappMessage);
                // Pre-fill with your WhatsApp number (replace with your actual number)
                const whatsappNumber = '+91YOUR_READYFLOW_WHATSAPP_NUMBER'; // TODO: Replace with your actual WhatsApp number
                whatsappCtaBtn.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
            }

            // Clear sessionStorage after displaying, so it doesn't persist for future visits
            // If you want the data to persist for browser back/forward, keep this commented
            // sessionStorage.removeItem('currentCustomSelections');

        } else {
            console.warn('No custom selections found in sessionStorage.');
            // Fallback for when no data is found (e.g., direct access or refresh)
            requestSubmittedState.style.display = 'none';
            errorState.style.display = 'block';
            if (errorState) errorState.innerHTML = `<h2 class="section-title error-text"><i class="fas fa-exclamation-triangle"></i> Error: Request details not found.</h2><p class="subheadline">It looks like there was an issue retrieving your request. Please go back and try again, or contact support with your Business Name.</p><div class="action-buttons-return"><button id="return-home-btn-error" class="btn btn-secondary">Return to Home</button></div>`;
            const returnHomeBtnError = document.getElementById('return-home-btn-error');
            if(returnHomeBtnError) {
                returnHomeBtnError.addEventListener('click', () => {
                    window.location.href = '/index.html';
                });
            }
        }
    } else {
        // Handle cases where status is not 'submitted' or no ID
        requestSubmittedState.style.display = 'none';
        generatedCodeDisplay.style.display = 'none';
        errorState.style.display = 'block';
        if (errorState) errorState.innerHTML = `<h2 class="section-title error-text"><i class="fas fa-exclamation-triangle"></i> Invalid Request.</h2><p class="subheadline">Please navigate to this page after submitting a custom website request.</p><div class="action-buttons-return"><button id="return-home-btn-error" class="btn btn-secondary">Return to Home</button></div>`;
        const returnHomeBtnError = document.getElementById('return-home-btn-error');
        if(returnHomeBtnError) {
            returnHomeBtnError.addEventListener('click', () => {
                window.location.href = '/index.html';
            });
        }
    }

    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', () => {
            window.location.href = '/index.html';
        });
    }
});