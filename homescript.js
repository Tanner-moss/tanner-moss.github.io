// --- Cat eye tracking ---
// Each eye computes its own angle to the cursor, so a cursor placed
// between the two eyes still gets a sensible look direction from each
// eye independently (no center-point glitch).
//
// Stability:
//   - DEADZONE: within this radius of the eye center the pupil stays
//     centered. Prevents jitter when the cursor is on or near the eye.
//   - RAMP: between deadzone and full-travel distance, the eye eases
//     out smoothly so it doesn't snap. Past RAMP, the pupil sits at
//     full travel and just rotates around the cursor angle.
//   - CSS transition (added below) smooths the last 1-2 px of motion
//     so micro mouse movements don't read as twitching.
(() => {
    const DEADZONE = 6;  // px around eye center where pupil stays put
    const RAMP = 50;     // px over which travel ramps from 0 to MAX
    const MAX = 4;       // pupil travel radius (matches original feel)

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

            // Ease the travel amount from 0 (at DEADZONE) up to MAX
            // (at DEADZONE + RAMP). Beyond that, hold MAX.
            const t = Math.min((dist - DEADZONE) / RAMP, 1);
            const eased = t * t * (3 - 2 * t); // smoothstep
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
        // single static frame
        step();
    } else {
        requestAnimationFrame(step);
    }
})();

// --- Legacy: tabscript.js (no longer used; kept harmless) ---

function scrollToTab(index) {
    // Get the scroll container and calculate scroll position based on the tab index
    const scrollContainer = document.querySelector('.scroll-container');
    if (!scrollContainer) return;
    const contentWidth = scrollContainer.clientWidth;
    const scrollPosition = contentWidth * index;

    // Hide all content and show only the selected content
    const contents = document.querySelectorAll('.content');
    contents.forEach((content, i) => {
        if (i === index) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    const slider = document.querySelector('.slider');
    if (slider) slider.style.transform = `translateX(${index * 100}%)`;

    scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
}

// --- Cat mischief: swipe and steal the cursor ---
// If the user holds the cursor still close to the cat, the cat reaches
// out a paw, drags the cursor in, and pins it. The real cursor is
// hidden during the steal and a fake SVG cursor is animated instead.
// If the user moves the cursor in fast (high velocity) toward the cat,
// the cat takes a quick swipe at it but does not steal it. Any mouse
// movement after a steal releases the cursor back to the user.
//
// Notes:
//   - Real cursor is only hidden during STEAL state, never during SWIPE.
//   - Touch devices skip this behavior entirely.
//   - prefers-reduced-motion disables it as well.
(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (reduced || isTouch) return;

    const cat = document.querySelector('.cat');
    if (!cat) return;

    // Tunables
    const PROXIMITY = 170;        // px from cat center where cat is "interested"
    const IDLE_MS = 1100;         // hold mouse still this long near cat -> steal
    const SWIPE_VELOCITY = 1.6;   // px/ms approaching cat -> swipe
    const STEAL_HOLD_MS = 900;    // pin cursor in paw this long after steal
    const RELEASE_MOVE = 18;      // px of mouse movement to release a steal

    // State
    let lastX = -9999, lastY = -9999;
    let lastT = performance.now();
    let lastMoveT = lastT;
    let prevDist = Infinity;
    let mode = 'idle'; // 'idle' | 'swipe' | 'stealing' | 'pinned'
    let pinnedUntil = 0;
    let stealStartX = 0, stealStartY = 0;
    let stealAnimStart = 0;
    let stealAnimDur = 600;
    let releaseAccum = 0;
    let pawHideTimer = null;

    // Build paw element
    const paw = document.createElement('div');
    paw.className = 'cat-paw';
    paw.innerHTML = `
        <div class="cat-paw-arm"></div>
        <div class="cat-paw-pad">
            <span class="bean main"></span>
            <span class="bean t1"></span>
            <span class="bean t2"></span>
            <span class="bean t3"></span>
            <span class="bean t4"></span>
        </div>
    `;
    document.body.appendChild(paw);

    // Build fake cursor (default arrow look)
    const fakeCursor = document.createElement('div');
    fakeCursor.className = 'fake-cursor';
    fakeCursor.innerHTML = `
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
            <path d="M2 1 L2 17 L6 13 L9 20 L12 19 L9 12 L15 12 Z"
                  fill="#ffffff" stroke="#000000" stroke-width="1.2"
                  stroke-linejoin="round"/>
        </svg>`;
    document.body.appendChild(fakeCursor);

    function pawAnchor() {
        // Where the paw originates from (top-right corner of cat box,
        // since cat sits in bottom-left of viewport).
        const r = cat.getBoundingClientRect();
        return { x: r.left + r.width * 0.78, y: r.top + r.height * 0.20 };
    }

    function showPaw(x, y, rot = 0) {
        clearTimeout(pawHideTimer);
        const anchor = pawAnchor();
        const dx = x - anchor.x;
        const dy = y - anchor.y;
        const len = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        paw.style.left = anchor.x + 'px';
        paw.style.top = anchor.y + 'px';
        paw.style.setProperty('--paw-len', Math.min(len, 600) + 'px');
        paw.style.setProperty('--paw-rot', (ang + rot) + 'deg');
        paw.classList.add('visible');
    }

    function hidePawSoon(ms = 280) {
        clearTimeout(pawHideTimer);
        pawHideTimer = setTimeout(() => paw.classList.remove('visible'), ms);
    }

    function showFake(x, y) {
        fakeCursor.style.left = x + 'px';
        fakeCursor.style.top = y + 'px';
        fakeCursor.classList.add('visible');
    }
    function hideFake() {
        fakeCursor.classList.remove('visible');
    }

    function startSteal(x, y) {
        mode = 'stealing';
        stealStartX = x;
        stealStartY = y;
        stealAnimStart = performance.now();
        document.body.classList.add('cursor-stolen');
        showFake(x, y);
        showPaw(x, y);
        requestAnimationFrame(stealStep);
    }

    function stealStep(now) {
        if (mode !== 'stealing' && mode !== 'pinned') return;
        const anchor = pawAnchor();
        if (mode === 'stealing') {
            const t = Math.min((now - stealAnimStart) / stealAnimDur, 1);
            const eased = t * t * (3 - 2 * t);
            // Curve the cursor in along an arc toward the anchor
            const cx = stealStartX + (anchor.x - stealStartX) * eased;
            const cy = stealStartY + (anchor.y - stealStartY) * eased - Math.sin(eased * Math.PI) * 30;
            fakeCursor.style.left = cx + 'px';
            fakeCursor.style.top = cy + 'px';
            showPaw(cx, cy);
            if (t >= 1) {
                mode = 'pinned';
                pinnedUntil = now + STEAL_HOLD_MS;
                releaseAccum = 0;
            }
            requestAnimationFrame(stealStep);
        } else if (mode === 'pinned') {
            // Hold cursor at paw, paw stays extended to anchor
            fakeCursor.style.left = anchor.x + 'px';
            fakeCursor.style.top = anchor.y + 'px';
            showPaw(anchor.x + 4, anchor.y - 2);
            if (now < pinnedUntil) {
                requestAnimationFrame(stealStep);
            } else {
                // Auto-release if user hasn't moved
                releaseSteal();
            }
        }
    }

    function releaseSteal() {
        mode = 'idle';
        document.body.classList.remove('cursor-stolen');
        hideFake();
        hidePawSoon(180);
        prevDist = Infinity;
        lastMoveT = performance.now();
    }

    function doSwipe(x, y) {
        mode = 'swipe';
        showPaw(x, y, 0);
        paw.classList.add('swipe');
        setTimeout(() => {
            paw.classList.remove('swipe');
            hidePawSoon(140);
            mode = 'idle';
        }, 260);
    }

    document.addEventListener('mousemove', (e) => {
        const now = performance.now();
        const dt = Math.max(now - lastT, 1);

        // If cursor was stolen, accumulate movement to release
        if (mode === 'stealing' || mode === 'pinned') {
            const mdx = e.clientX - lastX;
            const mdy = e.clientY - lastY;
            releaseAccum += Math.hypot(mdx, mdy);
            // Track real position so fake cursor returns near it
            lastX = e.clientX; lastY = e.clientY; lastT = now; lastMoveT = now;
            if (releaseAccum > RELEASE_MOVE) releaseSteal();
            return;
        }

        const r = cat.getBoundingClientRect();
        const ccx = r.left + r.width / 2;
        const ccy = r.top + r.height * 0.35;
        const dist = Math.hypot(e.clientX - ccx, e.clientY - ccy);

        // Fast approach detection
        if (mode === 'idle' && dist < PROXIMITY && prevDist < Infinity) {
            const ddist = prevDist - dist; // positive = approaching
            const v = ddist / dt;          // px/ms
            if (v > SWIPE_VELOCITY) {
                doSwipe(e.clientX, e.clientY);
            }
        }
        prevDist = dist;
        lastX = e.clientX; lastY = e.clientY; lastT = now; lastMoveT = now;
    });

    // Idle-near-cat -> steal loop
    setInterval(() => {
        if (mode !== 'idle') return;
        const idle = performance.now() - lastMoveT;
        const r = cat.getBoundingClientRect();
        const ccx = r.left + r.width / 2;
        const ccy = r.top + r.height * 0.35;
        const dist = Math.hypot(lastX - ccx, lastY - ccy);
        if (idle >= IDLE_MS && dist < PROXIMITY && lastX > 0) {
            startSteal(lastX, lastY);
        }
    }, 120);

    // If user leaves window, drop everything
    document.addEventListener('mouseleave', () => {
        if (mode === 'stealing' || mode === 'pinned') releaseSteal();
        else { hidePawSoon(120); }
        prevDist = Infinity;
    });
})();







