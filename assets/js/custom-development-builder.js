// assets/js/custom-development-builder.js

import { db } from './login.js'; // Import Firestore database instance
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth } from './login.js'; // Import auth for getting current user ID

document.addEventListener('DOMContentLoaded', () => {
    console.log('custom-development-builder.js loaded and DOMContentLoaded fired.');

    // --- UI Elements ---
    const mainSelection = document.getElementById('main-selection');
    const customBuilderSection = document.getElementById('custom-builder-section');
    const editCodeSection = document.getElementById('edit-code-section');

    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextStepBtns = document.querySelectorAll('.next-step-btn');
    const prevStepBtns = document.querySelectorAll('.prev-step-btn');
    const backToSelectionBtns = document.querySelectorAll('.back-to-selection-btn');

    // Contact Info Step
    const businessNameInput = document.getElementById('business-name');
    const businessTypeInput = document.getElementById('business-type');
    const contactNumberInput = document.getElementById('contact-number');
    const contactEmailInput = document.getElementById('contact-email');

    // Plan Selection Step elements
    const planCards = document.querySelectorAll('.plan-card');
    const selectPlanNextBtn = document.getElementById('select-plan-next-btn');

    // Website Type Selection (Step 3)
    const websiteTypeOptions = document.querySelectorAll('.website-type-grid .option-box');
    // REMOVED: const pageCountSelection = document.getElementById('page-count-selection');
    // REMOVED: const pageCountOptions = document.querySelectorAll('.page-count-grid .option-box');
    const customWebsiteTypeInputGroup = document.getElementById('custom-website-type-input-group');
    const customWebsiteTypeDescription = document.getElementById('custom-website-type-description');

    // Color Selection Step (Step 4)
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const customColorInputGroup = document.getElementById('custom-color-input-group');
    const customColorDescription = document.getElementById('custom-color-description');

    // Button Shape & Effect Step (Step 5)
    const buttonShapeOptions = document.querySelectorAll('.shape-option');
    const customButtonShapeInputGroup = document.getElementById('custom-button-shape-input-group');
    const customButtonShapeDescription = document.getElementById('custom-button-shape-description');
    const buttonEffectOptions = document.querySelectorAll('.effect-option');
    const customButtonEffectInputGroup = document.getElementById('custom-button-effect-input-group');
    const customButtonEffectDescription = document.getElementById('custom-button-effect-description');

    // Website Sections Step (Step 6)
    const sectionOptions = document.querySelectorAll('.section-options-grid .option-box');
    const advancedEffectOptions = document.querySelectorAll('.advanced-effects-grid .option-box');
    const customSectionInputGroup = document.getElementById('custom-section-input-group');
    const customSectionDescription = document.getElementById('custom-section-description');

    // Image Display Style Step (Step 7)
    const imageDisplayOptions = document.querySelectorAll('.image-display-grid .option-box');
    const customImageStyleInputGroup = document.getElementById('custom-image-style-input-group');
    const customImageStyleDescription = document.getElementById('custom-image-style-description');

    // Font Selection Step (Step 8)
    const fontOptions = document.querySelectorAll('.font-option');
    const customFontInputGroup = document.getElementById('custom-font-input-group');
    const customFontDescription = document.getElementById('custom-font-description');

    // Review & Payment Step (Step 9)
    const reviewBusinessName = document.getElementById('review-business-name');
    const reviewBusinessType = document.getElementById('review-business-type');
    const reviewContactNumber = document.getElementById('review-contact-number');
    const reviewContactEmail = document.getElementById('review-contact-email');
    const reviewSelectedPlan = document.getElementById('review-selected-plan');
    const reviewWebsiteType = document.getElementById('review-website-type');
    const reviewColorScheme = document.getElementById('review-color-scheme');
    const reviewButtonShape = document.getElementById('review-button-shape');
    const reviewButtonEffect = document.getElementById('review-button-effect');
    const reviewWebsiteSections = document.getElementById('review-website-sections');
    const reviewExtraPages = document.getElementById('review-extra-pages');
    const reviewCustomDomain = document.getElementById('review-custom-domain');
    const reviewImageDisplay = document.getElementById('review-image-display');
    const reviewFonts = document.getElementById('review-fonts');
    const reviewBlogUpsellSummary = document.getElementById('review-blog-upsell-summary');
    const reviewBlogContentPlan = document.getElementById('review-blog-content-plan');
    const reviewBlogContentCost = document.getElementById('review-blog-content-cost');
    const finalEstimatedQuote = document.getElementById('final-estimated-quote');
    const proceedToPaymentBtn = document.getElementById('proceed-to-payment-btn');

    const customDomainSetupCheckbox = document.getElementById('custom-domain-setup');

    // Price Display
    const customPriceDisplay = document.getElementById('custom-estimated-price');
    const customPriceBarFill = document.getElementById('custom-price-bar-fill');

    // Recommended Plan Display (on Step 9)
    const recommendedPlanBox = document.querySelector('.recommended-plan-box');
    const recommendedPlanNameEl = document.getElementById('recommended-plan-name');
    const recommendedPlanTaglineEl = document.getElementById('recommended-plan-tagline');
    const recommendedPlanFeaturesList = document.querySelector('.recommended-plan-box .plan-features-list');

   // Plan Warning Modal elements
    const planWarningModal = document.getElementById('plan-warning-modal');
    const planWarningModalMessage = document.getElementById('plan-warning-modal-message');
    const modalBasicPlanLimit = document.getElementById('modal-basic-plan-limit');
    const modalCurrentSectionsCount = document.getElementById('modal-current-sections-count');
    const modalDowngradeSectionsBtn = document.getElementById('modal-downgrade-sections-btn');
    const modalUpgradePlanBtn = document.getElementById('modal-upgrade-plan-btn');

    // Blog Upsell Modal elements
    const blogUpsellModal = document.getElementById('blog-upsell-modal');
    const blogUpsellOptions = document.querySelectorAll('.blog-upsell-option');
    const blogUpsellSkipBtn = document.getElementById('blog-upsell-skip-btn');
    const blogUpsellAddBtn = document.getElementById('blog-upsell-add-btn');


    // --- State Management ---
    let currentStep = 1;
    const TOTAL_STEPS = formSteps.length;

    // Object to store all user selections
    let customSelections = {
        businessName: '',
        businessType: '',
        contactNumber: '',
        contactEmail: '',
        selectedPlan: '',
        websiteType: '',
        websitePageCount: '1', // Fixed to 1 page
        customWebsiteTypeDescription: '',
        colorScheme: {
            type: '',
            value: ''
        },
        customColorDescription: '',
        buttonShape: '',
        customButtonShapeDescription: '',
        buttonEffect: '',
        customButtonEffectDescription: '',
        websiteSections: [],
        customSectionDescription: '',
        imageDisplay: '',
        customImageStyleDescription: '',
        fontPairing: '',
        customFontDescription: '',
        customDomainSetup: false,
        blogContentUpsell: {
            selectedPlan: 'none',
            price: 0
        },
        estimatedPrice: 0,
    };

    // --- PRICING CONFIGURATIONS ---
    const BASIC_PLAN_PRICE = 499;
    const GROWTH_PLAN_PRICE = 1299;
    // REMOVED: PAGE_COUNT_PRICING
    const CUSTOM_DOMAIN_PRICE = 149;
    const BLOG_UPSELL_PRICING = {
        'daily-uploads': 299,
        'unlimited-changes': 573
    };
    const MAX_EXPECTED_PRICE_FOR_BAR = GROWTH_PLAN_PRICE + Math.max(...Object.values(BLOG_UPSELL_PRICING)) + CUSTOM_DOMAIN_PRICE + 100; // Adjusted max price

    // Define feature limits/defaults based on plans
    const planFeatureLimits = {
        basic: {
            maxIncludedSections: 3,
            maxIncludedPages: 1, // Fixed to 1 page
            allowCustomFont: false,
            allowCustomButtonShape: false,
            allowComplexButtonEffects: false,
            allowAdvancedImageStyles: false,
            restrictedSections: ['portfolio', 'team', 'blog'],
            restrictedWebsiteTypes: ['full-website', 'ecommerce-store', 'portfolio'],
            restrictedImageStyles: ['masonry', 'custom-image-style', 'carousel'],
            restrictedButtonEffects: ['grow', 'shadow', 'slide-fill', 'custom-effect'],
            restrictedButtonShapes: ['pill', 'custom-shape'],
            restrictedFontOptions: ['oswald-roboto', 'playfair-montserrat', 'raleway-lato', 'custom-font'],
            restrictedAdvancedEffects: [
                'effect-hero-flyin', 'effect-parallax-scroll', 'effect-glassmorphism',
                'effect-magnetic-hover', 'effect-scroll-timeline', 'effect-live-counters', 'effect-custom-animation'
            ],
        },
        growth: {
            maxIncludedSections: Infinity,
            maxIncludedPages: 1, // Fixed to 1 page
            allowCustomFont: true,
            allowCustomButtonShape: true,
            allowComplexButtonEffects: true,
            allowAdvancedImageStyles: true,
            restrictedSections: [],
            restrictedWebsiteTypes: [],
            restrictedImageStyles: [],
            restrictedButtonEffects: [],
            restrictedButtonShapes: [],
            restrictedFontOptions: [],
            restrictedAdvancedEffects: [],
        }
    };


    // --- UTILITY FUNCTIONS ---
    function formatPrice(price) {
        return `₹${price.toLocaleString('en-IN')}`;
    }

    function calculateTotalPrice() {
        let total = 0;

        // Base plan price
        if (customSelections.selectedPlan === 'basic') {
            total += BASIC_PLAN_PRICE;
        } else if (customSelections.selectedPlan === 'growth') {
            total += GROWTH_PLAN_PRICE;
        } else {
            customSelections.estimatedPrice = 0;
            if (customPriceDisplay) customPriceDisplay.textContent = formatPrice(0);
            if (finalEstimatedQuote) finalEstimatedQuote.textContent = formatPrice(0);
            if (customPriceBarFill) customPriceBarFill.style.width = `0%`;
            return;
        }

        // const currentPlanLimits = planFeatureLimits[customSelections.selectedPlan]; // Not strictly needed for pricing here

        // Page count add-on cost is now removed, as it's fixed to 1 page for all plans.
        // if (customSelections.websitePageCount && PAGE_COUNT_PRICING[customSelections.websitePageCount] !== undefined) {
        //     if (PAGE_COUNT_PRICING[customSelections.websitePageCount] > 0 || customSelections.selectedPlan === 'growth') {
        //         total += PAGE_COUNT_PRICING[customSelections.websitePageCount];
        //     }
        // }

        const selectedVisibleSections = customSelections.websiteSections.filter(s => {
            const el = document.querySelector(`.option-box[data-section="${s}"]`);
            return el && !el.classList.contains('disabled');
        });

        if (customSelections.customDomainSetup) {
            total += CUSTOM_DOMAIN_PRICE;
        }

        if (customSelections.blogContentUpsell.selectedPlan !== 'none') {
            total += customSelections.blogContentUpsell.price;
        }

        customSelections.estimatedPrice = total;
        if (customPriceDisplay) customPriceDisplay.textContent = formatPrice(total);
        if (finalEstimatedQuote) finalEstimatedQuote.textContent = formatPrice(total);

        const barWidth = Math.min(100, (total / MAX_EXPECTED_PRICE_FOR_BAR) * 100);
        if (customPriceBarFill) customPriceBarFill.style.width = `${barWidth}%`;
    }

    function showPlanWarningModal(sectionsCount) {
        if (!planWarningModal) return;
        if (modalBasicPlanLimit) modalBasicPlanLimit.textContent = planFeatureLimits.basic.maxIncludedSections;
        if (modalCurrentSectionsCount) modalCurrentSectionsCount.textContent = sectionsCount;

        if (planWarningModalMessage) {
            planWarningModalMessage.innerHTML = `
                It looks like you've selected more features than your current plan allows.
                The Basic Plan is perfect for launching simple websites with up to <strong>${planFeatureLimits.basic.maxIncludedSections} sections</strong>.
                You've chosen <strong>${sectionsCount} sections</strong>.
                To fully realize your vision, we recommend upgrading to the Growth Plan for comprehensive features and more flexibility.
            `;
        }

        planWarningModal.classList.add('show');
    }

    function hidePlanWarningModal() {
        if (planWarningModal) {
            planWarningModal.classList.remove('show');
        }
    }

    function showBlogUpsellModal() {
        if (blogUpsellModal) {
            blogUpsellModal.classList.add('show');
        }
    }

    function hideBlogUpsellModal() {
        if (blogUpsellModal) {
            blogUpsellModal.classList.remove('show');
        }
    }

    function setOptionBoxState(optionsList, restrictedItems, currentSelectedItem = null, defaultItem = null) {
        optionsList.forEach(option => {
            const dataValue = option.dataset.type || option.dataset.pages || option.dataset.colorType || option.dataset.colorValue || option.dataset.shape || option.dataset.effect || option.dataset.section || option.dataset.imageStyle || option.dataset.font;

            if (restrictedItems.includes(dataValue)) {
                option.classList.add('disabled');
                if (option.classList.contains('selected')) {
                    option.classList.remove('selected');
                    if (defaultItem) {
                        const defaultOptionElement = document.querySelector(`[data-${Object.keys(defaultItem)[0]}="${Object.values(defaultItem)[0]}"]`);
                        if (defaultOptionElement && !defaultOptionElement.classList.contains('disabled')) {
                            defaultOptionElement.click();
                        } else {
                            if (currentSelectedItem === dataValue) {
                                if (dataValue === customSelections.websiteType) customSelections.websiteType = '';
                                // Removed other page count specific logic here
                                else if (dataValue === customSelections.colorScheme.value) { customSelections.colorScheme.type = ''; customSelections.colorScheme.value = ''; }
                                else if (dataValue === customSelections.buttonShape) customSelections.buttonShape = '';
                                else if (dataValue === customSelections.buttonEffect) customSelections.buttonEffect = '';
                                else if (customSelections.websiteSections.includes(dataValue)) customSelections.websiteSections = customSelections.websiteSections.filter(s => s !== dataValue);
                                else if (dataValue === customSelections.imageDisplay) customSelections.imageDisplay = '';
                                else if (dataValue === customSelections.fontPairing) customSelections.fontPairing = '';
                            }
                        }
                    } else {
                        if (currentSelectedItem === dataValue) {
                            if (dataValue === customSelections.websiteType) customSelections.websiteType = '';
                            // Removed other page count specific logic here
                            else if (dataValue === customSelections.colorScheme.value) { customSelections.colorScheme.type = ''; customSelections.colorScheme.value = ''; }
                            else if (dataValue === customSelections.buttonShape) customSelections.buttonShape = '';
                            else if (dataValue === customSelections.buttonEffect) customSelections.buttonEffect = '';
                            else if (customSelections.websiteSections.includes(dataValue)) customSelections.websiteSections = customSelections.websiteSections.filter(s => s !== dataValue);
                            else if (dataValue === customSelections.imageDisplay) customSelections.imageDisplay = '';
                            else if (dataValue === customSelections.fontPairing) customSelections.fontPairing = '';
                        }
                    }
                }
            } else {
                option.classList.remove('disabled');
            }
        });
    }

    function applyPlanRestrictions() {
        const currentPlan = customSelections.selectedPlan;
        if (!currentPlan) {
            setOptionBoxState(websiteTypeOptions, planFeatureLimits['growth'].restrictedWebsiteTypes, customSelections.websiteType);
            // Removed pageCountOptions restriction here
            return;
        }

        const limits = planFeatureLimits[currentPlan];

        setOptionBoxState(websiteTypeOptions, limits.restrictedWebsiteTypes, customSelections.websiteType);
        if (customSelections.websiteType === 'custom-type' && !limits.restrictedWebsiteTypes.includes('custom-type')) {
            if (customWebsiteTypeInputGroup) customWebsiteTypeInputGroup.classList.remove('hidden');
            if (customWebsiteTypeDescription) customWebsiteTypeDescription.setAttribute('required', 'true');
        } else {
            if (customWebsiteTypeInputGroup) customWebsiteTypeInputGroup.classList.add('hidden');
            if (customWebsiteTypeDescription) {
                customWebsiteTypeDescription.removeAttribute('required');
                customWebsiteTypeDescription.value = '';
            }
            if (customSelections.websiteType === 'custom-type' && limits.restrictedWebsiteTypes.includes('custom-type')) {
                customSelections.websiteType = '';
            }
        }

        // Removed setOptionBoxState for pageCountOptions here

        colorSwatches.forEach(swatch => swatch.classList.remove('disabled'));

        setOptionBoxState(buttonEffectOptions, limits.restrictedButtonEffects, customSelections.buttonEffect, {effect: 'none'});
        if (customSelections.buttonEffect === 'custom-effect' && !limits.restrictedButtonEffects.includes('custom-effect')) {
            if (customButtonEffectInputGroup) customButtonEffectInputGroup.classList.remove('hidden');
            if (customButtonEffectDescription) customButtonEffectDescription.setAttribute('required', 'true');
        } else {
            if (customButtonEffectInputGroup) customButtonEffectInputGroup.classList.add('hidden');
            if (customButtonEffectDescription) {
                customButtonEffectDescription.removeAttribute('required');
                customButtonEffectDescription.value = '';
            }
            customSelections.customButtonEffectDescription = '';
        }

        setOptionBoxState(buttonShapeOptions, limits.restrictedButtonShapes, customSelections.buttonShape, {shape: 'rounded'});
        if (customSelections.buttonShape === 'custom-shape' && !limits.restrictedButtonShapes.includes('custom-shape')) {
            if (customButtonShapeInputGroup) customButtonShapeInputGroup.classList.remove('hidden');
            if (customButtonShapeDescription) customButtonShapeDescription.setAttribute('required', 'true');
        } else {
            if (customButtonShapeInputGroup) customButtonShapeInputGroup.classList.add('hidden');
            if (customButtonShapeDescription) {
                customButtonShapeDescription.removeAttribute('required');
                customButtonShapeDescription.value = '';
            }
            customSelections.customButtonShapeDescription = '';
        }

        setOptionBoxState(sectionOptions, limits.restrictedSections, null);
        setOptionBoxState(advancedEffectOptions, limits.restrictedAdvancedEffects, null);

        const isCustomSectionSelected = customSelections.websiteSections.includes('custom-section');
        const isCustomAnimationSelected = customSelections.websiteSections.includes('effect-custom-animation');

        if ((isCustomSectionSelected && !limits.restrictedSections.includes('custom-section')) ||
            (isCustomAnimationSelected && !limits.restrictedAdvancedEffects.includes('effect-animation-custom'))) {
            if (customSectionInputGroup) customSectionInputGroup.classList.remove('hidden');
            if (customSectionDescription) customSectionDescription.setAttribute('required', 'true');
        } else {
            if (customSectionInputGroup) customSectionInputGroup.classList.add('hidden');
            if (customSectionDescription) {
                customSectionDescription.removeAttribute('required');
                customSectionDescription.value = '';
            }
            customSelections.customSectionDescription = '';
        }


        setOptionBoxState(imageDisplayOptions, limits.restrictedImageStyles, customSelections.imageDisplay, {imageStyle: 'grid'});
        if (customSelections.imageDisplay === 'custom-image-style' && !limits.restrictedImageStyles.includes('custom-image-style')) {
            if (customImageStyleInputGroup) customImageStyleInputGroup.classList.remove('hidden');
            if (customImageStyleDescription) customImageStyleDescription.setAttribute('required', 'true');
        } else {
            if (customImageStyleInputGroup) customImageStyleInputGroup.classList.add('hidden');
            if (customImageStyleDescription) {
                customImageStyleDescription.removeAttribute('required');
                customImageStyleDescription.value = '';
            }
            customSelections.customImageStyleDescription = '';
        }


        setOptionBoxState(fontOptions, limits.restrictedFontOptions, customSelections.fontPairing, {font: 'poppins-inter'});
        if (customSelections.fontPairing === 'custom-font' && !limits.restrictedFontOptions.includes('custom-font')) {
            if (customFontInputGroup) customFontInputGroup.classList.remove('hidden');
            if (customFontDescription) customFontDescription.setAttribute('required', 'true');
        } else {
            if (customFontInputGroup) customFontInputGroup.classList.add('hidden');
            if (customFontDescription) {
                customFontDescription.removeAttribute('required');
                customFontDescription.value = '';
            }
            customSelections.customFontDescription = '';
        }

        calculateTotalPrice();
    }


    function updateProgressBar() {
        progressSteps.forEach((step) => {
            const stepNumber = parseInt(step.dataset.step);
            if (stepNumber === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
            if (stepNumber < currentStep) {
                step.classList.add('completed');
            } else {
                step.classList.remove('completed');
            }
        });
    }

    function showStep(stepNumber) {
        console.log(`Attempting to show step: ${stepNumber}`);
        formSteps.forEach((step) => {
            if (parseInt(step.dataset.step) === stepNumber) {
                step.classList.add('active');
                step.style.display = 'flex';
            } else {
                step.classList.remove('active');
                step.style.display = 'none';
            }
        });
        currentStep = stepNumber;
        updateProgressBar();
        const builderContent = document.querySelector('.builder-content');
        if (builderContent) {
            builderContent.scrollTo({ top: 0, behavior: 'smooth' });
        }

        applyPlanRestrictions();

        // Removed page count selection visibility toggle here, as it's no longer present
        // if (stepNumber === 3) {
        //     const selectedWebsiteType = customSelections.websiteType;
        //     if (selectedWebsiteType && selectedWebsiteType !== '') {
        //         if (pageCountSelection) pageCountSelection.classList.remove('hidden');
        //     } else {
        //         if (pageCountSelection) pageCountSelection.classList.add('hidden');
        //     }
        // } else {
        //     if (pageCountSelection) pageCountSelection.classList.add('hidden');
        // }

        calculateTotalPrice();
    }

    function validateStep(step) {
        let isValid = true;
        const currentPlanLimits = planFeatureLimits[customSelections.selectedPlan];

        switch (step) {
            case 1:
                if (!businessNameInput.value.trim()) {
                    businessNameInput.focus();
                    alert('Please enter your Business Name.');
                    isValid = false;
                } else if (!businessTypeInput.value.trim()) {
                    businessTypeInput.focus();
                    alert('Please enter your Business Type.');
                    isValid = false;
                } else if (!contactNumberInput.value.trim()) {
                    contactNumberInput.focus();
                    alert('Please enter your Contact Number.');
                    isValid = false;
                } else if (!contactEmailInput.value.trim() || !/\S+@\S+\.\S+/.test(contactEmailInput.value)) {
                    contactEmailInput.focus();
                    alert('Please enter a valid Email Address.');
                    isValid = false;
                }
                break;
            case 2:
                if (!customSelections.selectedPlan) {
                    alert('Please select a development plan.');
                    isValid = false;
                }
                break;
            case 3:
                const selectedWebsiteTypeOption = document.querySelector('.website-type-grid .option-box.selected');
                if (!selectedWebsiteTypeOption) {
                    alert(`Please select a Website Type.`);
                    isValid = false;
                } else if (customSelections.websiteType === 'custom-type' && customWebsiteTypeDescription && !customWebsiteTypeDescription.value.trim()) {
                    alert('Please describe your Custom Website Type.');
                    customWebsiteTypeDescription.focus();
                    isValid = false;
                }

                // REMOVED: Page count validation as it's now fixed to 1.
                // const selectedPageCountOption = document.querySelector('.page-count-grid .option-box.selected');
                // if (!selectedPageCountOption) {
                //     alert('Please select the approximate number of pages for your website.');
                //     isValid = false;
                // }
                if (selectedWebsiteTypeOption && currentPlanLimits.restrictedWebsiteTypes.includes(customSelections.websiteType)) {
                     alert(`The selected website type "${selectedWebsiteTypeOption.querySelector('h4').textContent}" is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                     isValid = false;
                }
                // REMOVED: Page count limit check for basic plan
                // if (selectedPageCountOption && customSelections.selectedPlan === 'basic') {
                //     const pagesValue = parseInt(selectedPageCountOption.dataset.pages.split('-')[0]);
                //     if (pagesValue > currentPlanLimits.maxIncludedPages) {
                //         alert(`The selected page count is not available in the Basic plan. Please select 1 page or upgrade to Growth.`);
                //         isValid = false;
                //     }
                // }
                break;
            case 4:
                const selectedColorSwatch = document.querySelector('.color-swatch.selected');
                if (!selectedColorSwatch) {
                    alert(`Please select a Color Scheme.`);
                    isValid = false;
                } else if (customSelections.colorScheme.type === 'custom' && customColorDescription && !customColorDescription.value.trim()) {
                    alert('Please describe your Custom Colors.');
                    customColorDescription.focus();
                    isValid = false;
                }
                break;
            case 5:
                const selectedButtonShape = document.querySelector('.shape-option.selected');
                const selectedButtonEffect = document.querySelector('.effect-option.selected');

                if (!selectedButtonShape) {
                    alert(`Please select a Button Shape.`);
                    isValid = false;
                } else if (customSelections.buttonShape === 'custom-shape' && customButtonShapeDescription && !customButtonShapeDescription.value.trim()) {
                    alert('Please describe your Custom Button Shape.');
                    customButtonShapeDescription.focus();
                    isValid = false;
                } else if (currentPlanLimits.restrictedButtonShapes.includes(customSelections.buttonShape)) {
                    alert(`The selected button shape is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                    isValid = false;
                }

                if (!selectedButtonEffect) {
                    alert(`Please select a Button Effect.`);
                    isValid = false;
                } else if (customSelections.buttonEffect === 'custom-effect' && customButtonEffectDescription && !customButtonEffectDescription.value.trim()) {
                    alert('Please describe your Custom Button Effect.');
                    customButtonEffectDescription.focus();
                    isValid = false;
                } else if (currentPlanLimits.restrictedButtonEffects.includes(customSelections.buttonEffect)) {
                    alert(`The selected button effect is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                    isValid = false;
                }
                break;
            case 6:
                const currentlySelectedSections = customSelections.websiteSections.filter(s => {
                    const el = document.querySelector(`.option-box[data-section="${s}"]`) ||
                               document.querySelector(`.advanced-effects-grid .option-box[data-section="${s}"]`);
                    return el && !el.classList.contains('disabled');
                });

                if (currentlySelectedSections.length === 0) {
                    alert('Please select at least one Website Section.');
                    isValid = false;
                } else if (customSelections.websiteSections.includes('custom-section') && customSectionDescription && !customSectionDescription.value.trim()) {
                    alert('Please describe your Custom Website Sections.');
                    customSectionDescription.focus();
                    isValid = false;
                } else if (customSelections.websiteSections.includes('effect-custom-animation') && customSectionDescription && !customSectionDescription.value.trim()) {
                    alert('Please describe your Custom Advanced Animation.');
                    customSectionDescription.focus();
                    isValid = false;
                }

                for (const section of customSelections.websiteSections) {
                    if (currentPlanLimits.restrictedSections.includes(section)) {
                        alert(`The "${document.querySelector(`.option-box[data-section="${section}"] h4`)?.textContent}" section is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                        isValid = false;
                        break;
                    }
                    if (currentPlanLimits.restrictedAdvancedEffects.includes(section)) {
                        alert(`The "${document.querySelector(`.option-box[data-section="${section}"] h4`)?.textContent}" effect is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                        isValid = false;
                        break;
                    }
                }

                const totalSectionsChosen = currentlySelectedSections.length;
                const maxAllowedSectionsInBasic = currentPlanLimits.maxIncludedSections;

                if (customSelections.selectedPlan === 'basic' && totalSectionsChosen > maxAllowedSectionsInBasic) {
                    showPlanWarningModal(totalSectionsChosen);
                    isValid = false;
                }
                break;
            case 7:
                const selectedImageDisplayOption = document.querySelector('.image-display-grid .option-box.selected');
                if (!selectedImageDisplayOption) {
                    alert(`Please select an Image Display Style.`);
                    isValid = false;
                } else if (customSelections.imageDisplay === 'custom-image-style' && customImageStyleDescription && !customImageStyleDescription.value.trim()) {
                    alert('Please describe your Custom Image Display Style.');
                    customImageStyleDescription.focus();
                    isValid = false;
                } else if (currentPlanLimits.restrictedImageStyles.includes(customSelections.imageDisplay)) {
                     alert(`The selected image display style is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                     isValid = false;
                }
                break;
            case 8:
                const selectedFontOption = document.querySelector('.font-option.selected');
                if (!selectedFontOption) {
                    alert(`Please select a Font Pairing.`);
                    isValid = false;
                } else if (customSelections.fontPairing === 'custom-font' && customFontDescription && !customFontDescription.value.trim()) {
                    alert('Please describe your Custom Font Choices.');
                    customFontDescription.focus();
                    isValid = false;
                } else if (currentPlanLimits.restrictedFontOptions.includes(customSelections.fontPairing)) {
                     alert(`The selected font option is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                     isValid = false;
                }
                break;
            case 9:
                if (!customSelections.businessName || !customSelections.businessType || !customSelections.contactNumber || !customSelections.contactEmail) {
                    alert('Please ensure your contact information and business type are complete.');
                    isValid = false;
                    showStep(1);
                }
                if (!customSelections.selectedPlan) {
                    alert('A plan must be selected.');
                    isValid = false;
                    showStep(2);
                }
                // Removed page count validation for step 9, as it's now fixed.
                // if (!customSelections.websiteType || !customSelections.websitePageCount) {
                //      alert('Please ensure your website type and page count are selected.');
                //      isValid = false;
                //      showStep(3);
                // }
                if (customSelections.selectedPlan === 'basic') {
                    const selectedSectionsCount = customSelections.websiteSections.filter(s => {
                        const el = document.querySelector(`.option-box[data-section="${s}"]`) ||
                                   document.querySelector(`.advanced-effects-grid .option-box[data-section="${s}"]`);
                        return el && !el.classList.contains('disabled');
                    }).length;
                    if (selectedSectionsCount > currentPlanLimits.maxIncludedSections) {
                        alert('You have selected too many sections for the Basic plan. Please deselect some or upgrade.');
                        isValid = false;
                        showStep(6);
                    }
                }
                break;
        }
        return isValid;
    }

    function populateReviewSummary() {
        if (reviewBusinessName) reviewBusinessName.textContent = customSelections.businessName || 'N/A';
        if (reviewBusinessType) reviewBusinessType.textContent = customSelections.businessType || 'N/A';
        if (reviewContactNumber) reviewContactNumber.textContent = customSelections.contactNumber || 'N/A';
        if (reviewContactEmail) reviewContactEmail.textContent = customSelections.contactEmail || 'N/A';

        if (reviewSelectedPlan) reviewSelectedPlan.textContent = customSelections.selectedPlan ?
                                            (customSelections.selectedPlan === 'basic' ? 'Launch Plan (Basic)' : 'Growth Plan (Advanced)') : 'N/A';

        if (reviewWebsiteType) reviewWebsiteType.textContent = customSelections.websiteType === 'custom-type' ?
            `Custom: ${customSelections.customWebsiteTypeDescription || 'N/A'}` :
            (document.querySelector(`.website-type-grid .option-box[data-type="${customSelections.websiteType}"] h4`)?.textContent || 'N/A');

        // Removed reviewExtraPages as page count is now fixed.
        // if (reviewExtraPages) reviewExtraPages.textContent = customSelections.websitePageCount ?
        //     `${customSelections.websitePageCount} Pages` : 'N/A';

        let colorText = 'N/A';
        if (customSelections.colorScheme.type === 'simple') {
            colorText = `Simple: ${customSelections.colorScheme.value}`;
        } else if (customSelections.colorScheme.type === 'gradient') {
            colorText = `Gradient: ${customSelections.colorScheme.value.replace('gradient-', '').replace(/-/g, ' ')}`;
        } else if (customSelections.colorScheme.type === 'combination') {
            const comboSwatch = document.querySelector(`.color-swatch[data-color-type="combination"][data-color-value="${customSelections.colorScheme.value}"]`);
            if (comboSwatch) {
                const parts = comboSwatch.dataset.colorValue.split('-');
                colorText = `Combination: ${parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')}`;
            } else {
                colorText = `Combination: ${customSelections.customColorDescription || 'N/A'}`;
            }
        } else if (customSelections.colorScheme.type === 'custom') {
            colorText = `Custom: ${customSelections.customColorDescription || 'N/A'}`;
        } else if (customSelections.colorScheme.type === 'our-choice') {
            colorText = `Left to ReadyFlow (Our Choice)`;
        }
        if (reviewColorScheme) reviewColorScheme.textContent = colorText;

        if (reviewButtonShape) reviewButtonShape.textContent = customSelections.buttonShape === 'custom-shape' ?
            `Custom: ${customSelections.customButtonShapeDescription || 'N/A'}` :
            (document.querySelector(`.shape-option[data-shape="${customSelections.buttonShape}"] span`)?.textContent || 'N/A');

        if (reviewButtonEffect) reviewButtonEffect.textContent = customSelections.buttonEffect === 'custom-effect' ?
            `Custom: ${customSelections.customButtonEffectDescription || 'N/A'}` :
            (document.querySelector(`.effect-option[data-effect="${customSelections.buttonEffect}"] span`)?.textContent || 'N/A');

        const displayedSections = customSelections.websiteSections.filter(s => {
            const el = document.querySelector(`.section-options-grid .option-box[data-section="${s}"]`) ||
                       document.querySelector(`.advanced-effects-grid .option-box[data-section="${s}"]`);
            return el && !el.classList.contains('disabled');
        });

        if (reviewWebsiteSections) reviewWebsiteSections.textContent = displayedSections.length > 0 ?
            displayedSections.map(s => {
                const optionEl = document.querySelector(`.section-options-grid .option-box[data-section="${s}"]`) ||
                                 document.querySelector(`.advanced-effects-grid .option-box[data-section="${s}"]`);
                if (s === 'custom-section' && customSelections.customSectionDescription) {
                    return `Custom Section: ${customSelections.customSectionDescription}`;
                }
                if (s === 'effect-custom-animation' && customSelections.customSectionDescription) {
                    return `Custom Advanced Animation: ${customSelections.customSectionDescription}`;
                }
                if (optionEl && optionEl.querySelector('h4')) {
                    return optionEl.querySelector('h4').textContent.trim();
                }
                return s;
            }).join(', ') : 'None selected or allowed sections selected';

        if (reviewCustomDomain) reviewCustomDomain.textContent = customSelections.customDomainSetup ? 'Yes' : 'No';

        if (reviewImageDisplay) reviewImageDisplay.textContent = customSelections.imageDisplay === 'custom-image-style' ?
            `Custom: ${customSelections.customImageStyleDescription || 'N/A'}` :
            (document.querySelector(`.image-display-grid .option-box[data-image-style="${customSelections.imageDisplay}"] h4`)?.textContent || 'N/A');

        if (reviewFonts) reviewFonts.textContent = customSelections.fontPairing === 'custom-font' ?
            `Custom: ${customSelections.customFontDescription || 'N/A'}` :
            (document.querySelector(`.font-option[data-font="${customSelections.fontPairing}"] h4`)?.textContent || 'N/A');

        if (customSelections.blogContentUpsell.selectedPlan !== 'none' && reviewBlogUpsellSummary) {
            reviewBlogUpsellSummary.classList.remove('hidden');
            if (reviewBlogContentPlan) reviewBlogContentPlan.textContent = customSelections.blogContentUpsell.selectedPlan === 'daily-uploads' ?
                'Daily Uploads (30 Days)' : 'Unlimited Monthly Changes';
            if (reviewBlogContentCost) reviewBlogContentCost.textContent = `₹${customSelections.blogContentUpsell.price}/month`;
        } else {
            if (reviewBlogUpsellSummary) reviewBlogUpsellSummary.classList.add('hidden');
        }

        calculateTotalPrice();

        if (recommendedPlanFeaturesList) recommendedPlanFeaturesList.innerHTML = '';

        if (customSelections.selectedPlan === 'growth') {
            if (recommendedPlanNameEl) recommendedPlanNameEl.textContent = '✨ Growth Plan — ₹1,299';
            if (recommendedPlanTaglineEl) recommendedPlanTaglineEl.textContent = 'Includes:';
            const features = [
                '✔️ 1-page premium design with animations and transitions',
                '✔️ Contact form included',
                '✔️ Custom font, button shape, color theme',
                '✔️ AI-generated text and design',
                '✔️ 10-day concierge (free edits)',
            ];
            features.forEach(feature => {
                const li = document.createElement('li');
                li.innerHTML = feature;
                if (recommendedPlanFeaturesList) recommendedPlanFeaturesList.appendChild(li);
            });
            if(recommendedPlanBox) recommendedPlanBox.style.display = 'block';
        } else if (customSelections.selectedPlan === 'basic') {
            if (recommendedPlanNameEl) recommendedPlanNameEl.textContent = '🚀 Launch Plan (Basic) — ₹499';
            if (recommendedPlanTaglineEl) recommendedPlanTaglineEl.textContent = 'Includes:';
            const features = [
                '✔️ 1-page modern static website',
                '✔️ Mobile responsive',
                '✔️ Hosting on ReadyFlow subdomain',
                '✔️ 7-day concierge (free edits)',
            ];
            features.forEach(feature => {
                const li = document.createElement('li');
                li.innerHTML = feature;
                if (recommendedPlanFeaturesList) recommendedPlanFeaturesList.appendChild(li);
            });
            if(recommendedPlanBox) recommendedPlanBox.style.display = 'block';
        } else {
            if(recommendedPlanBox) recommendedPlanBox.style.display = 'none';
        }
    }

    function handleBlogUpsellOffer() {
        console.log("Blog Content Upsell: Displaying modal.");
        hidePlanWarningModal();
        showBlogUpsellModal();
        blogUpsellOptions.forEach(option => {
            option.classList.remove('selected');
            const radioInput = option.querySelector('input[type="radio"]');
            if (radioInput) radioInput.checked = false;
        });
        calculateTotalPrice();
    }

    if (blogUpsellSkipBtn) {
        blogUpsellSkipBtn.addEventListener('click', () => {
            console.log("Blog Content Upsell: Skipped.");
            hideBlogUpsellModal();
            customSelections.blogContentUpsell = { selectedPlan: 'none', price: 0 };
            calculateTotalPrice();
            showStep(currentStep + 1);
        });
    }

    if (blogUpsellAddBtn) {
        blogUpsellAddBtn.addEventListener('click', () => {
            const selectedOption = blogUpsellModal.querySelector('input[name="blog-upsell-plan"]:checked');
            if (selectedOption) {
                customSelections.blogContentUpsell.selectedPlan = selectedOption.value;
                customSelections.blogContentUpsell.price = BLOG_UPSELL_PRICING[selectedOption.value];
                console.log("Blog Content Upsell: Added", customSelections.blogContentUpsell);
                hideBlogUpsellModal();
                calculateTotalPrice();
                showStep(currentStep + 1);
            } else {
                alert('Please select a blog content plan or click "No Thanks".');
            }
        });
    }

    blogUpsellOptions.forEach(option => {
        option.addEventListener('click', () => {
            blogUpsellOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            const radioInput = option.querySelector('input[type="radio"]');
            if (radioInput) radioInput.checked = true;
        });
    });


    // --- EVENT LISTENERS ---

    const developWebsiteCardBtn = document.getElementById('develop-website-card')?.querySelector('.select-option-btn');
    if (developWebsiteCardBtn) {
        developWebsiteCardBtn.addEventListener('click', () => {
            console.log('Start Building button clicked.');
            if (mainSelection) mainSelection.classList.add('hidden');
            if (editCodeSection) editCodeSection.classList.add('hidden');
            if (customBuilderSection) customBuilderSection.style.display = 'flex';

            resetCustomBuilderState();
            showStep(1);
        });
    }

    backToSelectionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Back to Options button clicked.');
            if (customBuilderSection) customBuilderSection.style.display = 'none';
            if (editCodeSection) editCodeSection.classList.add('hidden');
            if (mainSelection) mainSelection.classList.remove('hidden');

            resetCustomBuilderState();
        });
    });

    nextStepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log(`Next button clicked. Current step: ${currentStep}`);
            if (validateStep(currentStep)) {
                if (currentStep === 3 && customSelections.websiteType === 'blog') {
                    handleBlogUpsellOffer();
                    return;
                }

                const nextStep = parseInt(btn.dataset.nextStep);
                console.log(`Validation passed. Moving to step: ${nextStep}`);
                if (nextStep === 9) {
                    populateReviewSummary();
                }
                showStep(nextStep);
            } else {
                console.log(`Validation failed for step ${currentStep}`);
            }
        });
    });

    prevStepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStep = parseInt(btn.dataset.prevStep);
            console.log(`Previous button clicked. Current step: ${currentStep}, Target step: ${prevStep}`);
            if (currentStep > 3 && customSelections.websiteType === 'blog' && customSelections.blogContentUpsell.selectedPlan !== 'none') {
                 if (prevStep <= 3) {
                    customSelections.blogContentUpsell = { selectedPlan: 'none', price: 0 };
                    calculateTotalPrice();
                 }
            }
            hidePlanWarningModal();
            hideBlogUpsellModal();
            showStep(prevStep);
        });
    });

    progressSteps.forEach(step => {
        step.addEventListener('click', () => {
            const targetStep = parseInt(step.dataset.step);
            console.log(`Progress step ${targetStep} clicked.`);

            if (targetStep > currentStep && !validateStep(currentStep)) {
                console.log(`Validation failed for current step ${currentStep}. Cannot jump forward.`);
                return;
            }

            if (targetStep > currentStep && currentStep === 3 && customSelections.websiteType === 'blog') {
                handleBlogUpsellOffer();
                return;
            }
            if (targetStep < currentStep && customSelections.websiteType === 'blog' && customSelections.blogContentUpsell.selectedPlan !== 'none' && targetStep <= 3) {
                 customSelections.blogContentUpsell = { selectedPlan: 'none', price: 0 };
                 calculateTotalPrice();
            }

            hidePlanWarningModal();
            hideBlogUpsellModal();
            showStep(targetStep);
        });
    });


    // --- Step-specific event listeners and data capture ---

    // Step 1: Contact Info
    if (businessNameInput) businessNameInput.addEventListener('input', (e) => customSelections.businessName = e.target.value);
    if (businessTypeInput) businessTypeInput.addEventListener('input', (e) => customSelections.businessType = e.target.value);
    if (contactNumberInput) contactNumberInput.addEventListener('input', (e) => customSelections.contactNumber = e.target.value);
    if (contactEmailInput) contactEmailInput.addEventListener('input', (e) => customSelections.contactEmail = e.target.value);

    // Step 2: Plan Selection
    planCards.forEach(card => {
        card.addEventListener('click', () => {
            planCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            customSelections.selectedPlan = card.dataset.plan;
            console.log('Plan selected:', customSelections.selectedPlan);
            calculateTotalPrice();
            if (selectPlanNextBtn) selectPlanNextBtn.classList.remove('hidden');
            applyPlanRestrictions();
        });
    });

    // Step 3: Website Type Selection
    websiteTypeOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('disabled')) {
                alert(`This website type is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                return;
            }
            websiteTypeOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            customSelections.websiteType = option.dataset.type;
            console.log('Website Type selected:', customSelections.websiteType);

            if (customWebsiteTypeInputGroup) {
                if (option.dataset.type === 'custom-type') {
                    customWebsiteTypeInputGroup.classList.remove('hidden');
                    if (customWebsiteTypeDescription) customWebsiteTypeDescription.setAttribute('required', 'true');
                } else {
                    customWebsiteTypeInputGroup.classList.add('hidden');
                    if (customWebsiteTypeDescription) {
                        customWebsiteTypeDescription.removeAttribute('required');
                        customWebsiteTypeDescription.value = '';
                    }
                    customSelections.customWebsiteTypeDescription = '';
                }
            }

            // Removed `pageCountSelection` related visibility toggle here
            // if (pageCountSelection) pageCountSelection.classList.remove('hidden');
            // pageCountOptions.forEach(pc => pc.classList.remove('selected'));
            // customSelections.websitePageCount = ''; // No longer a choice
            applyPlanRestrictions();
            calculateTotalPrice();
        });
    });
    if (customWebsiteTypeDescription) {
        customWebsiteTypeDescription.addEventListener('input', (e) => {
            customSelections.customWebsiteTypeDescription = e.target.value;
        });
    }

    // REMOVED: Step 3: Page Count Selection event listener.
    // pageCountOptions.forEach(option => { ... });


    // Step 4: Color Selection
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            if (swatch.classList.contains('disabled')) {
                alert(`This color option is not available.`);
                return;
            }
            colorSwatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            customSelections.colorScheme.type = swatch.dataset.colorType;
            customSelections.colorScheme.value = swatch.dataset.colorValue;

            if (customColorInputGroup) {
                if (swatch.dataset.colorType === 'custom') {
                    customColorInputGroup.classList.remove('hidden');
                    if (customColorDescription) customColorDescription.setAttribute('required', 'true');
                } else {
                    customColorInputGroup.classList.add('hidden');
                    if (customColorDescription) {
                        customColorDescription.removeAttribute('required');
                        customColorDescription.value = '';
                    }
                    customSelections.customColorDescription = '';
                }
            }
            calculateTotalPrice();
        });
    });
    if (customColorDescription) {
        customColorDescription.addEventListener('input', (e) => {
            customSelections.customColorDescription = e.target.value;
        });
    }

    // Step 5: Button Shape & Effect
    buttonShapeOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('disabled')) {
                alert(`This button shape is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                return;
            }
            buttonShapeOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            customSelections.buttonShape = option.dataset.shape;

            if (customButtonShapeInputGroup) {
                if (option.dataset.shape === 'custom-shape') {
                    customButtonShapeInputGroup.classList.remove('hidden');
                    if (customButtonShapeDescription) customButtonShapeDescription.setAttribute('required', 'true');
                } else {
                    customButtonShapeInputGroup.classList.add('hidden');
                    if (customButtonShapeDescription) {
                        customButtonShapeDescription.removeAttribute('required');
                        customButtonShapeDescription.value = '';
                    }
                    customSelections.customButtonShapeDescription = '';
                }
            }
            calculateTotalPrice();
        });
    });
    if (customButtonShapeDescription) {
        customButtonShapeDescription.addEventListener('input', (e) => {
            customSelections.customButtonShapeDescription = e.target.value;
        });
    }

    buttonEffectOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('disabled')) {
                alert(`This button effect is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                return;
            }
            buttonEffectOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            customSelections.buttonEffect = option.dataset.effect;

            if (customButtonEffectInputGroup) {
                if (option.dataset.effect === 'custom-effect') {
                    customButtonEffectInputGroup.classList.remove('hidden');
                    if (customButtonEffectDescription) customButtonEffectDescription.setAttribute('required', 'true');
                } else {
                    customButtonEffectInputGroup.classList.add('hidden');
                    if (customButtonEffectDescription) {
                        customButtonEffectDescription.removeAttribute('required');
                        customButtonEffectDescription.value = '';
                    }
                    customSelections.customButtonEffectDescription = '';
                }
            }
            calculateTotalPrice();
        });
    });
    if (customButtonEffectDescription) {
        customButtonEffectDescription.addEventListener('input', (e) => {
            customSelections.customButtonEffectDescription = e.target.value;
        });
    }

    // Step 6: Website Sections (General Sections & Advanced Effects)
    const allSectionAndEffectOptions = [...sectionOptions, ...advancedEffectOptions];

    allSectionAndEffectOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('disabled')) {
                alert(`This section/effect is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                return;
            }
            const sectionValue = option.dataset.section;

            option.classList.toggle('selected');

            if (option.classList.contains('selected')) {
                if (!customSelections.websiteSections.includes(sectionValue)) {
                    customSelections.websiteSections.push(sectionValue);
                }
            } else {
                customSelections.websiteSections = customSelections.websiteSections.filter(s => s !== sectionValue);
            }

            const isCustomSectionSelected = customSelections.websiteSections.includes('custom-section');
            const isCustomAnimationSelected = customSelections.websiteSections.includes('effect-custom-animation');

            if (customSectionInputGroup) {
                if (isCustomSectionSelected || isCustomAnimationSelected) {
                    customSectionInputGroup.classList.remove('hidden');
                    if (customSectionDescription) customSectionDescription.setAttribute('required', 'true');
                } else {
                    customSectionInputGroup.classList.add('hidden');
                    if (customSectionDescription) {
                        customSectionDescription.removeAttribute('required');
                        customSectionDescription.value = '';
                    }
                    customSelections.customSectionDescription = '';
                }
            }
            calculateTotalPrice();
        });
    });

    if (customSectionDescription) {
        customSectionDescription.addEventListener('input', (e) => {
            customSelections.customSectionDescription = e.target.value;
        });
    }


    // Step 7: Image Display Style
    imageDisplayOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('disabled')) {
                alert(`This image display style is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                return;
            }
            imageDisplayOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            customSelections.imageDisplay = option.dataset.imageStyle;

            if (customImageStyleInputGroup) {
                if (option.dataset.imageStyle === 'custom-image-style') {
                    customImageStyleInputGroup.classList.remove('hidden');
                    if (customImageStyleDescription) customImageStyleDescription.setAttribute('required', 'true');
                } else {
                    customImageStyleInputGroup.classList.add('hidden');
                    if (customImageStyleDescription) {
                        customImageStyleDescription.removeAttribute('required');
                        customImageStyleDescription.value = '';
                    }
                    customSelections.customImageStyleDescription = '';
                }
            }
            calculateTotalPrice();
        });
    });
    if (customImageStyleDescription) {
        customImageStyleDescription.addEventListener('input', (e) => {
            customSelections.customImageStyleDescription = e.target.value;
        });
    }

    // Step 8: Font Selection
    fontOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('disabled')) {
                alert(`This font option is not available in the ${customSelections.selectedPlan === 'basic' ? 'Basic' : 'Growth'} plan.`);
                return;
            }
            fontOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            customSelections.fontPairing = option.dataset.font;

            if (customFontInputGroup) {
                if (option.dataset.font === 'custom-font') {
                    customFontInputGroup.classList.remove('hidden');
                    if (customFontDescription) customFontDescription.setAttribute('required', 'true');
                } else {
                    customFontInputGroup.classList.add('hidden');
                    if (customFontDescription) {
                        customFontDescription.removeAttribute('required');
                        customFontDescription.value = '';
                    }
                    customSelections.customFontDescription = '';
                }
            }
            calculateTotalPrice();
        });
    });
    if (customFontDescription) {
        customFontDescription.addEventListener('input', (e) => {
            customSelections.customFontDescription = e.target.value;
        });
    }

    // Custom Domain Setup Checkbox (now on Step 9)
    if (customDomainSetupCheckbox) {
        customDomainSetupCheckbox.addEventListener('change', (e) => {
            customSelections.customDomainSetup = e.target.checked;
            calculateTotalPrice();
            populateReviewSummary();
        });
    }

    // Step 9: Proceed to Payment / Firebase Submission
    if (proceedToPaymentBtn) {
        proceedToPaymentBtn.addEventListener('click', async () => {
            console.log('Proceed to Payment button clicked.');
            let allStepsValid = true;
            for (let i = 1; i < 9; i++) {
                if (!validateStep(i)) {
                    allStepsValid = false;
                    showStep(i);
                    return;
                }
            }

            if (!allStepsValid) {
                return;
            }

            if (proceedToPaymentBtn) {
                proceedToPaymentBtn.disabled = true;
                proceedToPaymentBtn.textContent = 'Requesting Code Generation...';
                proceedToPaymentBtn.classList.add('loading');
            }

            try {
                const codeGenerationCollection = collection(db, "codeGenerationRequests");
                const userId = auth.currentUser ? auth.currentUser.uid : 'guest';

                const requestData = {
                    userId: userId,
                    timestamp: serverTimestamp(),
                    customerInfo: {
                        businessName: businessNameInput ? businessNameInput.value : '',
                        businessType: businessTypeInput ? businessTypeInput.value : '',
                        contactNumber: contactNumberInput ? contactNumberInput.value : '',
                        contactEmail: contactEmailInput ? contactEmailInput.value : ''
                    },
                    designChoices: {
                        selectedPlan: customSelections.selectedPlan,
                        websiteType: customSelections.websiteType,
                        websitePageCount: customSelections.websitePageCount, // Will be '1'
                        ...(customSelections.websiteType === 'custom-type' && customSelections.customWebsiteTypeDescription ? { customWebsiteTypeDescription: customSelections.customWebsiteTypeDescription } : {}),

                        colorScheme: customSelections.colorScheme,
                        ...(customSelections.colorScheme.type === 'custom' && customSelections.customColorDescription ? { customColorDescription: customSelections.customColorDescription } : {}),

                        buttonShape: customSelections.buttonShape,
                        ...(customSelections.buttonShape === 'custom-shape' && customSelections.customButtonShapeDescription ? { customButtonShapeDescription: customSelections.customButtonShapeDescription } : {}),

                        buttonEffect: customSelections.buttonEffect,
                        ...(customSelections.buttonEffect === 'custom-effect' && customSelections.customButtonEffectDescription ? { customButtonEffectDescription: customSelections.customButtonEffectDescription } : {}),

                        websiteSections: customSelections.websiteSections,
                        ...((customSelections.websiteSections.includes('custom-section') || customSelections.websiteSections.includes('effect-custom-animation')) && customSelections.customSectionDescription ? { customSectionDescription: customSelections.customSectionDescription } : {}),

                        imageDisplay: customSelections.imageDisplay,
                        ...(customSelections.imageDisplay === 'custom-image-style' && customSelections.customImageStyleDescription ? { customImageStyleDescription: customSelections.customImageStyleDescription } : {}),

                        fontPairing: customSelections.fontPairing,
                        ...(customSelections.fontPairing === 'custom-font' && customSelections.customFontDescription ? { customFontDescription: customSelections.customFontDescription } : {}),

                        customDomainSetup: customSelections.customDomainSetup,
                        blogContentUpsell: customSelections.blogContentUpsell
                    },
                    estimatedPrice: customSelections.estimatedPrice,
                    status: 'pending-code-generation',
                    generatedHtmlUrl: null,
                    generatedCssUrl: null,
                    generatedJsUrl: null,
                    redoAttempts: 2
                };

                const docRef = await addDoc(codeGenerationCollection, requestData);
                const requestId = docRef.id;
                console.log('Request submitted to Firestore with ID:', requestId);

                window.location.href = `/pages/generated-code-preview.html?id=${requestId}`;

            } catch (error) {
                console.error("Error submitting custom request for code generation: ", error);
                alert("There was an error submitting your request. Please try again. " + error.message);
                if (proceedToPaymentBtn) {
                    proceedToPaymentBtn.disabled = false;
                    proceedToPaymentBtn.textContent = 'Proceed to Payment';
                    proceedToPaymentBtn.classList.remove('loading');
                }
            }
        });
    }

    // --- INITIALIZATION ---
    function resetCustomBuilderState() {
        console.log('resetCustomBuilderState called.');
        currentStep = 1;
        customSelections = {
            businessName: '',
            businessType: '',
            contactNumber: '',
            contactEmail: '',
            selectedPlan: '',
            websiteType: '',
            websitePageCount: '1', // Fixed to 1 page
            customWebsiteTypeDescription: '',
            colorScheme: { type: '', value: '' },
            customColorDescription: '',
            buttonShape: '',
            customButtonShapeDescription: '',
            buttonEffect: '',
            customButtonEffectDescription: '',
            websiteSections: [],
            customSectionDescription: '',
            imageDisplay: '',
            customImageStyleDescription: '',
            fontPairing: '',
            customFontDescription: '',
            customDomainSetup: false,
            blogContentUpsell: { selectedPlan: 'none', price: 0 },
            estimatedPrice: 0,
        };

        // Reset all input fields and selections
        if (businessNameInput) businessNameInput.value = '';
        if (businessTypeInput) businessTypeInput.value = '';
        if (contactNumberInput) contactNumberInput.value = '';
        if (contactEmailInput) contactEmailInput.value = '';
        if (customDomainSetupCheckbox) customDomainSetupCheckbox.checked = false;

        planCards.forEach(card => card.classList.remove('selected'));
        if (selectPlanNextBtn) selectPlanNextBtn.classList.add('hidden');

        // Reset website type options
        websiteTypeOptions.forEach(option => option.classList.remove('selected', 'disabled'));
        // REMOVED: Reset page count options and hide section
        // pageCountOptions.forEach(option => option.classList.remove('selected', 'disabled'));
        // if (pageCountSelection) pageCountSelection.classList.add('hidden');

        colorSwatches.forEach(swatch => swatch.classList.remove('selected', 'disabled'));

        buttonShapeOptions.forEach(option => option.classList.remove('selected', 'disabled'));
        buttonEffectOptions.forEach(option => option.classList.remove('selected', 'disabled'));
        sectionOptions.forEach(option => option.classList.remove('selected', 'disabled'));
        advancedEffectOptions.forEach(option => option.classList.remove('selected', 'disabled'));

        imageDisplayOptions.forEach(option => option.classList.remove('selected', 'disabled'));
        fontOptions.forEach(option => option.classList.remove('selected', 'disabled'));

        // Hide and clear all custom description text areas
        document.querySelectorAll('textarea[id$="-description"]').forEach(textarea => {
            const parentGroup = textarea.closest('.input-group');
            if (parentGroup) {
                parentGroup.classList.add('hidden');
                textarea.value = '';
                textarea.removeAttribute('required');
            }
        });

        // Reset review summary fields
        populateReviewSummary();
        if (reviewBlogUpsellSummary) reviewBlogUpsellSummary.classList.add('hidden');

        calculateTotalPrice();
        updateProgressBar();

        if(recommendedPlanBox) recommendedPlanBox.style.display = 'none';
        hidePlanWarningModal();
        hideBlogUpsellModal();

        formSteps.forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });
        console.log('resetCustomBuilderState finished.');
    }

    // Plan Warning Modal button listeners
    if (modalDowngradeSectionsBtn) {
        modalDowngradeSectionsBtn.addEventListener('click', () => {
            hidePlanWarningModal();
            alert(`Please deselect sections to fit the Basic Plan limit of ${planFeatureLimits.basic.maxIncludedSections} sections.`);
            showStep(6);
        });
    }

    if (modalUpgradePlanBtn) {
        modalUpgradePlan.addEventListener('click', () => {
            hidePlanWarningModal();
            const growthPlanCard = document.querySelector('.plan-card[data-plan="growth"]');
            if (growthPlanCard) {
                growthPlanCard.click();
                showStep(currentStep + 1);
            }
        });
    }

    // Initial setup: Hide the builder section on load.
    if (customBuilderSection) {
        customBuilderSection.style.display = 'none';
    }
    if (editCodeSection) {
        editCodeSection.classList.add('hidden');
    }
    resetCustomBuilderState();
});