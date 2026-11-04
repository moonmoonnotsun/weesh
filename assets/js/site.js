(function () {
    'use strict';

    /** POST target for the waitlist (Formspree, Google Apps Script, etc). Empty = open a prefilled email. */
    var WAITLIST_ENDPOINT = '';
    var CONTACT_EMAIL = 'dev.ohmyapp@gmail.com';

    var D = window.WEESH_DATA;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var LEVEL_TAGS = { climbing: 1, tennis: 1, padel: 1, dance: 1 };

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? Math.min(ms, 60) : ms); }); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* ================= wish understanding (same dictionary as the app) ================= */

    var TAGS = {};
    D.tags.forEach(function (t) { TAGS[t.id] = t; });

    function normalizeText(text) {
        return text.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ё/g, 'е');
    }
    var KEYWORDS = [];
    D.tags.forEach(function (tag) {
        tag.keywords.forEach(function (kw) {
            var k = normalizeText(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            KEYWORDS.push({ tagId: tag.id, re: new RegExp('(^|[^a-z0-9\\u0400-\\u04ff])' + k) });
        });
    });
    function matchWishTags(text) {
        var n = normalizeText(text);
        var hits = {};
        KEYWORDS.forEach(function (k) {
            var m = k.re.exec(n);
            if (m && (hits[k.tagId] == null || m.index < hits[k.tagId])) hits[k.tagId] = m.index;
        });
        return Object.keys(hits).sort(function (a, b) { return hits[a] - hits[b]; });
    }

    function coverFor(tag) { return tag && D.covers[tag] ? D.covers[tag].src : ''; }

    var STEP_TITLES = {
        climbing: 'Beginner bouldering intro', dance: 'Salsa class for beginners', jazz: 'Live jazz jam night',
        ramen: 'Ramen bar, walk-ins welcome', pottery: 'Wheel-throwing taster class', yoga: 'Drop-in yoga class',
        tennis: 'One hour on court, rackets included', padel: 'Padel court for four', swimming: 'Open lap swim',
        kayak: 'Two-hour kayak rental', coffee: 'Specialty coffee bar', museum: 'Museum late opening',
        theatre: 'Seats left for tonight\'s play', concert: 'Gig with tickets left', sauna: 'Evening sauna session',
        hiking: 'Day hike, train there and back', cooking_class: 'Dumpling-making class', escape_room: 'Escape room for 2–6',
        karaoke: 'Private karaoke room', wine: 'Natural wine bar', viewpoint: 'Sunset viewpoint', cinema: 'Arthouse screening',
        running: 'Saturday 5K park run', cycling: 'Bike rental by the river', brunch: 'Slow weekend brunch',
        vegan: 'All-vegan bistro', pizza: 'Neapolitan pizza spot', board_games: 'Board game café',
        standup: 'Open-mic comedy night', opera: 'Opera tickets, balcony seats', art: 'New contemporary art show',
        bowling: 'Bowling lane for an hour', karting: 'Indoor karting session', horse_riding: 'First riding lesson',
        ice_skating: 'Public skating session', craft_beer: 'Craft beer taproom', cocktails: 'Hidden cocktail bar',
        day_trip: 'Day trip by train', polish_food: 'Pierogi place locals love', sweets: 'Artisan ice cream',
        bookshop: 'Cosy secondhand bookshop', vinyl: 'Vinyl record store', markets: 'Weekend flea market',
        planetarium: 'Planetarium evening show', basketball: 'Pickup game at an outdoor court', volleyball: 'Open volleyball night',
        trampoline: 'Trampoline park hour', minigolf: 'Mini golf course', skate: 'Skatepark with lessons',
        park: 'Picnic spot in a big park', botanical_garden: 'Botanical garden walk', zoo: 'Zoo morning visit'
    };
    function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    /** Illustrative step for the demo: the real app picks a place id from a checked catalog. */
    function exampleStep(tag, text) {
        var t = TAGS[tag];
        var h = hash(text + tag);
        var km = (0.6 + (h % 29) / 10).toFixed(1);
        var times = ['Sat 10:00', 'Sat 11:30', 'Sat 18:00', 'Sun 12:00', 'Fri 19:00', 'Sat 20:00'];
        return {
            title: STEP_TITLES[tag] || (t.label + ' spot near you'),
            meta: km + ' km away · ' + times[h % times.length],
            pitch: t.cta,
            cover: coverFor(tag)
        };
    }

    /* ================= app UI snippets ================= */

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
        play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
        pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>'
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
    function chip(kind, label) {
        var labels = { ready: 'Step ready', searching: 'Searching', waiting: 'Still looking', done: 'Done' };
        return '<span class="chip ' + kind + '"><i></i>' + esc(label || labels[kind]) + '</span>';
    }
    function tileHtml(w, extra) {
        var cover = coverFor(w.tag);
        return '<div class="tile' + (cover ? '' : ' no-cover') + (extra ? ' ' + extra : '') + '"' +
            (cover ? ' style="background-image:url(\'' + cover + '\')"' : '') + '>' +
            '<div class="tile-bottom">' + chip(w.status) +
            '<div class="tile-title">' + esc(w.text) + '</div>' +
            (w.sub ? '<div class="tile-sub">' + esc(w.sub) + '</div>' : '') +
            '</div></div>';
    }
    function homeHtml(o) {
        var ready = o.wishes.filter(function (w) { return w.status === 'ready'; });
        var banner = ready.length ? '<div class="banner"><div class="banner-thumbs">' +
            ready.slice(0, 3).map(function (w) { return '<i style="background-image:url(\'' + coverFor(w.tag) + '\')"></i>'; }).join('') +
            '</div><div class="banner-text"><b>' + ready.length + (ready.length === 1 ? ' step' : ' steps') + ' ready this week</b><span>One real place for each wish</span></div>' +
            '<div class="banner-watch">' + ICONS.play + 'Watch</div></div>' : '';
        return statusBar() +
            '<div class="app-body"><div class="app-head"><div class="app-title">' + esc(o.title) + '</div><div class="app-add" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div></div>' +
            banner +
            '<div class="segment"><span class="on">Active · ' + o.wishes.length + '</span><span>Done · ' + o.done + '</span></div>' +
            '<div class="tile-grid">' + o.wishes.map(function (w, i) { return tileHtml(w, o.extra && o.extra[i]); }).join('') +
            '<div class="add-tile"><b>+</b>Add a wish</div></div></div>' +
            '<div class="app-fade"></div>' +
            '<div class="composer">' + ICONS.chat + '<span>Tell me a wish</span><div class="send">' + ICONS.up + '</div></div>' +
            tabBar(0);
    }
    function sheetHtml(msgs) {
        return '<div class="sheet-dim"></div><div class="sheet"><div class="sheet-handle"></div><div class="sheet-title">Weesh</div>' +
            '<div class="msgs">' + (msgs || '') + '</div>' +
            '<div class="sheet-input"><span>Message</span><div class="send">' + ICONS.up + '</div></div></div>';
    }

    /* ================= hero demo ================= */

    var hero = {
        app: $('#heroApp'),
        result: $('#heroResult'),
        input: $('#heroWishText'),
        form: $('#heroWish'),
        busy: false,
        wishes: []
    };

    function initHero() {
        hero.wishes = [
            { text: 'Try bouldering', tag: 'climbing', status: 'ready', sub: STEP_TITLES.climbing },
            { text: 'Find great ramen', tag: 'ramen', status: 'ready', sub: STEP_TITLES.ramen },
            { text: 'Hear live jazz', tag: 'jazz', status: 'searching', sub: 'Looking for this week' },
            { text: 'See Japan', tag: '', status: 'waiting', sub: 'Waits for a real flight' }
        ];
        renderHero();

        hero.form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitWish(hero.input.value, 'typed');
        });
        $$('#heroTry button').forEach(function (b) {
            b.addEventListener('click', function () {
                if (hero.busy) return;
                var chip = b.getAttribute('data-wish');
                if (window.WeeshAnalytics) WeeshAnalytics.track('wish_chip_clicked', { chip: chip });
                typeInto(chip).then(function () { submitWish(hero.input.value, 'chip'); });
            });
        });
        cyclePlaceholder();
    }

    function renderHero(extra) {
        hero.app.innerHTML = homeHtml({ title: 'Your wishes', wishes: hero.wishes.slice(0, 6), done: 3, extra: extra }) + sheetHtml();
    }

    var PLACEHOLDERS = ['I want to try bouldering', 'Learn to dance salsa', 'Find a climbing gym', 'Take a pottery class', 'Find great ramen', 'See Japan one day', 'Try kayaking'];
    function cyclePlaceholder() {
        var i = 0, ch = 0, deleting = false;
        function tick() {
            var focused = document.activeElement === hero.input;
            if (hero.input.value || focused || hero.busy) {
                hero.input.placeholder = focused ? 'Write a wish…' : PLACEHOLDERS[i];
                return setTimeout(tick, 600);
            }
            var full = PLACEHOLDERS[i];
            if (!deleting) {
                ch++;
                hero.input.placeholder = full.slice(0, ch);
                if (ch >= full.length) { deleting = true; return setTimeout(tick, 1800); }
                return setTimeout(tick, 55 + Math.random() * 50);
            }
            ch -= 2;
            hero.input.placeholder = full.slice(0, Math.max(ch, 0));
            if (ch <= 0) { deleting = false; i = (i + 1) % PLACEHOLDERS.length; return setTimeout(tick, 350); }
            setTimeout(tick, 22);
        }
        if (reduceMotion) { hero.input.placeholder = PLACEHOLDERS[0]; return; }
        tick();
    }

    function typeInto(text) {
        hero.input.value = '';
        if (reduceMotion) { hero.input.value = text; return Promise.resolve(); }
        return new Promise(function (resolve) {
            var i = 0;
            (function step() {
                hero.input.value = text.slice(0, ++i);
                if (i < text.length) setTimeout(step, 34);
                else setTimeout(resolve, 260);
            })();
        });
    }

    function shootStar(from, to) {
        if (reduceMotion || !from || !to || !document.body.animate) return Promise.resolve();
        var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        var star = document.createElement('div');
        star.className = 'wish-trail';
        document.body.appendChild(star);
        var x0 = a.right - 40, y0 = a.top + a.height / 2 - 13;
        var x1 = b.left + b.width * 0.3, y1 = b.top + b.height * 0.35;
        var anim = star.animate([
            { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.6) rotate(0deg)', opacity: 0 },
            { transform: 'translate(' + (x0 + (x1 - x0) * 0.5) + 'px,' + (Math.min(y0, y1) - 120) + 'px) scale(1.4) rotate(180deg)', opacity: 1, offset: 0.5 },
            { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.4) rotate(360deg)', opacity: 0 }
        ], { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)' });
        return new Promise(function (r) { anim.onfinish = function () { star.remove(); r(); }; });
    }

    function addMsg(html) {
        var msgs = $('.msgs', hero.app);
        msgs.insertAdjacentHTML('beforeend', html);
        return msgs.lastElementChild;
    }

    function submitWish(raw, source) {
        var text = (raw || '').trim().replace(/\s+/g, ' ');
        if (hero.busy) return;
        var tag = text ? (matchWishTags(text)[0] || '') : '';
        var junk = text && (/^(hi|hello|hey|ok|okay|привет|привіт|ок|cześć|czesc|siema|test)[!. ]*$/i.test(text) || text.length < 3);
        var existing = tag && hero.wishes.filter(function (w) { return w.tag === tag; })[0];
        var step = tag ? exampleStep(tag, text) : null;
        var outcome = !text ? 'empty' : junk ? 'junk' : existing ? 'duplicate' : (LEVEL_TAGS[tag] ? 'level_question' : (step ? 'step' : 'waiting'));
        if (window.WeeshAnalytics) {
            WeeshAnalytics.track('wish_submitted', {
                source: source || 'typed',
                tag: tag || 'none',
                outcome: outcome,
                length: text.length
            });
        }
        if (!text) {
            hero.form.classList.remove('shake');
            void hero.form.offsetWidth;
            hero.form.classList.add('shake');
            hero.input.focus();
            return;
        }
        hero.busy = true;
        hero.result.classList.remove('show');
        hero.input.value = '';
        hero.input.blur();

        var display = text.charAt(0).toUpperCase() + text.slice(1);

        var reply;
        if (junk) reply = 'Tell me a wish in one sentence. Like “try padel” or “see the mountains”.';
        else if (existing) reply = '“' + existing.text + '” is already on your list. It\'s waiting for one plan.';
        else if (LEVEL_TAGS[tag]) reply = 'Saved: “' + display + '”. Beginner, or have you been before?';
        else if (step) reply = 'Saved: “' + display + '”. I\'ll find one real place for it.';
        else reply = 'Saved. A plan shows up when there\'s a real step, like a flight. Until then: still looking.';

        shootStar(hero.form, $('#heroPhone')).then(function () {
            hero.app.classList.add('chat-open');
            return wait(380);
        }).then(function () {
            addMsg('<div class="bubble user">' + esc(text) + '</div>');
            return wait(450);
        }).then(function () {
            var typing = addMsg('<div class="bubble bot typing"><i></i><i></i><i></i></div>');
            return wait(850).then(function () { typing.remove(); });
        }).then(function () {
            addMsg('<div class="bubble bot">' + esc(reply) + '</div>');
            if (!junk && !existing && LEVEL_TAGS[tag]) {
                return wait(500).then(function () {
                    var q = addMsg('<div class="quick"><span>Beginner</span><span>Been before</span></div>');
                    return wait(900).then(function () {
                        q.firstChild.classList.add('on');
                        return wait(350);
                    }).then(function () {
                        addMsg('<div class="bubble user">Beginner</div>');
                        return wait(700);
                    });
                });
            }
            return wait(1200);
        }).then(function () {
            hero.app.classList.remove('chat-open');
            return wait(450);
        }).then(function () {
            if (junk) return;
            if (existing) {
                var extra = []; extra[hero.wishes.indexOf(existing)] = 'glow';
                renderHero(extra);
                return;
            }
            var wish = { text: display, tag: tag, status: step ? 'searching' : 'waiting', sub: step ? 'Looking near you' : 'Waits for a real step' };
            hero.wishes.unshift(wish);
            renderHero(['enter']);
            if (!step) { showResult(null, wish); return; }
            return wait(1500).then(function () {
                wish.status = 'ready';
                wish.sub = step.title;
                renderHero(['glow']);
                showResult(step, wish);
            });
        }).then(function () {
            hero.busy = false;
        });
    }

    function showResult(step, wish) {
        var el = hero.result;
        if (!step) {
            el.innerHTML = '<div class="result-still">' + chip('waiting') +
                '<h4>“' + esc(wish.text) + '”</h4><p>Saved as written. No stand-in plan. It waits for a real step, like a flight worth taking.</p></div>';
        } else {
            el.innerHTML = '<div class="result-photo" style="background-image:url(\'' + step.cover + '\')"><span>From your wish · ' + esc(wish.text) + '</span></div>' +
                '<div class="result-body"><h4>' + esc(step.title) + '</h4>' +
                '<div class="result-meta">' + esc(step.meta) + '</div>' +
                '<div class="result-src">' + ICONS.pin + 'Example step · real ones come from a checked catalog</div></div>';
        }
        el.classList.add('show');
        clearTimeout(showResult.t);
        showResult.t = setTimeout(function () { el.classList.remove('show'); }, 9000);
    }

    /* ================= sky ================= */

    function Sky(canvas) {
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var stars = [], shooting = [], w = 0, h = 0, dpr = 1, visible = true, mx = 0, my = 0, raf = 0;

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth; h = canvas.clientHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var n = Math.min(380, Math.round(w * h / 3600));
            stars = [];
            for (var i = 0; i < n; i++) {
                var big = Math.random() < 0.06;
                stars.push({
                    x: Math.random() * w, y: Math.random() * h * 0.95,
                    r: big ? 1.2 + Math.random() * 1.1 : 0.3 + Math.random() * 0.8,
                    p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 1.8, d: 0.2 + Math.random() * 0.8, big: big
                });
            }
            if (reduceMotion) draw(0);
        }
        function spawn() {
            if (!visible || reduceMotion) return;
            shooting.push({ x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.35, vx: -(5 + Math.random() * 4), vy: 2.6 + Math.random() * 2, life: 0 });
        }
        function draw(t) {
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
                var x = s.x + mx * s.d * 14, y = s.y + my * s.d * 10;
                ctx.globalAlpha = a;
                ctx.fillStyle = s.big ? '#dbe8ff' : '#aac8ff';
                ctx.beginPath();
                ctx.arc(x, y, s.r, 0, 6.283);
                ctx.fill();
                if (s.big) {
                    ctx.globalAlpha = a * 0.5;
                    ctx.fillRect(x - s.r * 4, y - 0.4, s.r * 8, 0.8);
                    ctx.fillRect(x - 0.4, y - s.r * 4, 0.8, s.r * 8);
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
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x - m.vx * 14, m.y - m.vy * 14);
                ctx.stroke();
                if (m.life > 70) shooting.splice(j, 1);
            }
            ctx.globalAlpha = 1;
        }
        function loop(t) {
            draw(t);
            raf = visible ? requestAnimationFrame(loop) : 0;
        }
        resize();
        window.addEventListener('resize', resize);
        if (reduceMotion) return;
        window.addEventListener('pointermove', function (e) {
            mx = e.clientX / window.innerWidth - 0.5;
            my = e.clientY / window.innerHeight - 0.5;
        }, { passive: true });
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible && !raf) raf = requestAnimationFrame(loop);
        }).observe(canvas);
        (function schedule() { setTimeout(function () { spawn(); schedule(); }, 2500 + Math.random() * 5000); })();
    }

    /* ================= ribbon ================= */

    var RIBBON = [
        ['Try bouldering', 'climbing'], ['Find a climbing gym', 'climbing'], ['Learn to dance', 'dance'],
        ['Go hear some jazz', 'jazz'], ['Take a salsa class', 'dance'], ['See Japan', ''], ['Try kayaking', 'kayak'],
        ['Find a sauna', 'sauna'], ['Try a yoga class', 'yoga'], ['Find great ramen', 'ramen'],
        ['Watch a sunset somewhere high', 'viewpoint'], ['Go to the theatre', 'theatre'], ['Make something at a pottery class', 'pottery'],
        ['Book a tennis court', 'tennis'], ['Rent a bike', 'cycling'], ['Do an escape room', 'escape_room'],
        ['Go hiking in the mountains', 'hiking'], ['Find my coffee spot', 'coffee'], ['Go to a concert', 'concert'],
        ['Learn to make dumplings', 'cooking_class']
    ];
    function initRibbon() {
        var rows = $$('.ribbon-row');
        var half = Math.ceil(RIBBON.length / 2);
        [RIBBON.slice(0, half), RIBBON.slice(half)].forEach(function (items, r) {
            var html = items.map(function (it) {
                var cover = coverFor(it[1]);
                var img = cover ? '<img src="' + cover + '" alt="" loading="lazy">' : '<img src="assets/img/icon-256.png" alt="">';
                return '<span class="ribbon-item">' + img + esc(it[0]) + '</span>';
            }).join('');
            rows[r].innerHTML = html + html;
        });
    }

    /* ================= problem ================= */

    function initKinetic() {
        var el = $('#kinetic');
        if (!el) return;
        var words = el.textContent.trim().split(/\s+/);
        el.innerHTML = words.map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
        var spans = $$('.w', el);
        var notes = $('.notes-card');
        if (reduceMotion) { spans.forEach(function (s) { s.classList.add('lit'); }); return; }
        function update() {
            var r = el.getBoundingClientRect(), vh = window.innerHeight;
            var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3), 0, 1);
            var n = Math.round(p * spans.length);
            for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('lit', i < n);
            if (notes) notes.classList.toggle('fading', p > 0.45);
        }
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ================= how it works ================= */

    function howScreens() {
        var wishText = 'I want to try bouldering';
        var climb = exampleStep('climbing', wishText);

        var chat = homeHtml({
            title: 'Your wishes', done: 3,
            wishes: [
                { text: 'Take a pottery class', tag: 'pottery', status: 'ready', sub: STEP_TITLES.pottery },
                { text: 'See Japan', tag: '', status: 'waiting', sub: 'Waits for a real flight' }
            ]
        }) + sheetHtml(
            '<div class="bubble user">' + wishText + '</div>' +
            '<div class="bubble bot">Saved: “' + wishText + '”. Beginner, or have you been before?</div>' +
            '<div class="quick"><span class="on">Beginner</span><span>Been before</span></div>' +
            '<div class="bubble user">Beginner</div>' +
            '<div class="bubble bot">Got it. I\'ll look for a wall with a beginner intro.</div>'
        );

        var home = homeHtml({
            title: 'Your wishes', done: 3,
            wishes: [
                { text: wishText, tag: 'climbing', status: 'searching', sub: 'Looking near you' },
                { text: 'Take a pottery class', tag: 'pottery', status: 'ready', sub: STEP_TITLES.pottery },
                { text: 'Go to a wine bar', tag: 'wine', status: 'ready', sub: STEP_TITLES.wine },
                { text: 'See Japan', tag: '', status: 'waiting', sub: 'Waits for a real flight' }
            ],
            extra: ['flip']
        });

        var story = '<div class="story" style="background-image:url(\'' + climb.cover + '\')">' +
            statusBar(true) +
            '<div class="story-bars"><i class="run"></i><i></i><i></i></div>' +
            '<div class="story-close">×</div>' +
            '<div class="story-bottom"><div class="story-eyebrow">1 of 3 · from your wish “' + wishText + '”</div>' +
            '<div class="story-title">' + esc(climb.title) + '</div>' +
            '<div class="story-lines">' + esc(climb.meta) + '<br>' + esc(climb.pitch) + '</div>' +
            '<div class="story-btn">I\'m going - directions</div><div class="story-btn2">Details</div></div>' +
            '<div class="home-ind light"></div></div>';

        var place = statusBar() +
            '<div class="toast">Done. Nice one ✦</div>' +
            '<div class="app-body" style="padding-bottom:6px"><div class="app-head"><div class="app-title">This week</div></div></div>' +
            '<div class="place-card"><div class="place-photo" style="background-image:url(\'' + climb.cover + '\')">' +
            '<div class="wish-chip">From your wish · ' + wishText + '</div>' +
            '<div class="place-photo-bottom"><div class="place-title">' + esc(climb.title) + '</div><div class="place-meta">' + esc(climb.meta) + '</div></div></div>' +
            '<div class="place-body"><div class="place-pitch">' + esc(climb.pitch) + '</div>' +
            '<div class="fresh">' + ICONS.shield + 'Checked place · source on the card</div>' +
            '<div class="place-actions"><div class="btn-dir">' + ICONS.nav + 'Directions</div><div class="btn-done">Done it</div><div class="btn-more">•••</div></div></div></div>' +
            '<div class="reply-row"><span>Too far</span><span>Not this</span><span>Later</span></div>' +
            '<div class="recap"><b>4</b><div>wishes done this month.<br>Your month in review is ready.</div></div>' +
            tabBar(1);

        return [chat, home, story, place];
    }

    function animateScreen(screen, i) {
        if (!screen) return;
        clearTimeout(screen._t1); clearTimeout(screen._t2);
        if (i === 1) {
            var tile = $('.tile.flip', screen);
            if (!tile) return;
            tile.classList.remove('glow');
            $('.chip', tile).outerHTML = chip('searching');
            $('.tile-sub', tile).textContent = 'Looking near you';
            screen._t1 = setTimeout(function () {
                $('.chip', tile).outerHTML = chip('ready');
                $('.tile-sub', tile).textContent = STEP_TITLES.climbing;
                tile.classList.add('glow');
            }, reduceMotion ? 0 : 1500);
        }
        if (i === 3) {
            var btn = $('.btn-done', screen), toast = $('.toast', screen);
            btn.classList.remove('tapped'); btn.textContent = 'Done it';
            toast.classList.remove('show');
            screen._t1 = setTimeout(function () {
                btn.classList.add('tapped'); btn.textContent = '✓ Done';
                toast.classList.add('show');
            }, reduceMotion ? 0 : 1300);
            screen._t2 = setTimeout(function () { toast.classList.remove('show'); }, 4200);
        }
    }

    function initHow() {
        var screens = howScreens();
        var app = $('#howApp');
        app.innerHTML = screens.map(function (html, i) {
            return '<div class="screen' + (i === 0 ? ' active chat-open' : '') + '" data-i="' + i + '">' + html + '</div>';
        }).join('');

        $$('.step').forEach(function (step, i) {
            $('.step-phone', step).innerHTML = '<div class="phone"><div class="phone-screen"><div class="app"><div class="screen active' + (i === 0 ? ' chat-open' : '') + '" data-i="' + i + '">' + screens[i] + '</div></div></div></div>';
        });

        var current = -1;
        function activate(i) {
            if (i === current) return;
            current = i;
            $$('.screen', app).forEach(function (s, k) { s.classList.toggle('active', k === i); });
            $$('.step').forEach(function (s, k) { s.classList.toggle('active', k === i); });
            animateScreen($('.screen[data-i="' + i + '"]', app), i);
        }
        activate(0);

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var i = +e.target.getAttribute('data-step');
                activate(i);
                animateScreen($('.step-phone .screen', e.target), i);
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        $$('.step').forEach(function (s) { io.observe(s); });
    }

    /* ================= waitlist ================= */

    function initJoin() {
        var form = $('#joinForm'), msg = $('#joinMsg');
        var joined = null;
        try { joined = localStorage.getItem('weesh_joined'); } catch (e) { /* private mode */ }
        if (joined) done();

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = $('#joinEmail').value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                msg.className = 'form-msg err';
                msg.textContent = 'That email doesn\'t look right.';
                $('#joinEmail').focus();
                if (window.WeeshAnalytics) WeeshAnalytics.track('waitlist_submitted', { result: 'invalid' });
                return;
            }
            var wishes = hero.wishes.map(function (w) { return w.text; });
            msg.className = 'form-msg';
            msg.textContent = 'Saving…';

            var send = WAITLIST_ENDPOINT
                ? fetch(WAITLIST_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({ email: email, wishes: wishes, source: 'weeesh.app', at: new Date().toISOString() })
                }).then(function (r) { if (!r.ok) throw new Error(r.status); })
                : Promise.resolve().then(function () {
                    var body = 'Hi,\n\nPlease add me to the Weesh waitlist.\n\nEmail: ' + email + '\n';
                    window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Weesh waitlist') + '&body=' + encodeURIComponent(body);
                });
            send.then(function () {
                try { localStorage.setItem('weesh_joined', '1'); } catch (err) { /* private mode */ }
                if (window.WeeshAnalytics) {
                    WeeshAnalytics.track('waitlist_submitted', { result: WAITLIST_ENDPOINT ? 'saved' : 'mailto' });
                }
                done();
            }).catch(function () {
                msg.className = 'form-msg err';
                msg.innerHTML = 'Couldn\'t save that. Email us at <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.';
                if (window.WeeshAnalytics) WeeshAnalytics.track('waitlist_submitted', { result: 'error' });
            });
        });

        function done() {
            form.classList.add('done');
            msg.className = 'form-msg ok';
            msg.textContent = 'You\'re on the list ✦ We\'ll write when Weesh is ready for you.';
        }
    }

    /* ================= chrome ================= */

    function initNav() {
        var nav = $('#nav');
        var dark = $$('.hero, .final, .footer');
        var links = $$('.nav-links a');
        function update() {
            nav.classList.toggle('scrolled', window.scrollY > 10);
            var onDark = false;
            dark.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom >= 40) onDark = true; });
            nav.classList.toggle('on-light', !onDark && window.scrollY > 10);
            var current = null;
            links.forEach(function (a) {
                var id = (a.getAttribute('href') || '').replace('#', '');
                var el = id && document.getElementById(id);
                if (!el) return;
                var r = el.getBoundingClientRect();
                if (r.top <= 140 && r.bottom > 140) current = a;
            });
            links.forEach(function (a) { a.classList.toggle('is-on', a === current); });
        }
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    function initReveal() {
        var els = $$('[data-reveal]');
        if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(function (e) { e.classList.add('in'); }); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.classList.add('in');
                io.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -10% 0px' });
        els.forEach(function (e) {
            var parent = e.parentElement;
            if (parent && /promise-grid|lane-list/.test(parent.className)) {
                e.style.transitionDelay = (Array.prototype.indexOf.call(parent.children, e) % 4) * 90 + 'ms';
            }
            io.observe(e);
        });
    }

    initHero();
    Sky($('#sky'));
    Sky($('#sky2'));
    initRibbon();
    initKinetic();
    initHow();
    initJoin();
    initNav();
    initReveal();
})();
