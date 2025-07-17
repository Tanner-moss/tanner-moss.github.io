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

    const paw1 = document.querySelector('.paw1');
    if (paw1) {
        const pawRect = paw1.getBoundingClientRect();
        const pawCenterX = pawRect.left + pawRect.width / 2;
        const pawCenterY = pawRect.top + pawRect.height / 2;

        const deltaX = e.clientX - pawCenterX;
        const deltaY = e.clientY - pawCenterY;

        const maxDistance = 50;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let pawX = deltaX;
        let pawY = deltaY;
        
        if (distance > maxDistance) {
            pawX = (deltaX / distance) * maxDistance;
            pawY = (deltaY / distance) * maxDistance;
        }

        paw1.style.transform = `translate(${pawX}px, ${pawY}px)`;
    }
});





