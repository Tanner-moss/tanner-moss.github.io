document.addEventListener('mousemove', (e) => {
    const eyes = document.querySelectorAll('.eye');
    const smiley = document.querySelector('.smiley');
    const smileyRect = smiley.getBoundingClientRect();

    const smileyCenterX = smileyRect.left + smileyRect.width / 2;
    const smileyCenterY = smileyRect.top + smileyRect.height / 2;

    const angle = Math.atan2(e.clientY - smileyCenterY, e.clientX - smileyCenterX);

    eyes.forEach(eye => {
        const eyeX = Math.cos(angle) * 4;
        const eyeY = Math.sin(angle) * 4;

        eye.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
    });
});

// tabscript.js

function scrollToTab(index) {
    // Get the scroll container and calculate scroll position based on the tab index
    const scrollContainer = document.querySelector('.scroll-container');
    const contentWidth = scrollContainer.clientWidth;
    const scrollPosition = contentWidth * index;

    // Hide all content and show only the selected content
    const contents = document.querySelectorAll('.content');
    contents.forEach((content, i) => {
        if (i === index) {
            content.classList.add('active');  // Show this content
        } else {
            content.classList.remove('active'); // Hide other content
        }
    });

    // Move the slider to the selected tab
    const slider = document.querySelector('.slider');
    slider.style.transform = `translateX(${index * 100}%)`;

    // Optional: scroll the container smoothly to the selected content (if you still want scrolling)
    scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
}




