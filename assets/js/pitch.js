(function () {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    var total = slides.length;
    var i = 0;
    var bar = document.getElementById('bar');
    var counter = document.getElementById('counter');
    var prev = document.getElementById('prev');
    var next = document.getElementById('next');
    var dots = document.getElementById('dots');
    var hint = document.getElementById('hint');
    var deck = document.getElementById('deck');

    slides.forEach(function (_, n) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Slide ' + (n + 1));
        b.addEventListener('click', function () { go(n); });
        li.appendChild(b);
        dots.appendChild(li);
    });
    var dotBtns = Array.prototype.slice.call(dots.querySelectorAll('button'));

    function go(n) {
        n = Math.max(0, Math.min(total - 1, n));
        slides.forEach(function (s, k) {
            var on = k === n;
            s.classList.toggle('is-on', on);
            s.hidden = !on;
        });
        dotBtns.forEach(function (d, k) { d.classList.toggle('is-on', k === n); });
        var changed = n !== i || !go.seen;
        i = n;
        go.seen = true;
        if (changed && window.WeeshAnalytics) {
            WeeshAnalytics.slide(n + 1, slides[n].getAttribute('aria-label') || '');
        }
        bar.style.width = ((n + 1) / total * 100) + '%';
        counter.textContent = String(n + 1).padStart(2, '0');
        prev.disabled = n === 0;
        next.disabled = n === total - 1;
        if (history.replaceState) history.replaceState(null, '', n ? '#' + (n + 1) : '#');
        if (hint && n > 0) hint.style.opacity = '0';
    }

    function fromHash() {
        var n = parseInt((location.hash || '').replace('#', ''), 10);
        go(n ? n - 1 : 0);
    }

    prev.addEventListener('click', function () { go(i - 1); });
    next.addEventListener('click', function () { go(i + 1); });
    deck.addEventListener('click', function (e) {
        if (e.target.closest('a, button, .pager')) return;
        go(i + 1);
    });
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
            e.preventDefault();
            go(i + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            go(i - 1);
        } else if (e.key === 'Home') go(0);
        else if (e.key === 'End') go(total - 1);
    });

    var startX = 0;
    deck.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
    deck.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
    }, { passive: true });

    fromHash();
    deck.focus();
})();
