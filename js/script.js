document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Mobile Navigation Toggle ---
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navMenu = document.getElementById('navMenu');

    hamburgerMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburgerMenu.classList.toggle('active');
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    });

    // --- 2. Smooth Scrolling & Navbar Active State ---
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('main section'); // Select only main content sections
    const navLinks = document.querySelectorAll('.nav-link');

    // Dynamic Navbar on Scroll - NEW
    function handleScrollNavbar() {
        if (window.scrollY > 50) { // Add 'scrolled' class after scrolling down 50px
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    function updateActiveNavLink() {
        let currentActiveSectionId = '';
        // Calculate current scroll position relative to top, adjusting for navbar height
        const scrollPos = window.scrollY + navbar.offsetHeight + 10; // +10px buffer

        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < (section.offsetTop + section.offsetHeight)) {
                currentActiveSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            // Check if the link's href matches the current active section ID
            if (link.getAttribute('href').substring(1) === currentActiveSectionId) {
                link.classList.add('active');
            }
        });
    }

    // Update active state on scroll AND handle dynamic navbar
    window.addEventListener('scroll', () => {
        updateActiveNavLink();
        handleScrollNavbar(); // Call dynamic navbar function on scroll
    });
    // Initial update on page load
    updateActiveNavLink();
    handleScrollNavbar(); // Call dynamic navbar function on load


    // Smooth scroll for internal links using native scrollIntoView
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Use native smooth scroll with offset
                const offset = navbar.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });


    // --- 3. Simple CSS Scroll Animations (using Intersection Observer) ---
    const animateOnScrollElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Remove observer for elements that should only animate once
                // Unless you want them to re-animate if they go out of view and come back
                // For a single-fire animation: observer.unobserve(entry.target);
            }
            // If you want animation to reverse when out of view, remove this line:
            // else { entry.target.classList.remove('is-visible'); }
        });
    }, {
        threshold: 0.2 // Trigger when 20% of the element is visible
    });

    animateOnScrollElements.forEach(element => {
        observer.observe(element);
    });


    // --- 4. FAQ Accordion ---
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isActive = header.classList.contains('active');

            // Close all other active accordions
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                    otherHeader.nextElementSibling.style.paddingTop = '0';
                    otherHeader.nextElementSibling.style.paddingBottom = '0';
                }
            });

            // Toggle current accordion
            if (isActive) {
                header.classList.remove('active');
                content.classList.remove('active');
                content.style.maxHeight = null; // Collapse
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
            } else {
                header.classList.add('active');
                content.classList.add('active');
                // Set max-height to scrollHeight to allow smooth transition, plus padding
                content.style.maxHeight = content.scrollHeight + 30 + 'px'; // +30 for 1rem top/1.5rem bottom padding
                content.style.paddingTop = '1rem';
                content.style.paddingBottom = '1.5rem';
            }
        });
    });

});
