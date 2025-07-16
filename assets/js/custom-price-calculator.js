// This script powers the interactive price calculator on the Custom Development page,
// now primarily adapted for 'Edit Existing Code' functionality.
// The 'Develop a Website' functionality is now handled by custom-development-builder.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('custom-price-calculator.js loaded and DOMContentLoaded fired.');

    // --- MAIN SELECTION ELEMENTS ---
    const mainSelection = document.getElementById('main-selection');
    const editCodeSection = document.getElementById('edit-code-section');
    const customBuilderSection = document.getElementById('custom-builder-section'); // Ensure this is also referenced

    // Selectors for the main entry points for "Develop a Website" and "Edit Existing Code"
    const developWebsiteCardBtn = document.getElementById('develop-website-card')?.querySelector('.select-option-btn');
    const editCodeCardBtn = document.getElementById('edit-code-card')?.querySelector('.select-option-btn');

    const backToSelectionBtns = document.querySelectorAll('.back-to-selection-btn'); // For back to main two cards


    // --- EDIT EXISTING CODE CALCULATOR ELEMENTS ---
    const editCodeForm = editCodeSection ? editCodeSection.querySelector('.edit-code-form') : null;
    const editOptions = editCodeSection ? editCodeSection.querySelectorAll('.edit-options-grid .option-box') : [];
    const fileUploadInput = document.getElementById('code-upload-input');
    const fileUploadStatus = document.getElementById('file-upload-status');
    const editPriceDisplay = document.getElementById('edit-estimated-price');


    // --- STATE ---
    let editSelections = {
        edits: [],
        uploadedFiles: []
    };

    // --- UTILITY FUNCTIONS ---
    function formatPrice(price) {
        return `₹${price.toLocaleString('en-IN')}`;
    }

    // Function to manage section visibility
    // IMPORTANT: This function's role is to toggle between the main selection, custom builder, and edit code sections.
    // It should be the single source of truth for these high-level display changes.
    function showSection(sectionToShowElement) {
        // Hide all main sections first
        if (mainSelection) mainSelection.classList.add('hidden');
        if (editCodeSection) editCodeSection.classList.add('hidden');
        if (customBuilderSection) customBuilderSection.style.display = 'none'; // Use style.display for customBuilderSection as it uses flex

        // Show the desired section
        if (sectionToShowElement === customBuilderSection) {
            sectionToShowElement.style.display = 'flex'; // It's a flex container
        } else if (sectionToShowElement) {
            sectionToShowElement.classList.remove('hidden');
        }
    }


    function resetEditForm() {
        editSelections = {
            edits: [],
            uploadedFiles: []
        };

        editOptions.forEach(box => box.classList.remove('selected'));
        if (fileUploadInput) fileUploadInput.value = '';
        if (fileUploadStatus) fileUploadStatus.textContent = 'No files chosen';
        calculateEditPrice();
    }


    // --- EDIT EXISTING CODE LOGIC ---
    function calculateEditPrice() {
        let total = 0;
        editSelections.edits.forEach(editValue => {
            const selectedBox = Array.from(editOptions).find(box => box.dataset.value === editValue);
            if (selectedBox) {
                total += parseFloat(selectedBox.dataset.price) || 0;
            }
        });
        if (editPriceDisplay) editPriceDisplay.textContent = formatPrice(total);
    }

    function handleEditOptionClick() {
        editOptions.forEach(box => {
            box.addEventListener('click', () => {
                const value = box.dataset.value;
                const isSelected = box.classList.contains('selected');

                const bundles = ['quick-fix-pack', 'starter-boost', 'visual-refresh-pack', 'power-update-pack', 'full-custom-refresh'];

                if (bundles.includes(value)) {
                    if (!isSelected) {
                        // If selecting a bundle, deselect all other options (individual edits and other bundles)
                        editOptions.forEach(otherBox => {
                            if (otherBox !== box && otherBox.classList.contains('selected')) {
                                otherBox.classList.remove('selected');
                                editSelections.edits = editSelections.edits.filter(item => item !== otherBox.dataset.value);
                            }
                        });
                        editSelections.edits = [value]; // Only this bundle should be selected
                    } else {
                        // If deselecting the bundle, remove it from selections
                        editSelections.edits = editSelections.edits.filter(item => item !== value);
                    }
                } else { // Individual edit clicked
                    if (!isSelected) {
                        // If selecting an individual edit, deselect any currently active bundle
                        editOptions.forEach(otherBox => {
                            if (bundles.includes(otherBox.dataset.value) && otherBox.classList.contains('selected')) {
                                otherBox.classList.remove('selected');
                                editSelections.edits = editSelections.edits.filter(item => item !== otherBox.dataset.value);
                            }
                        });
                        editSelections.edits.push(value); // Add the individual edit
                    } else {
                        // If deselecting an individual edit, remove it from selections
                        editSelections.edits = editSelections.edits.filter(item => item !== value);
                    }
                }

                box.classList.toggle('selected');
                calculateEditPrice();
            });
        });
    }


    // --- EVENT LISTENERS ---

    // Event listener for "Edit Existing Code" button on main selection
    if (editCodeCardBtn) {
        editCodeCardBtn.addEventListener('click', () => {
            console.log('Edit Existing Code button clicked in custom-price-calculator.js');
            showSection(editCodeSection); // Show the edit code section
            resetEditForm(); // Reset form state for a fresh start
        });
    }

    // "Back to Options" buttons (specifically for the Edit Code section)
    backToSelectionBtns.forEach(btn => {
        // This targets *all* back buttons. The one in custom-builder.js also exists.
        // Ensure this specific handler only fires when it's the correct "Back" button for the edit section.
        // It's already handled in custom-development-builder.js to reset *its* state.
        // Here, we ensure this particular listener just controls visibility for edit section.
        btn.addEventListener('click', () => {
            // Check if the current visible section is the editCodeSection before resetting its form
            if (!editCodeSection.classList.contains('hidden')) {
                console.log('Back to Options button clicked from Edit Code section.');
                showSection(mainSelection); // Show main selection cards
                resetEditForm(); // Reset edit form only when coming back from edit section
            }
        });
    });

    // Initialize Edit Existing Code specific listeners
    if (editCodeForm) {
        handleEditOptionClick(); // Initialize click handlers for edit options

        if (fileUploadInput) {
            fileUploadInput.addEventListener('change', () => {
                if (fileUploadInput.files.length > 0) {
                    fileUploadStatus.textContent = `${fileUploadInput.files.length} file(s) selected.`;
                    editSelections.uploadedFiles = Array.from(fileUploadInput.files).map(file => file.name);
                } else {
                    fileUploadStatus.textContent = 'No files chosen';
                    editSelections.uploadedFiles = [];
                }
            });
        }
    }

    // --- INITIALIZATION ---
    // This script should *not* control the initial display of the custom-builder-section.
    // The custom-development-builder.js will handle its display upon its own 'Start Building' click.
    // This script's primary role is to ensure the "Edit Existing Code" section is functional when activated.

    // Ensure initial state for 'editCodeSection' is hidden on page load,
    // and its price calculator is reset.
    if (editCodeSection) {
        editCodeSection.classList.add('hidden');
        resetEditForm(); // Ensure edit price is 0 initially on page load
    }

    // Note: The visibility of 'mainSelection' and 'customBuilderSection'
    // on initial load is now coordinated by the interaction from either
    // custom-development-builder.js or this file's main button listeners.
    // It's crucial that `custom-development-builder.js` also ensures
    // `editCodeSection` is hidden when it activates, and vice-versa.
});