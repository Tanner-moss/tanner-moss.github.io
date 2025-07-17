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





