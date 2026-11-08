(function () {
    'use strict';

    var D = window.WEESH_DATA || { covers: {} };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function cover(tag) { return tag && D.covers[tag] ? '../' + D.covers[tag].src : ''; }

    var ICONS = {
        signal: '<svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
        wifi: '<svg viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .6C5.3.6 2.8 1.6.9 3.5L2 4.7a8.5 8.5 0 0 1 6-2.4zm0 3.4c1.4 0 2.7.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 4c-1.8 0-3.5.7-4.8 1.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4zm0 3.4c-.6 0-1.1.2-1.5.6L8 11.2l1.5-1.5c-.4-.4-.9-.6-1.5-.6z"/></svg>',
        battery: '<svg viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".5"/></svg>',
        sparkles: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2l1.8 5.6L17 9.5l-5.2 1.9L10 17l-1.8-5.6L3 9.5l5.2-1.9L10 2zm8.5 10l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z"/></svg>',
        calendar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9z"/></svg>',
        log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/></svg>',
        gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
        chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#2C78FA"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4 21l4.2-1.9c1.2.4 2.5.6 3.8.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3zM7.5 12.8a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4.5 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4.5 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"/></svg>',
        up: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
        nav: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3L3 10.5l7.5 3L13.5 21 21 3z"/></svg>',
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1.2 13.6l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1-1.4 1.4 3.5 3.5z"/></svg>',
        play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>'
    };

    function statusBar(light) {
        return '<div class="app-island"></div><div class="app-status' + (light ? ' light' : '') + '"><span>9:41</span><span class="icons">' + ICONS.signal + ICONS.wifi + ICONS.battery + '</span></div>';
    }
    function tabBar(on) {
        var tabs = [['Wishes', ICONS.sparkles], ['This week', ICONS.calendar], ['Log', ICONS.log], ['Settings', ICONS.gear]];
        return '<div class="tabbar">' + tabs.map(function (t, i) {
            return '<div class="' + (i === on ? 'on' : '') + '">' + t[1] + '<span>' + t[0] + '</span></div>';
        }).join('') + '</div><div class="home-ind"></div>';
    }
    function chip(kind) {
        var labels = { ready: 'Step ready', searching: 'Searching' };
        return '<span class="chip ' + kind + '"><i></i>' + labels[kind] + '</span>';
    }
    function tile(w) {
        var c = cover(w.tag);
        return '<div class="tile' + (w.glow ? ' glow' : '') + '" style="background-image:url(\'' + c + '\')">' +
            '<div class="tile-bottom">' + chip(w.status) +
            '<div class="tile-title">' + esc(w.text) + '</div>' +
            '<div class="tile-sub">' + esc(w.sub) + '</div></div></div>';
    }
    function home(wishes) {
        var ready = wishes.filter(function (w) { return w.status === 'ready'; });
        return statusBar() +
            '<div class="app-body"><div class="app-head"><div class="app-title">Your wishes</div><div class="app-add"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div></div>' +
            '<div class="banner"><div class="banner-thumbs">' + ready.slice(0, 3).map(function (w) { return '<i style="background-image:url(\'' + cover(w.tag) + '\')"></i>'; }).join('') +
            '</div><div class="banner-text"><b>' + ready.length + ' steps ready this week</b><span>One real place for each wish</span></div><div class="banner-watch">' + ICONS.play + 'Watch</div></div>' +
            '<div class="segment"><span class="on">Active · ' + wishes.length + '</span><span>Done · 3</span></div>' +
            '<div class="tile-grid">' + wishes.map(tile).join('') + '</div></div>' +
            '<div class="app-fade"></div>' +
            '<div class="composer">' + ICONS.chat + '<span>Tell me a wish</span><div class="send">' + ICONS.up + '</div></div>' +
            tabBar(0);
    }

    var WISHES = [
        { text: 'Try yoga', tag: 'yoga', status: 'ready', sub: 'Drop-in yoga class' },
        { text: 'Hear live jazz', tag: 'jazz', status: 'searching', sub: 'Looking for this week' },
        { text: 'Try kayaking', tag: 'kayak', status: 'ready', sub: 'Half-day beginner river trip' },
        { text: 'Try bouldering', tag: 'climbing', status: 'ready', sub: 'Beginner bouldering intro' }
    ];

    var SCREENS = {
        home: function () { return home(WISHES); },
        found: function () {
            return home([
                { text: 'Try yoga', tag: 'yoga', status: 'ready', sub: 'Drop-in yoga class', glow: true },
                WISHES[1], WISHES[2], WISHES[3]
            ]);
        },
        chat: function () {
            return home(WISHES.slice(1)) +
                '<div class="sheet-dim" style="opacity:1"></div><div class="sheet" style="transform:none"><div class="sheet-handle"></div><div class="sheet-title">Weesh</div>' +
                '<div class="msgs">' +
                '<div class="bubble user">I want to try yoga</div>' +
                '<div class="bubble bot">Saved: “I want to try yoga”. Beginner, or have you been before?</div>' +
                '<div class="quick"><span class="on">Beginner</span><span>Been before</span></div>' +
                '<div class="bubble user">Beginner</div>' +
                '<div class="bubble bot">Got it. I’ll find a beginner class near you.</div>' +
                '</div><div class="sheet-input"><span>Message</span><div class="send">' + ICONS.up + '</div></div></div>';
        },
        story: function () {
            return '<div class="story" style="background-image:url(\'' + cover('yoga') + '\')">' +
                statusBar(true) +
                '<div class="story-bars"><i class="full"></i><i></i><i></i></div>' +
                '<div class="story-close">×</div>' +
                '<div class="story-bottom"><div class="story-eyebrow">1 of 3 · from your wish “Try yoga”</div>' +
                '<div class="story-title">Drop-in yoga class</div>' +
                '<div class="story-lines">1.2 km away · Sat 10:00<br>Book a beginner class. Mats are usually provided.</div>' +
                '<div class="story-btn">I’m going · directions</div><div class="story-btn2">Details</div></div>' +
                '<div class="home-ind light"></div></div>';
        },
        place: function () {
            return statusBar() +
                '<div class="app-body" style="padding-bottom:6px"><div class="app-head"><div class="app-title">This week</div></div></div>' +
                '<div class="place-card"><div class="place-photo" style="background-image:url(\'' + cover('yoga') + '\')">' +
                '<div class="wish-chip">From your wish · Try yoga</div>' +
                '<div class="place-photo-bottom"><div class="place-title">Drop-in yoga class</div><div class="place-meta">1.2 km away · Sat 10:00</div></div></div>' +
                '<div class="place-body"><div class="place-pitch">Book a beginner class. Mats are usually provided.</div>' +
                '<div class="fresh">' + ICONS.shield + 'Checked place · source on the card</div>' +
                '<div class="place-actions"><div class="btn-dir">' + ICONS.nav + 'Directions</div><div class="btn-done">Done it</div><div class="btn-more">•••</div></div></div></div>' +
                '<div class="reply-row"><span>Too far</span><span>Not this</span><span>Later</span></div>' +
                tabBar(1);
        }
    };

    $$('[data-screen]').forEach(function (el) {
        var make = SCREENS[el.getAttribute('data-screen')];
        if (make) el.innerHTML = make();
    });

    function Sky(canvas) {
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var stars = [], shooting = [], w = 0, h = 0, raf = 0;

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth; h = canvas.clientHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var n = Math.min(320, Math.round(w * h / 4200));
            stars = [];
            for (var i = 0; i < n; i++) {
                var big = Math.random() < 0.05;
                stars.push({
                    x: Math.random() * w, y: Math.random() * h,
                    r: big ? 1.1 + Math.random() : 0.3 + Math.random() * 0.7,
                    p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.6, big: big
                });
            }
            if (reduceMotion) draw(0);
        }
        function draw(t) {
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
                ctx.globalAlpha = a;
                ctx.fillStyle = s.big ? '#dbe8ff' : '#aac8ff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, 6.283);
                ctx.fill();
                if (s.big) {
                    ctx.globalAlpha = a * 0.45;
                    ctx.fillRect(s.x - s.r * 4, s.y - 0.4, s.r * 8, 0.8);
                    ctx.fillRect(s.x - 0.4, s.y - s.r * 4, 0.8, s.r * 8);
                }
            }
            for (var j = shooting.length - 1; j >= 0; j--) {
                var m = shooting[j];
                m.life++;
                m.x += m.vx; m.y += m.vy;
                var alpha = Math.max(0, 1 - m.life / 70);
                var g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14);
                g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
                g.addColorStop(1, 'rgba(142,190,255,0)');
                ctx.globalAlpha = 1;
                ctx.strokeStyle = g;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x - m.vx * 14, m.y - m.vy * 14);
                ctx.stroke();
                if (m.life > 70) shooting.splice(j, 1);
            }
            ctx.globalAlpha = 1;
        }
        function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
        resize();
        window.addEventListener('resize', resize);
        if (reduceMotion) return;
        raf = requestAnimationFrame(loop);
        (function schedule() {
            setTimeout(function () {
                if (!document.hidden) shooting.push({ x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.3, vx: -(5 + Math.random() * 4), vy: 2.4 + Math.random() * 2, life: 0 });
                schedule();
            }, 4000 + Math.random() * 6000);
        })();
    }

    Sky(document.getElementById('sky'));
})();
