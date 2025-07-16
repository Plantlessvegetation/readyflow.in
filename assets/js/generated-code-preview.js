// assets/js/generated-code-preview.js

import { db } from './login.js'; // Import db from your Firebase config
import { doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loadingState = document.getElementById('loading-state');
    const generatedCodeDisplay = document.getElementById('generated-code-display');
    const errorState = document.getElementById('error-state');

    const downloadHtmlBtn = document.getElementById('download-html-btn');
    const downloadCssBtn = document.getElementById('download-css-btn');
    const downloadJsBtn = document.getElementById('download-js-btn');
    // const downloadZipBtn = document.getElementById('download-zip-btn'); // For future ZIP download

    const looksGoodBtn = document.getElementById('looks-good-btn');

    // NEW: Modal Elements
    const successModal = document.getElementById('success-prompt-modal');
    const successModalCloseBtn = document.getElementById('success-modal-close-btn');
    const returnHomeBtn = document.getElementById('return-home-btn');
    const successModalMessage = document.getElementById('success-modal-message');

    let currentRequestId = null;

    const urlParams = new URLSearchParams(window.location.search);
    currentRequestId = urlParams.get('id');

    if (!currentRequestId) {
        loadingState.style.display = 'none';
        generatedCodeDisplay.style.display = 'none';
        errorState.style.display = 'flex';
        console.error("No request ID found in URL for code generation preview.");
        return;
    }

    // Set up a real-time listener for the specific request document in 'codeGenerationRequests'
    const requestDocRef = doc(db, 'codeGenerationRequests', currentRequestId);

    const unsubscribe = onSnapshot(requestDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Real-time code generation update received:", data);

            if (data.status === 'code-generated' && data.generatedHtmlUrl && data.generatedCssUrl && data.generatedJsUrl) {
                // Code is ready!
                loadingState.style.display = 'none';
                errorState.style.display = 'none';

                downloadHtmlBtn.href = data.generatedHtmlUrl;
                downloadCssBtn.href = data.generatedCssUrl;
                downloadJsBtn.href = data.generatedJsUrl;

                generatedCodeDisplay.style.display = 'flex'; // Show the download links and buttons

                // Ensure looks good button is enabled
                looksGoodBtn.disabled = false;

                // Stop listening once the code is received
                unsubscribe();

            } else if (data.status === 'failed') {
                // Generation failed
                loadingState.style.display = 'none';
                generatedCodeDisplay.style.display = 'none';
                errorState.style.display = 'flex';
                console.error("AI code generation failed for request:", currentRequestId, data.errorMessage);
                // Optionally show a more specific error message from data.errorMessage
            } else if (data.status === 'pending-code-generation' || data.status === 'processing') {
                // Still pending, keep loading state
                console.log("AI code generation is still in progress...");
                loadingState.style.display = 'flex';
                generatedCodeDisplay.style.display = 'none';
                errorState.style.display = 'none';
                // Disable looks good button while generating
                looksGoodBtn.disabled = true;
            } else if (data.status === 'pending-code-generation-redo') { // Still pending after a re-do trigger
                console.log("AI code re-generation is in progress...");
                loadingState.style.display = 'flex';
                generatedCodeDisplay.style.display = 'none';
                errorState.style.display = 'none';
                looksGoodBtn.disabled = true;
            }
        } else {
            // Document does not exist or was deleted (shouldn't happen normally)
            loadingState.style.display = 'none';
            generatedCodeDisplay.style.display = 'none';
            errorState.style.display = 'flex';
            console.error("Request document not found:", currentRequestId);
        }
    }, (error) => {
        console.error("Error listening to document:", error);
        loadingState.style.display = 'none';
        generatedCodeDisplay.style.display = 'none';
        errorState.style.display = 'flex';
    });

    // NEW: Modal functions
    function showSuccessModal() {
        if (successModal) {
            successModal.classList.add('show');
        }
    }

    function hideSuccessModal() {
        if (successModal) {
            successModal.classList.remove('show');
        }
    }

    // --- Button Actions ---
    if (looksGoodBtn) {
        looksGoodBtn.addEventListener('click', async () => {
            showSuccessModal();
        });
    }

    // NEW: Event listener for 'Return to Home' button
    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', async () => {
            try {
                // Update status to indicate user has seen/acknowledged
                await updateDoc(requestDocRef, { status: 'user-acknowledged-preview' });
                hideSuccessModal(); // Hide modal before redirecting
                window.location.href = '/index.html'; // Redirect to home or a thank you page
            } catch (error) {
                // MODIFIED: Log the full error object for detailed debugging
                console.error("Error finalizing request (updating status or redirecting):", error);
                alert("Could not finalize your request. Please check the console for details or try again. " + error.message);
            }
        });
    }

    // NEW: Close modal button (optional, if you want users to just close the pop-up without going home)
    if (successModalCloseBtn) {
        successModalCloseBtn.addEventListener('click', hideSuccessModal);
    }

    // NEW: Close modal if clicking outside content (optional)
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                hideSuccessModal();
            }
        });
    }
});