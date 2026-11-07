/* Loads the latest published content from Sanity and re-renders the page.
 * The HTML already contains a full copy of the content, so the site still works
 * (and search engines still see text) if this script can't reach Sanity. */
(function () {
  var cfg = window.SANITY_CONFIG || {};
  if (!cfg.projectId || cfg.projectId === 'REPLACE_ME') return;
  var PID = cfg.projectId, DS = cfg.dataset || 'production';

  var QUERY = '{' +
    '"lab": *[_id == "labInfo"][0],' +
    '"people": *[_type == "person"] | order(orderRank asc, name asc),' +
    '"essays": *[_type == "essay" && defined(slug.current)] | order(date desc){..., "slug": slug.current},' +
    '"news": *[_type == "news"] | order(date desc)' +
  '}';

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function parts(d) { var m = /^(\d{4})-(\d{2})/.exec(d || ''); return m ? {y: m[1], m: +m[2] - 1} : null; }
  function shortDate(d) { var p = parts(d); return p ? MONTHS[p.m] + ' ' + p.y : ''; }
  function longDate(d, lang) {
    var p = parts(d); if (!p) return '';
    return lang === 'vi' ? 'Tháng ' + (p.m + 1) + ', ' + p.y : MONTHS_LONG[p.m] + ' ' + p.y;
  }
  function initials(name) {
    var w = String(name || '').trim().split(/\s+/);
    if (!w[0]) return '';
    return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
  }
  function img(image, w, h) {
    if (!image || !image.asset || !image.asset._ref) return '';
    var m = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-(\w+)$/.exec(image.asset._ref);
    if (!m) return '';
    var W = +m[2], H = +m[3];
    var url = 'https://cdn.sanity.io/images/' + PID + '/' + DS + '/' + m[1] + '-' + W + 'x' + H + '.' + m[4] + '?auto=format&w=' + w;
    if (image.crop) {
      var c = image.crop;
      var rx = Math.round(c.left * W), ry = Math.round(c.top * H);
      var rw = Math.round(W * (1 - c.left - c.right)), rh = Math.round(H * (1 - c.top - c.bottom));
      url += '&rect=' + [rx, ry, rw, rh].join(',');
    }
    if (h) {
      url += '&h=' + h + '&fit=crop';
      if (image.hotspot) url += '&crop=focalpoint&fp-x=' + image.hotspot.x.toFixed(3) + '&fp-y=' + image.hotspot.y.toFixed(3);
    }
    return url;
  }
  var ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  // ---------- Portable Text -> HTML ----------
  function spans(block) {
    var defs = {};
    (block.markDefs || []).forEach(function (d) { defs[d._key] = d; });
    return (block.children || []).map(function (s) {
      var t = esc(s.text).replace(/\n/g, '<br>');
      (s.marks || []).forEach(function (mk) {
        if (mk === 'strong') t = '<strong>' + t + '</strong>';
        else if (mk === 'em') t = '<em>' + t + '</em>';
        else if (defs[mk] && defs[mk].href) t = '<a href="' + esc(defs[mk].href) + '" target="_blank" rel="noopener">' + t + '</a>';
      });
      return t;
    }).join('');
  }
  function portable(blocks) {
    var out = [], list = null;
    (blocks || []).forEach(function (b) {
      if (b._type === 'block' && b.listItem) {
        if (!list) { list = []; }
        list.push('<li>' + spans(b) + '</li>');
        return;
      }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (b._type === 'block') {
        var inner = spans(b);
        if (!inner.replace(/<br>/g, '').trim()) return;
        if (b.style === 'h2' || b.style === 'h3') out.push('<h2>' + inner + '</h2>');
        else if (b.style === 'blockquote') out.push('<blockquote class="pull">' + inner + '</blockquote>');
        else out.push('<p>' + inner + '</p>');
      } else if (b._type === 'callout') {
        var paras = String(b.text || '').split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; }).join('');
        out.push('<aside class="callout">' + (b.heading ? '<span class="k">' + esc(b.heading) + '</span>' : '') + paras + '</aside>');
      } else if (b._type === 'image') {
        var u = img(b, 1400);
        if (u) out.push('<figure class="prose-figure"><img src="' + u + '" alt="' + esc(b.caption || '') + '" loading="lazy">' + (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>');
      }
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('\n');
  }
  function wordCount(blocks) {
    var text = (blocks || []).map(function (b) {
      if (b._type === 'block') return (b.children || []).map(function (c) { return c.text || ''; }).join(' ');
      if (b._type === 'callout') return (b.heading || '') + ' ' + (b.text || '');
      return '';
    }).join(' ');
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
  function readTime(blocks, lang) {
    var mins = Math.max(1, Math.round(wordCount(blocks) / 200));
    return lang === 'vi' ? mins + ' phút đọc' : mins + ' min read';
  }

  // ---------- renderers ----------
  function renderLab(lab) {
    if (!lab) return;
    if (lab.labName) {
      var w = lab.labName.trim().split(/\s+/);
      var h1 = $('.hero h1');
      if (w.length >= 3) {
        var i = w.length - 2;
        h1.innerHTML = esc(w.slice(0, i).join(' ')) + '<br><em>' + esc(w[i]) + '</em> ' + esc(w.slice(i + 1).join(' '));
      } else h1.textContent = lab.labName;
      document.querySelectorAll('.brand-name').forEach(function (el) { el.textContent = lab.labName; });
    }
    if (lab.tagline) $('.hero-tagline').textContent = lab.tagline;
    if (lab.vision) { $('.hero-vision').textContent = lab.vision; $('.vision blockquote').textContent = lab.vision; }
    if (lab.about) {
      var p = $('.about-card p');
      p.textContent = lab.about;
    }
    if (lab.piProfileUrl) document.querySelectorAll('a[href*="vinuni.edu.vn/people"]').forEach(function (a) { a.href = lab.piProfileUrl; });
    if (lab.scholarUrl) document.querySelectorAll('a[href*="scholar.google"]').forEach(function (a) { a.href = lab.scholarUrl; });
    if (lab.pillars && lab.pillars.length) {
      $('.pillars').innerHTML = lab.pillars.map(function (pl, idx) {
        var tags = (pl.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
        return '<li class="pillar reveal in"><span class="pillar-num">' + String(idx + 1).padStart(2, '0') + '</span>' +
          '<h3>' + esc(pl.title) + '</h3><div><p>' + esc(pl.description) + '</p>' + (tags ? '<div class="pillar-tags">' + tags + '</div>' : '') + '</div>' +
          '<span class="pillar-arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></li>';
      }).join('');
      var pc = $('[data-count="pillars"]'); if (pc) pc.textContent = lab.pillars.length;
    }
    var rows = document.querySelectorAll('.contact-row');
    if (lab.contactEmail && rows[0]) { rows[0].href = 'mailto:' + lab.contactEmail; rows[0].querySelector('.v').textContent = lab.contactEmail; }
    if (lab.contactPhone && rows[1]) { rows[1].href = 'tel:' + lab.contactPhone.replace(/[^\d+]/g, ''); rows[1].querySelector('.v').textContent = lab.contactPhone; }
    if (lab.address && rows[2]) { rows[2].querySelector('.v').textContent = lab.address; }
  }

  var AVATAR_CLASSES = ['', 'alt', ''];
  function avatar(p, cls, size) {
    var u = img(p.photo, size * 2, size * 2);
    return u
      ? '<div class="avatar has-photo ' + cls + '"><img src="' + u + '" alt="" loading="lazy"></div>'
      : '<div class="avatar ' + cls + '" aria-hidden="true">' + esc(initials(p.name)) + '</div>';
  }
  function renderPeople(people) {
    if (!people || !people.length) return;
    var current = people.filter(function (p) { return p.status !== 'alumni'; });
    var alumni = people.filter(function (p) { return p.status === 'alumni'; });
    var piIdx = current.findIndex(function (p) { return /principal investigator/i.test(p.role || ''); });
    var pi = piIdx >= 0 ? current[piIdx] : null;
    var rest = current.filter(function (_, i) { return i !== piIdx; });
    var html = '';
    if (pi) {
      html += '<article class="person pi reveal in">' + avatar(pi, '', 112) + '<div class="pi-body"><span class="kicker">' + esc(pi.role) + '</span><h3>' + esc(pi.name) + '</h3><div class="pi-links">' +
        (pi.email ? '<a class="chip" href="mailto:' + esc(pi.email) + '">' + ICON_MAIL + esc(pi.email) + '</a>' : '') +
        '<a class="chip" href="' + esc($('#profile-thang') ? $('#profile-thang').href : '#') + '" target="_blank" rel="noopener">VinUni profile ' + ICON_OUT + '</a>' +
        '<a class="chip" href="' + esc($('#cta-scholar').href) + '" target="_blank" rel="noopener">Google Scholar ' + ICON_OUT + '</a>' +
        '</div></div></article>';
    }
    html += rest.map(function (p, i) {
      var cls = /collaborator/i.test(p.role || '') ? 'neutral' : AVATAR_CLASSES[i % 3];
      return '<article class="person reveal in"><div class="person-top">' + avatar(p, cls, 64) +
        (p.email ? '<a class="mail" href="mailto:' + esc(p.email) + '" aria-label="Email ' + esc(p.name) + '">' + ICON_MAIL + '<span class="tip">' + esc(p.email) + '</span></a>' : '') +
        '</div><div><h3>' + esc(p.name) + '</h3><div class="role">' + esc(p.role) + '</div></div></article>';
    }).join('');
    $('.people-grid').innerHTML = html;
    var titles = document.querySelectorAll('.people-group-title');
    if (titles[0]) titles[0].lastElementChild.textContent = current.length + (current.length === 1 ? ' member' : ' members');
    var mc = $('[data-count="members"]'); if (mc) mc.textContent = current.length;

    var al = $('.alumni');
    if (!alumni.length) { al.hidden = true; return; }
    al.hidden = false;
    titles[1].lastElementChild.textContent = alumni.length;
    al.querySelectorAll('.alumni-row').forEach(function (r) { r.remove(); });
    al.insertAdjacentHTML('beforeend', alumni.map(function (p) {
      return '<div class="alumni-row reveal in">' + avatar(p, 'neutral', 48) + '<div><b>' + esc(p.name) + '</b><br><span>' + esc(p.alumniNow || p.role || '') + '</span></div><span class="year">' + esc(p.alumniYear || '') + '</span></div>';
    }).join(''));
  }

  var essaysBySlug = {};
  function renderEssays(essays) {
    if (!essays || !essays.length) return;
    essays.forEach(function (e) { essaysBySlug[e.slug] = e; });
    var fallbackCover = 'assets/writing.webp';
    var first = essays[0];
    var cover = img(first.cover, 1400, 800) || fallbackCover;
    var lang = first.language === 'en' ? 'English' : 'Tiếng Việt';
    var html = '<a class="feature reveal in" href="#writing/' + esc(first.slug) + '"><div class="feature-img"><img src="' + cover + '" alt="" loading="lazy"></div>' +
      '<div class="feature-body"><div class="meta-row"><span class="lang">' + lang + '</span><span>' + longDate(first.date, 'en') + '</span><span>' + readTime(first.body, first.language) + '</span></div>' +
      '<h3>' + esc(first.title) + '</h3><p>' + esc(first.excerpt || '') + '</p>' +
      '<span class="read-link"><span class="bar"></span>' + (first.language === 'en' ? 'Read essay' : 'Đọc bài viết') + ' ' + ICON_ARROW + '</span></div></a>';
    if (essays.length > 1) {
      html += '<div class="essay-grid">' + essays.slice(1).map(function (e) {
        var c = img(e.cover, 800, 450);
        return '<a class="essay-card reveal in" href="#writing/' + esc(e.slug) + '">' + (c ? '<img src="' + c + '" alt="" loading="lazy">' : '') +
          '<div class="essay-card-body"><div class="meta-row"><span class="lang">' + (e.language === 'en' ? 'English' : 'Tiếng Việt') + '</span><span>' + longDate(e.date, 'en') + '</span></div><h3>' + esc(e.title) + '</h3></div></a>';
      }).join('') + '</div>';
    }
    var wrap = $('#writing .wrap');
    wrap.querySelectorAll('.feature, .essay-grid').forEach(function (n) { n.remove(); });
    wrap.insertAdjacentHTML('beforeend', html);
  }

  function renderNews(news) {
    if (!news || !news.length) return;
    var wrap = $('#news .wrap');
    wrap.querySelectorAll('.news-item').forEach(function (n) { n.remove(); });
    wrap.insertAdjacentHTML('beforeend', news.map(function (n) {
      return '<article class="news-item reveal in"><div class="news-date"><span class="m">' + shortDate(n.date) + '</span><span class="t">' + esc(n.type || '') + '</span></div><div>' +
        (n.kicker ? '<span class="kicker">' + esc(n.kicker) + '</span>' : '') + '<h3>' + esc(n.title) + '</h3>' +
        (n.text ? '<p>' + esc(n.text).replace(/\n/g, '<br>') + '</p>' : '') +
        (n.link ? '<p style="margin-top:14px"><a class="chip" href="' + esc(n.link) + '" target="_blank" rel="noopener">Read more ' + ICON_OUT + '</a></p>' : '') +
        '</div></article>';
    }).join(''));
  }

  // Generic essay reader: #writing/<slug>
  function openEssay() {
    var m = /^#writing\/(.+)$/.exec(location.hash);
    if (!m) return;
    var e = essaysBySlug[decodeURIComponent(m[1])];
    var reader = $('#reader');
    if (!e) return;
    var lang = e.language === 'en' ? 'en' : 'vi';
    $('.article', reader).setAttribute('lang', lang);
    $('.article-head .meta-row', reader).innerHTML = '<span class="lang">' + (lang === 'en' ? 'English' : 'Tiếng Việt') + '</span><span>' + longDate(e.date, lang) + '</span><span>' + readTime(e.body, lang) + '</span>';
    $('#essay-title').textContent = e.title;
    $('.crumb', reader).textContent = 'Writing · ' + longDate(e.date, 'en');
    var cover = img(e.cover, 1600, 900);
    var fig = $('.article-hero', reader);
    if (cover) { fig.hidden = false; fig.querySelector('img').src = cover; } else if (e.slug !== 'glp-1') { fig.hidden = true; }
    $('#prose').innerHTML = portable(e.body);
    reader.classList.add('open');
    reader.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    reader.scrollTop = 0;
    document.title = e.title + ' · ' + ($('.brand-name').textContent || '');
  }
  window.addEventListener('hashchange', openEssay);

  // ---------- go ----------
  var url = 'https://' + PID + '.apicdn.sanity.io/v2025-02-19/data/query/' + DS + '?query=' + encodeURIComponent(QUERY);
  fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (res) {
    var d = res.result || {};
    try { renderLab(d.lab); } catch (e) { console.warn('lab', e); }
    try { renderPeople(d.people); } catch (e) { console.warn('people', e); }
    try { renderEssays(d.essays); } catch (e) { console.warn('essays', e); }
    try { renderNews(d.news); } catch (e) { console.warn('news', e); }
    openEssay();
    document.documentElement.setAttribute('data-content', 'live');
  }).catch(function (err) { console.warn('Sanity content not loaded, showing built-in copy.', err); });
})();
