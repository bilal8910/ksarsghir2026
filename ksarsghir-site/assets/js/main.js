/* ============================================
   KSAR SGHIR — Core JavaScript (Lazy Loaded)
   ============================================ */

var KS = KS || {};

/* ---------- CONFIG ---------- */
KS.config = {
  lat: 35.6897,
  lon: -5.5597,
  weatherKey: "bd5e378503939ddaee76f12ad7a97608",
  whatsapp: "212708053745",
  siteUrl: "https://www.ksarsghir.com"
};

/* ---------- LAZY LOADER (IntersectionObserver) ---------- */
KS.lazyObserver = null;
KS.lazyCallbacks = {};

KS.registerLazy = function(id, callback) {
  KS.lazyCallbacks[id] = callback;
};

KS.initLazyLoader = function() {
  if (!("IntersectionObserver" in window)) {
    /* Fallback: load everything immediately */
    Object.keys(KS.lazyCallbacks).forEach(function(id) {
      KS.lazyCallbacks[id]();
    });
    return;
  }

  KS.lazyObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = entry.target.getAttribute("data-lazy");
        if (id && KS.lazyCallbacks[id]) {
          KS.lazyCallbacks[id]();
          delete KS.lazyCallbacks[id];
          KS.lazyObserver.unobserve(entry.target);
        }
      }
    });
  }, { rootMargin: "200px" });

  document.querySelectorAll("[data-lazy]").forEach(function(el) {
    KS.lazyObserver.observe(el);
  });
};

/* ---------- LAZY IMAGE LOADER ---------- */
KS.initLazyImages = function() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll("img[data-src]").forEach(function(img) {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    });
    return;
  }

  var imgObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: "300px" });

  document.querySelectorAll("img[data-src]").forEach(function(img) {
    imgObserver.observe(img);
  });
};

/* ---------- THEME ---------- */
KS.toggleTheme = function() {
  var isLight = document.body.classList.toggle("light");
  var icon = document.querySelector(".theme-toggle");
  if (icon) icon.textContent = isLight ? "🌙" : "☀️";
  try { localStorage.setItem("ks-theme", isLight ? "light" : "dark"); } catch(e) {}
};

KS.initTheme = function() {
  try {
    var theme = localStorage.getItem("ks-theme") || "dark";
    if (theme === "light") {
      document.body.classList.add("light");
      var icon = document.querySelector(".theme-toggle");
      if (icon) icon.textContent = "🌙";
    }
  } catch(e) {}
};

/* ---------- HERO SLIDER ---------- */
KS.slider = {
  current: 0,
  slides: [],
  dots: [],
  interval: null,

  init: function() {
    this.slides = document.querySelectorAll(".hero__slide");
    this.dots = document.querySelectorAll(".hero__dot");
    if (this.slides.length === 0) return;

    var self = this;
    this.dots.forEach(function(dot, i) {
      dot.addEventListener("click", function() { self.goTo(i); });
    });

    this.interval = setInterval(function() {
      self.goTo(self.current + 1);
    }, 5000);
  },

  goTo: function(n) {
    if (this.slides.length === 0) return;
    this.slides[this.current].classList.remove("active");
    if (this.dots[this.current]) this.dots[this.current].classList.remove("active");
    this.current = (n + this.slides.length) % this.slides.length;
    this.slides[this.current].classList.add("active");
    if (this.dots[this.current]) this.dots[this.current].classList.add("active");
  }
};

/* ---------- WEATHER (Lazy) ---------- */
KS.weatherLoaded = false;

KS.loadWeather = function() {
  if (KS.weatherLoaded) return;
  KS.weatherLoaded = true;

  var url = "https://api.openweathermap.org/data/2.5/weather?lat=" +
    KS.config.lat + "&lon=" + KS.config.lon + "&appid=" +
    KS.config.weatherKey + "&units=metric";

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var lang = KS.getLang();
      var t = KS.i18n[lang];
      var temp = Math.round(d.main.temp);
      var wind = Math.round(d.wind.speed * 3.6);
      var humidity = d.main.humidity;
      var ws = d.wind.speed;
      var seaClass = ws < 5 ? "sea-badge--calm" : (ws < 10 ? "sea-badge--moderate" : "sea-badge--rough");
      var seaText = ws < 5 ? t["weather-sea-calm"] : (ws < 10 ? t["weather-sea-moderate"] : t["weather-sea-rough"]);
      var el = document.getElementById("weather-items");
      if (!el) return;
      el.innerHTML =
        '<div class="weather-item"><span class="weather-item__icon">🌡️</span><div><div class="weather-item__value">' + temp + '°C</div><div class="weather-item__label">' + t["weather-temp"] + '</div></div></div>' +
        '<div class="weather-item"><span class="weather-item__icon">💨</span><div><div class="weather-item__value">' + wind + ' km/h</div><div class="weather-item__label">' + t["weather-wind"] + '</div></div></div>' +
        '<div class="weather-item"><span class="weather-item__icon">💧</span><div><div class="weather-item__value">' + humidity + '%</div><div class="weather-item__label">' + t["weather-humidity"] + '</div></div></div>' +
        '<span class="sea-badge ' + seaClass + '">🌊 ' + seaText + '</span>';
    }).catch(function(){});
};

/* ---------- PRAYER (Lazy) ---------- */
KS.prayerLoaded = false;
KS.prayerInterval = null;

KS.loadPrayers = function() {
  if (KS.prayerLoaded) return;
  KS.prayerLoaded = true;

  var now = new Date();
  var dateStr = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear();
  var url = "https://api.aladhan.com/v1/timings/" + dateStr +
    "?latitude=" + KS.config.lat + "&longitude=" + KS.config.lon + "&method=21";

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var t = d.data.timings;
      var lang = KS.getLang();
      var tr = KS.i18n[lang];
      var prayers = [
        { key: "Fajr", label: tr["prayer-fajr"] },
        { key: "Dhuhr", label: tr["prayer-dhuhr"] },
        { key: "Asr", label: tr["prayer-asr"] },
        { key: "Maghrib", label: tr["prayer-maghrib"] },
        { key: "Isha", label: tr["prayer-isha"] }
      ];
      var nowMins = now.getHours() * 60 + now.getMinutes();
      var nextKey = "Isha", nextMins = 9999;
      prayers.forEach(function(p) {
        var parts = t[p.key].split(":");
        var pm = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        if (pm > nowMins && pm < nextMins) { nextMins = pm; nextKey = p.key; }
      });
      var el = document.getElementById("prayer-times");
      if (!el) return;
      var html = "";
      prayers.forEach(function(p) {
        var isNext = p.key === nextKey;
        html += '<div class="prayer-item' + (isNext ? ' next' : '') + '">' +
          '<div class="prayer-item__name">' + p.label + '</div>' +
          '<div class="prayer-item__time">' + t[p.key] + '</div></div>';
      });
      el.innerHTML = html;
      KS.startCountdown(t[nextKey]);
    }).catch(function(){});
};

KS.pad = function(n) { return n.toString().padStart(2, "0"); };

KS.startCountdown = function(target) {
  if (KS.prayerInterval) clearInterval(KS.prayerInterval);
  KS.prayerInterval = setInterval(function() {
    var now = new Date();
    var tgt = new Date();
    var parts = target.split(":");
    tgt.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
    if (tgt < now) tgt.setDate(tgt.getDate() + 1);
    var diff = Math.max(0, tgt - now);
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    var el = document.getElementById("prayer-countdown");
    if (el) el.textContent = KS.pad(h) + ":" + KS.pad(m) + ":" + KS.pad(s);
  }, 1000);
};

/* ---------- BLOG POSTS (Lazy) ---------- */
KS.blogLoaded = false;

KS.loadBlogPosts = function() {
  if (KS.blogLoaded) return;
  KS.blogLoaded = true;

  fetch("data/posts.json")
    .then(function(r) { return r.json(); })
    .then(function(posts) {
      var grid = document.getElementById("blog-posts-grid");
      if (!grid || !posts.length) return;
      var lang = KS.getLang();
      var html = "";
      posts.slice(0, 6).forEach(function(post) {
        var title = post.title[lang] || post.title.ar || "";
        var excerpt = post.excerpt[lang] || post.excerpt.ar || "";
        var cat = post.category[lang] || post.category.ar || "";
        var date = post.date || "";
        var img = post.image || "";
        var slug = post.slug || "#";
        html += '<article class="post-card">' +
          '<div class="post-card__thumb" style="background-image:url(\'' + img + '\')">' +
          '<span class="post-card__category">' + cat + '</span></div>' +
          '<div class="post-card__body">' +
          '<time class="post-card__date" datetime="' + date + '">' + date + '</time>' +
          '<h3 class="post-card__title"><a href="blog/post.html?slug=' + slug + '">' + title + '</a></h3>' +
          '<p class="post-card__excerpt">' + excerpt + '</p>' +
          '<a href="blog/post.html?slug=' + slug + '" class="post-card__read-more" data-i18n="blog-read-more">اقرأ المزيد ←</a>' +
          '</div></article>';
      });
      grid.innerHTML = html;
    }).catch(function(){});
};

/* ---------- SMOOTH SCROLL ---------- */
KS.initSmoothScroll = function() {
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener("click", function(e) {
      var target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
};

/* ---------- NAV ACTIVE ---------- */
KS.initNavActive = function() {
  var path = window.location.pathname;
  document.querySelectorAll(".nav__link").forEach(function(link) {
    var href = link.getAttribute("href");
    if (href && path.includes(href.replace(/^\.\.?\/?/, "").replace(/index\.html$/, ""))) {
      link.classList.add("active");
    }
  });
};

/* ---------- BACK TO TOP ---------- */
KS.initBackToTop = function() {
  var btn = document.getElementById("back-to-top");
  if (!btn) return;
  window.addEventListener("scroll", function() {
    if (window.scrollY > 400) btn.classList.add("visible");
    else btn.classList.remove("visible");
  });
  btn.addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

/* ---------- SECTION VISIBILITY TRACKER ---------- */
KS.initSectionTracker = function() {
  if (!("IntersectionObserver" in window)) return;

  var sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var section = entry.target.getAttribute("data-section");
        if (section === "weather") KS.loadWeather();
        if (section === "prayer") KS.loadPrayers();
        if (section === "blog") KS.loadBlogPosts();
      }
    });
  }, { rootMargin: "400px" });

  document.querySelectorAll("[data-section]").forEach(function(el) {
    sectionObserver.observe(el);
  });
};

/* ---------- DEFERRED INIT ---------- */
KS.init = function() {
  /* Immediate: theme + language (no network) */
  KS.initTheme();
  KS.setLang(KS.getLang());
  KS.initNavActive();

  /* Immediate: slider (visual, no network) */
  KS.slider.init();

  /* Deferred: lazy image loading */
  KS.initLazyImages();

  /* Deferred: section-based loading (weather/prayer/blog load when scrolled into view) */
  KS.initSectionTracker();

  /* Deferred: lazy loader for registered callbacks */
  KS.initLazyLoader();

  /* Deferred: smooth scroll + back to top */
  KS.initSmoothScroll();
  KS.initBackToTop();

  /* Language button listeners */
  document.querySelectorAll(".lang-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var lang = this.getAttribute("data-lang");
      KS.setLang(lang);
      /* Reload visible APIs with new language */
      if (KS.weatherLoaded) { KS.weatherLoaded = false; KS.loadWeather(); }
      if (KS.prayerLoaded) { KS.prayerLoaded = false; KS.loadPrayers(); }
    });
  });
};

/* Run on DOM ready */
document.addEventListener("DOMContentLoaded", KS.init);
