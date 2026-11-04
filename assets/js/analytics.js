/**
 * Weesh site analytics. Same OhMyApp EU project as the other marketing sites.
 * Event names are prefixed [weesh]. Wish text and email addresses are not sent.
 */
(function (e, c) {
    if (!c.__SV) {
        var l, h;
        window.mixpanel = c;
        c._i = [];
        c.init = function (q, r, f) {
            function t(d, a) {
                var g = a.split('.');
                if (g.length === 2) { d = d[g[0]]; a = g[1]; }
                d[a] = function () { d.push([a].concat(Array.prototype.slice.call(arguments, 0))); };
            }
            var b = c;
            if (typeof f !== 'undefined') b = c[f] = [];
            else f = 'mixpanel';
            b.people = b.people || [];
            b.toString = function (d) {
                var a = 'mixpanel';
                if (f !== 'mixpanel') a += '.' + f;
                if (!d) a += ' (stub)';
                return a;
            };
            b.people.toString = function () { return b.toString(1) + '.people (stub)'; };
            l = 'disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders start_session_recording stop_session_recording people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove'.split(' ');
            for (h = 0; h < l.length; h++) t(b, l[h]);
            var n = 'set set_once union unset remove delete'.split(' ');
            b.get_group = function () {
                function d(p) { a[p] = function () { b.push([g, [p].concat(Array.prototype.slice.call(arguments, 0))]); }; }
                for (var a = {}, g = ['get_group'].concat(Array.prototype.slice.call(arguments, 0)), m = 0; m < n.length; m++) d(n[m]);
                return a;
            };
            c._i.push([q, r, f]);
        };
        c.__SV = 1.2;
        var k = e.createElement('script');
        k.type = 'text/javascript';
        k.async = true;
        k.src = typeof MIXPANEL_CUSTOM_LIB_URL !== 'undefined'
            ? MIXPANEL_CUSTOM_LIB_URL
            : (e.location.protocol === 'file:' && '//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'.match(/^\/\//)
                ? 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'
                : '//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js');
        var s = e.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(k, s);
    }
})(document, window.mixpanel || []);

mixpanel.init('2ab77ed29d0b04d62a75f63eaecc2a94', {
    autocapture: false,
    record_sessions_percent: 0,
    record_heatmap_data: false,
    api_host: 'https://api-eu.mixpanel.com',
    track_pageview: false
});

if (typeof mixpanel.set_config === 'function') {
    mixpanel.set_config({ autocapture: false });
}

(function () {
    'use strict';

    var started = Date.now();
    var scrollMilestones = {};
    var seenSections = {};
    var seenSteps = {};

    function pageName() {
        var path = window.location.pathname.replace(/\/index\.html$/, '/');
        if (path === '/' || path === '') return 'home';
        if (/\/pitch\/?$/.test(path)) return 'pitch';
        if (/credits\.html$/.test(path)) return 'credits';
        var match = path.match(/\/([^/]+)\/?$/);
        return match ? match[1] : 'home';
    }

    function utm(param) {
        return new URLSearchParams(window.location.search).get(param) || undefined;
    }

    function deviceType() {
        var width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    function browserName() {
        var ua = navigator.userAgent;
        if (ua.indexOf('Edg') > -1) return 'Edge';
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        return 'Unknown';
    }

    function osName() {
        var ua = navigator.userAgent;
        if (/iPhone|iPad/.test(ua)) return 'iOS';
        if (ua.indexOf('Android') > -1) return 'Android';
        if (ua.indexOf('Windows') > -1) return 'Windows';
        if (ua.indexOf('Mac') > -1) return 'macOS';
        if (ua.indexOf('Linux') > -1) return 'Linux';
        return 'Unknown';
    }

    function context() {
        return {
            page_name: pageName(),
            page_path: window.location.pathname,
            referrer: document.referrer || 'direct',
            utm_source: utm('utm_source'),
            utm_campaign: utm('utm_campaign'),
            utm_medium: utm('utm_medium'),
            device_type: deviceType(),
            browser: browserName(),
            os: osName()
        };
    }

    function track(eventName, props) {
        if (typeof mixpanel === 'undefined' || typeof mixpanel.track !== 'function') return;
        var payload = context();
        if (props) {
            Object.keys(props).forEach(function (key) {
                if (props[key] !== undefined && props[key] !== null) payload[key] = props[key];
            });
        }
        mixpanel.track('[weesh] ' + eventName, payload);
    }

    function linkLocation(el) {
        if (el.closest('.deck, .pager')) return 'pitch';
        if (el.closest('footer')) return 'footer';
        if (el.closest('#contact, .final')) return 'contact';
        if (el.closest('header, .nav')) return 'nav';
        return 'page';
    }

    function onClick(e) {
        var mail = e.target.closest && e.target.closest('a[href^="mailto:"]');
        if (mail) {
            track('email_clicked', { location: linkLocation(mail) });
            return;
        }
        var link = e.target.closest && e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        if (href.indexOf('://') !== -1) return;
        var hashAt = href.indexOf('#');
        if (hashAt !== -1) {
            track('nav_clicked', { target: href.slice(hashAt + 1) || 'top', location: linkLocation(link) });
            return;
        }
        if (/credits\.html$/.test(href)) {
            track('nav_clicked', { target: 'credits', location: linkLocation(link) });
        } else if (href === './' || href === '/' || href === 'index.html') {
            track('nav_clicked', { target: 'home', location: linkLocation(link) });
        }
    }

    function scrollDepth() {
        var height = document.documentElement.scrollHeight - window.innerHeight;
        if (height <= 0) return 100;
        var top = window.pageYOffset || document.documentElement.scrollTop;
        return Math.min(100, Math.max(0, Math.round((top / height) * 100)));
    }

    function onScroll() {
        var depth = scrollDepth();
        [25, 50, 75, 100].forEach(function (mark) {
            if (depth >= mark && !scrollMilestones[mark]) {
                scrollMilestones[mark] = true;
                track('scroll_milestone', {
                    scroll_depth: mark,
                    time_to_scroll: Math.floor((Date.now() - started) / 1000)
                });
            }
        });
    }

    function watchSections() {
        if (pageName() !== 'home' || !('IntersectionObserver' in window)) return;
        var sections = ['problem', 'how', 'landscape', 'promises', 'contact'];
        var nodes = sections.map(function (id) { return document.getElementById(id); }).filter(Boolean);
        if (!nodes.length) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var id = entry.target.id;
                if (seenSections[id]) return;
                seenSections[id] = true;
                track('section_viewed', { section: id });
                io.unobserve(entry.target);
            });
        }, { threshold: 0.35 });
        nodes.forEach(function (node) { io.observe(node); });

        var steps = Array.prototype.slice.call(document.querySelectorAll('.step[data-step]'));
        if (!steps.length) return;
        var stepIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var index = Number(entry.target.getAttribute('data-step')) + 1;
                if (seenSteps[index]) return;
                seenSteps[index] = true;
                track('product_step_viewed', { step_index: index });
                stepIo.unobserve(entry.target);
            });
        }, { threshold: 0.5 });
        steps.forEach(function (step) { stepIo.observe(step); });
    }

    function start() {
        mixpanel.register({
            device_type: deviceType(),
            browser: browserName(),
            os: osName(),
            referrer: document.referrer || 'direct',
            utm_source: utm('utm_source'),
            utm_campaign: utm('utm_campaign'),
            utm_medium: utm('utm_medium')
        });
        mixpanel.register_once({ first_seen: new Date().toISOString() });
        track('page_viewed');
        document.addEventListener('click', onClick);
        if (pageName() !== 'pitch') {
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }
        watchSections();
    }

    window.WeeshAnalytics = {
        track: track,
        slide: function (slideIndex, slideName) {
            track('pitch_slide_viewed', { slide_index: slideIndex, slide_name: slideName });
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
