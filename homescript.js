// --- Cat eye tracking ---
// Each eye computes its own angle to the cursor independently.
(() => {
    const DEADZONE = 6;
    const RAMP = 50;
    const MAX = 4;

    const eyes = Array.from(document.querySelectorAll('.eye'));
    eyes.forEach(eye => {
        eye.style.transition = 'transform 40ms linear';
        eye.style.willChange = 'transform';
    });

    document.addEventListener('mousemove', (e) => {
        for (const eye of eyes) {
            const rect = eye.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy);

            if (dist <= DEADZONE) {
                eye.style.transform = 'translate(0px, 0px)';
                continue;
            }

            const t = Math.min((dist - DEADZONE) / RAMP, 1);
            const eased = t * t * (3 - 2 * t);
            const travel = eased * MAX;

            const nx = dx / dist;
            const ny = dy / dist;
            eye.style.transform = `translate(${nx * travel}px, ${ny * travel}px)`;
        }
    });
})();

// --- Year stamp ---
(() => {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
})();

// --- Reveal on scroll ---
(() => {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach(el => io.observe(el));
})();

// --- Drifting particles (fireflies / embers) ---
(() => {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    const COUNT_DESKTOP = 70;
    const COUNT_MOBILE = 32;

    function resize() {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const target = w < 720 ? COUNT_MOBILE : COUNT_DESKTOP;
        if (particles.length !== target) {
            particles = Array.from({ length: target }, makeParticle);
        }
    }

    function makeParticle() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            r: 0.6 + Math.random() * 1.6,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.05 - Math.random() * 0.25,
            phase: Math.random() * Math.PI * 2,
            speed: 0.005 + Math.random() * 0.012,
            hue: Math.random() < 0.7 ? 'gold' : 'sage'
        };
    }

    function step() {
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.phase += p.speed;
            if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            const flicker = 0.5 + 0.5 * Math.sin(p.phase);
            const color = p.hue === 'gold'
                ? `rgba(214, 178, 95, ${0.25 + flicker * 0.55})`
                : `rgba(144, 184, 138, ${0.18 + flicker * 0.45})`;
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.arc(p.x, p.y, p.r * (0.9 + flicker * 0.4), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        if (!reduced) requestAnimationFrame(step);
    }

    window.addEventListener('resize', resize);
    resize();
    if (reduced) {
        step();
    } else {
        requestAnimationFrame(step);
    }
})();
