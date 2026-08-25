/* The Daily Prophet - enhancements. The site works fully without this file. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function make(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ==================================================================
     Ambient newspaper sound - every sound synthesised (no audio files),
     kept extremely faint, ON by default but unlocked only by the first
     user gesture (browser autoplay policy), and routed through one low
     master gain so nothing ever shouts. One engine, one mute.
     ================================================================== */
  var Paper = (function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    var ac = null, master = null, on = true;    // cinematic sound: ON by default (a saved "off" still wins below)
    try { var pref = localStorage.getItem("paperSound"); if (pref !== null) on = (pref === "on"); } catch (e) {}
    var active = [];                             // the voices currently sounding - only one cue plays at a time

    function ensure() {
      if (!AC) return null;
      if (!ac) { ac = new AC(); master = ac.createGain(); master.gain.value = 1.3; master.connect(ac.destination); }
      if (ac.state === "suspended") { try { ac.resume(); } catch (e) {} }
      return ac;
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* never overlap: gracefully hush whatever is still sounding before a new cue begins */
    function hush() {
      if (!ac) return;
      var t = ac.currentTime;
      for (var i = 0; i < active.length; i++) {
        try {
          var g = active[i];
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(Math.max(0.0004, g.gain.value), t);
          g.gain.exponentialRampToValueAtTime(0.0004, t + 0.05);   // 50ms fade-out
        } catch (e) {}
      }
      active = [];
    }
    function voice() { var g = ac.createGain(); g.connect(master); active.push(g); return g; }
    function noise(dur) {
      var n = Math.max(1, Math.floor(ac.sampleRate * dur));
      var b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var s = ac.createBufferSource(); s.buffer = b; return s;
    }
    /* filtered-noise gesture - paper, parchment, cloth, wood, wax textures */
    function grain(o) {
      if (!on || !ensure()) return;
      if (o.solo !== false) hush();
      var t = ac.currentTime, s = noise(o.dur), f = ac.createBiquadFilter();
      f.type = o.type || "bandpass"; f.frequency.value = o.freq; if (o.q) f.Q.value = o.q;
      if (o.to) f.frequency.linearRampToValueAtTime(o.to, t + o.dur);
      var g = voice();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(o.gain, t + (o.atk || o.dur * 0.28));
      g.gain.exponentialRampToValueAtTime(0.0004, t + o.dur);
      s.connect(f); f.connect(g);
      s.start(t); s.stop(t + o.dur + 0.02);
    }
    /* pure partial - brass, glass, bells, gentle magical air */
    function tone(freq, dur, gain, type, solo, f1) {
      if (!on || !ensure()) return;
      if (solo !== false) hush();
      var t = ac.currentTime, o = ac.createOscillator(), g = voice();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);   // a glide (water plip, wand flick)
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + dur * 0.18);
      g.gain.exponentialRampToValueAtTime(0.0003, t + dur);
      o.connect(g); o.start(t); o.stop(t + dur + 0.03);
    }
    function chord(fs, dur, gain, type) { if (!on || !ensure()) return; hush();
      for (var i = 0; i < fs.length; i++) tone(fs[i], dur * (1 - i * 0.07), gain * (1 - i * 0.26), type || "sine", false); }

    /* the organic sound bank - low volume, 150–500ms, one clear cue each */
    var S = {
      /* paper family */
      open:    function () { grain({ dur: .5, freq: 850, q: .3, gain: .009, to: 1500, type: "bandpass" }); },  // newspaper unfolding on load - almost inaudible
      rustle:  function (v){ grain({ dur: rnd(.16,.26), freq: rnd(2200,3000), q: .5, gain: (v || 1) * .010 }); }, // hover
      page:    function () { grain({ dur: .4, freq: 1200, q: .4, gain: .022, to: 2800, atk: .1 }); },           // nav click / page flip
      land:    function () { grain({ dur: .09, freq: 780, q: .8, gain: .04, type: "lowpass", atk: .005 }); },   // paper landing
      unfold:  function () { grain({ dur: .45, freq: 2200, q: .5, gain: .012, to: 1400 }); },                   // parchment opening
      fold:    function () { grain({ dur: .38, freq: 1400, q: .5, gain: .012, to: 2400 }); },                   // reverse fold (scroll closing)
      drag:    function () { grain({ dur: rnd(.16,.24), freq: rnd(1400,1900), q: .4, gain: .009 }); },          // parchment dragging
      close:   function () { grain({ dur: .3, freq: 1000, q: .5, gain: .013, to: 700, type: "lowpass" }); },    // soft paper closing
      scraps:  function () { grain({ dur: rnd(.12,.2), freq: rnd(2600,3400), q: .5, gain: .006, type: "highpass" }); }, // torn scraps
      quill:   function () { grain({ dur: rnd(.09,.15), freq: 3600, q: .9, gain: .006, type: "highpass" }); },  // fountain pen
      /* materials */
      wax:     function () { grain({ dur: .13, freq: 300, q: .8, gain: .044, type: "lowpass", atk: .006 }); },  // wax seal press - deep but soft
      brass:   function () { chord([466.16, 699.2, 932.3], .42, .019, "triangle"); },                           // AI cup - one clean metallic note
      switch_: function () { grain({ dur: .06, freq: 620, q: 1.2, gain: .05, type: "lowpass", atk: .003 });
                             grain({ dur: .03, freq: 2200, q: .8, gain: .02, type: "highpass", solo: false, atk: .002 }); }, // gramophone switch
      footstep:function () { grain({ dur: .1, freq: 210, q: .7, gain: .028, type: "lowpass", atk: .006 }); },   // soft leather on old wood
      fabric:  function () { grain({ dur: rnd(.18,.26), freq: rnd(1600,2200), q: .4, gain: .011, to: 900 }); }, // soft cloth movement
      /* water - the Pensieve */
      ripple:  function () { tone(660, .34, .02, "sine", true, 190);
                             grain({ dur: .3, freq: 900, q: .5, gain: .01, type: "lowpass", solo: false }); },  // satisfying drop
      unripple:function () { tone(190, .32, .014, "sine", true, 640); },                                        // reverse ripple
      swirl:   function () { grain({ dur: .48, freq: 700, q: .3, gain: .011, to: 1800 });
                             tone(880, .4, .006, "sine", false); },                                             // liquid / magical swirl
      /* magical - kept gentle, never theatrical */
      shimmer: function () { chord([1320, 1980, 2640], .45, .009, "sine"); },                                   // Pensieve memory opens
      chime:   function () { chord([784, 1176, 1568], .5, .015, "triangle"); },
      bell:    function () { chord([880, 1320, 1760], .55, .014, "sine"); },                                 // reward - final hat / final scroll
      sparkle: function () { tone(2637, .18, .009, "sine"); },                                                  // one tiny magical spark
      letters: function () { grain({ dur: .5, freq: 1500, q: .3, gain: .009, to: 2400 }); },                     // floating paper letters, gentle air
      wandOn:  function () { tone(720, .28, .016, "sine", true, 1440);
                             setTimeout(function () { tone(2100, .16, .008, "sine", false); }, 150); },         // wand flick
      magFade: function () { chord([880, 660], .6, .012, "sine"); },                                            // gentle magical fade
      /* legacy aliases so existing call-sites map onto organic cues */
      shift:   function () { grain({ dur: rnd(.1,.16), freq: rnd(1800,2400), q: .6, gain: .006 }); },
      settle:  function () { grain({ dur: rnd(.35,.55), freq: rnd(700,1000), q: .4, gain: .01, type: "lowpass" }); },
      crack:   function () { S.wax(); },
      flap:    function () { grain({ dur: rnd(.14,.2), freq: rnd(420,520), q: .6, gain: .03, type: "lowpass", atk: .03 }); },
      breeze:  function () { grain({ dur: rnd(.9,1.3), freq: 1200, q: .3, gain: .008, to: 2000 }); },
      lumosOn: function () { S.wandOn(); },
      lumosOff:function () { S.magFade(); }
    };
    return {
      on: function () { return on; },
      toggle: function () {
        on = !on;
        try { localStorage.setItem("paperSound", on ? "on" : "off"); } catch (e) {}
        if (on) { ensure(); S.switch_(); }        // the old gramophone switch confirms it is on
        return on;
      },
      play: function (name, v) { var f = S[name === "switch" ? "switch_" : name]; if (f) f(v); }
    };
  })();

  /* ---- Today's date in the folio ---- */
  var dateEl = document.getElementById("todayDate");
  if (dateEl) {
    try {
      var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      var months = ["January","February","March","April","May","June","July",
                    "August","September","October","November","December"];
      var now = new Date();
      var d = now.getDate();
      var ord = (d % 10 === 1 && d !== 11) ? "st"
              : (d % 10 === 2 && d !== 12) ? "nd"
              : (d % 10 === 3 && d !== 13) ? "rd" : "th";
      dateEl.textContent = days[now.getDay()] + ", " + d + ord + " " +
                           months[now.getMonth()] + " " + now.getFullYear();
    } catch (e) {}
  }

  /* ---- printed ink: a whisper of letterpress texture on the biggest type.
     The displacement filter is switched on only after this class lands, so
     the text can never vanish if the <filter> is unavailable. ---- */
  (function () {
    var holder = make("div", { "aria-hidden": "true",
      "style": "position:absolute;width:0;height:0;overflow:hidden" });
    holder.innerHTML =
      '<svg width="0" height="0">' +
        '<filter id="ink-press" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.78 0.66" numOctaves="1" seed="4" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter>' +
      '</svg>';
    document.body.appendChild(holder);
    root.classList.add("inked");
  })();

  /* ---- build the magical controls (so every page gets them) ---- */
  var wand = make("div", { id: "wandlight", "aria-hidden": "true" });
  var veil = make("div", { id: "lumos-veil", "aria-hidden": "true" });
  var pt   = make("div", { id: "pageturn", "aria-hidden": "true" });
  var fade = make("div", { id: "turnfade", "aria-hidden": "true" });
  var btn  = make("button", { id: "lumos-toggle", type: "button", "aria-pressed": "false",
                              "aria-label": "Toggle Lumos (dark) mode" },
                  '<span class="ico" aria-hidden="true">✦</span><span class="lbl">Lumos</span>');
  document.body.appendChild(wand);
  document.body.appendChild(veil);
  document.body.appendChild(fade);
  document.body.appendChild(pt);
  document.body.appendChild(btn);

  /* ---- Lumos mode (persisted across pages) ---- */
  function setLumos(on) {
    document.body.classList.toggle("lumos", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.querySelector(".lbl").textContent = on ? "Nox" : "Lumos";
    btn.querySelector(".ico").textContent = on ? "☾" : "✦";
    try { localStorage.setItem("lumos", on ? "1" : "0"); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem("lumos"); } catch (e) {}
  if (saved === "1") setLumos(true);
  btn.addEventListener("click", function () {
    var willOn = !document.body.classList.contains("lumos");
    setLumos(willOn);
    Paper.play(willOn ? "lumosOn" : "lumosOff");
  });

  /* ---- ambient sound: a mute control beside Lumos, plus the hooks ---- */
  var sbtn = make("button", { id: "sound-toggle", type: "button",
                              "aria-pressed": Paper.on() ? "true" : "false",
                              "aria-label": "Toggle newspaper sound" },
                  '<span class="ico" aria-hidden="true">♪</span><span class="lbl">Sound</span>');
  function paintSound() {
    var on = Paper.on();
    sbtn.setAttribute("aria-pressed", on ? "true" : "false");
    sbtn.classList.toggle("on", on);
    sbtn.querySelector(".lbl").textContent = on ? "Sound" : "Muted";
  }
  document.body.appendChild(sbtn);
  paintSound();
  sbtn.addEventListener("click", function () { Paper.toggle(); paintSound(); });

  if (!reduce) {
    /* page hover - an occasional, randomised faint rustle, like a hand
       brushing across old paper (not on every move) */
    var lastHover = 0, hoverGap = 9000;
    window.addEventListener("pointermove", function () {
      var t = Date.now();
      if (t - lastHover < hoverGap) return;
      if (Math.random() < 0.5) { lastHover = t; hoverGap = 7000 + Math.random() * 9000; Paper.play("rustle", 0.8); }
    }, { passive: true });

    /* the photograph - almost nothing: the faintest shift, rarely */
    var fp = document.querySelector(".fp-portrait"), lastFp = 0;
    if (fp) fp.addEventListener("pointerenter", function () {
      var t = Date.now(); if (t - lastFp < 12000) return; lastFp = t; Paper.play("shift");
    });

    /* idle ambience - one rare, random paper sound every 40–60s */
    (function idle() {
      setTimeout(function () {
        if (!document.hidden) {
          var amb = ["settle", "breeze", "quill", "settle"];
          Paper.play(amb[Math.floor(Math.random() * amb.length)]);
        }
        idle();
      }, 40000 + Math.random() * 20000);
    })();
  }

  /* ---- wand light + spotlight veil follow the cursor / finger ---- */
  var px = window.innerWidth / 2, py = window.innerHeight / 2, queued = false;
  function moveLight() {
    wand.style.left = px + "px"; wand.style.top = py + "px";
    veil.style.setProperty("--mx", px + "px");
    veil.style.setProperty("--my", py + "px");
    queued = false;
  }
  function onMove(e) {
    px = e.clientX; py = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(moveLight); }
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  moveLight();

  /* ---- editorial page-turn: the newspaper FOLDS (never slides). The leaf
     pivots on its left spine like real paper - covering when you leave a
     page, peeling up to reveal & settle when you arrive at the next. ---- */
  var FOLD_COVER = "perspective(1800px) rotateY(0deg)";        // flat, over the page
  var FOLD_AWAY  = "perspective(1800px) rotateY(-104deg)";     // stood on the spine, out of view
  if (!reduce) {
    pt.style.transformOrigin = "0% 50%";

    /* arrive: the leaf we turned onto lifts off to the left, and the sheet settles */
    pt.classList.add("down");
    pt.style.transition = "none";
    pt.style.transform = FOLD_COVER;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        pt.style.transition = "transform .34s cubic-bezier(.35,.1,.2,1)";
        pt.style.transform = FOLD_AWAY;
        document.body.classList.add("settling");
        setTimeout(function () { document.body.classList.remove("settling"); Paper.play("open"); }, 160);
        setTimeout(function () { pt.classList.remove("down"); }, 380);
      });
    });

    /* leave: press the headline → it grows into focus as the page fades →
       the newspaper folds over it → navigate once fully covered */
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href) return;
      if (a.target === "_blank" || href.charAt(0) === "#" ||
          /^(https?:|mailto:|tel:)/i.test(href)) return;      // external / anchors / mail
      if (a.hostname && a.hostname !== window.location.hostname) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let new-tab work
      e.preventDefault();

      a.classList.add("turn-press");                          // step 1 - press (~120ms)
      setTimeout(function () {                                 // step 2 - grow into focus, page fades
        document.body.classList.add("turning");
        a.classList.add("turn-grow");
      }, 120);
      setTimeout(function () {                                 // step 3 - the newspaper folds over
        Paper.play("page");
        pt.classList.add("down");
        pt.style.transition = "none";
        pt.style.transform = FOLD_AWAY;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            pt.style.transition = "transform .56s cubic-bezier(.4,.16,.24,1)";
            pt.style.transform = FOLD_COVER;
          });
        });
      }, 270);
      setTimeout(function () {                                // step 4 - under cover
        if (a.hasAttribute("data-return")) goReturn();        // RETURN uses history, not a fixed href
        else window.location.href = href;
      }, 950);
    });
  }

  /* ---- back/forward cache: a page we left mid-fold is restored with the
     newspaper still folded flat over it (blank). The arrive animation does
     not re-run on a bfcache restore, so reset the leaf and lift the cover
     here, or RETURN appears to land on an empty page. ---- */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;                               // only bfcache restores need fixing
    document.body.classList.remove("turning", "settling");
    if (pt) { pt.style.transition = "none"; pt.classList.remove("down"); pt.style.transform = FOLD_AWAY; }
    [].forEach.call(document.querySelectorAll(".turn-press, .turn-grow"), function (el) {
      el.classList.remove("turn-press", "turn-grow");
    });
  });

  /* ---- scroll reveal: stories & pictures set into the page as you read ---- */
  if (!reduce && "IntersectionObserver" in window) {
    var sel = [
      ".portal", ".twoup", ".wellcol > .story.sm", ".rail-item",
      ".masonry > *", ".ledger", ".pull", ".contbox",
      ".owl-list", ".seal", ".fleuron", ".indexbar", ".lead", ".card", ".artifact"
    ].join(", ");
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -4% 0px" });
    // only reveal content that's more than a full screen down, so a short,
    // dense page shows everything at once instead of hiding half of it.
    [].forEach.call(document.querySelectorAll(sel), function (el) {
      if (el.getBoundingClientRect().top > vh * 1.15) {
        el.classList.add("reveal");
        io.observe(el);
      }
    });
  }

  /* ================================================================
     ANONYMOUS TIP - after a quiet minute of reading, an owl slips in
     and drops a sealed note that reveals how the newspaper is read.
     ================================================================ */
  (function () {
    if (!document.querySelector(".frontpage")) return;            // homepage only
    var host = document.querySelector(".frontlead");
    if (!host) return;

    var KEY = "anonTipSeen", seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}

    var interacted = false, flyTimer = null;
    // the reader starting to navigate (clicking a headline / link) cancels the tip
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (a) { interacted = true; if (flyTimer) { clearTimeout(flyTimer); flyTimer = null; } }
    }, true);

    if (getComputedStyle(host).position === "static") host.style.position = "relative";

    /* ---- sound goes through the shared Paper engine, so the one mute
       governs it (and it stays silent unless the reader turned sound on) ---- */
    function flap()   { Paper.play("flap"); }
    function rustle() { Paper.play("rustle", 0.9); }

    /* ---- the note (envelope + the letter that unfolds inside it) ---- */
    var note = make("div", { "class": "anon-note", "role": "button", "tabindex": "0",
                             "aria-label": "Anonymous tip: open a sealed note", "aria-expanded": "false" });
    note.innerHTML =
      '<div class="anon-env">' +
        '<div class="anon-letter">' +
          '<p class="anon-eyebrow">Anonymous Tip</p>' +
          '<p class="anon-lead">The bold words aren’t just headlines.</p>' +
          '<p class="anon-hand">Follow them.</p>' +
          '<span class="anon-crease" aria-hidden="true"></span>' +
        '</div>' +
        '<div class="anon-face">' +
          '<svg class="anon-seam" viewBox="0 0 100 66" preserveAspectRatio="none">' +
            '<path d="M1,65 L38,34 M99,65 L62,34"/></svg>' +
        '</div>' +
        '<div class="anon-flap">' +
          '<svg viewBox="0 0 100 58" preserveAspectRatio="none"><polygon points="0.5,0.5 99.5,0.5 50,56"/></svg>' +
          '<span class="anon-seal" aria-hidden="true"><i></i></span>' +
        '</div>' +
        '<span class="anon-label">Anonymous</span>' +
      '</div>';
    host.appendChild(note);

    var open = false, dismissed = false;
    function openLetter() {
      if (open || dismissed) return;
      open = true; note.classList.add("open"); note.setAttribute("aria-expanded", "true");
      Paper.play("crack"); setTimeout(function () { Paper.play("unfold"); }, 110); // seal cracks, paper unfolds
    }
    function closeLetter() {
      if (!open || dismissed) return;
      dismissed = true; open = false;
      note.classList.remove("open"); note.setAttribute("aria-expanded", "false");
      Paper.play("rustle", 0.8);           // the letter folds shut
      // its message delivered, the note folds shut and quietly leaves the page
      setTimeout(function () {
        note.classList.add("dismiss");
        setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, 820);
      }, 720);
    }
    function toggle() { if (open) closeLetter(); else openLetter(); }
    note.addEventListener("click", toggle);
    note.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

    function place(withDrop) {
      note.classList.add("placed");
      if (withDrop) {
        note.classList.add("dropping");
        note.addEventListener("animationend", function done() {
          note.classList.remove("dropping"); note.removeEventListener("animationend", done);
        });
        setTimeout(function () { Paper.play("land"); }, 640); // envelope lands on the paper
      }
    }

    /* ---- the owl: flies in, dips to the top edge, drops the note, leaves ---- */
    function flyOwl() {
      var owl = make("div", { id: "anon-owl", "aria-hidden": "true" });
      owl.innerHTML =
        '<svg viewBox="0 0 190 200">' +
          '<path class="ow-wingdark l" d="M58,78 C32,80 20,112 26,148 C29,168 42,180 60,177 C51,150 52,108 66,86 Z"/>' +
          '<path class="ow-wingdark r" d="M132,78 C158,80 170,112 164,148 C161,168 148,180 130,177 C139,150 138,108 124,86 Z"/>' +
          '<g class="ow-wingtex">' +
            '<path d="M40,118 q9,4 16,0"/><path d="M40,132 q9,4 16,0"/><path d="M40,146 q9,4 16,0"/>' +
            '<path d="M150,118 q-9,4 -16,0"/><path d="M150,132 q-9,4 -16,0"/><path d="M150,146 q-9,4 -16,0"/>' +
          '</g>' +
          '<path class="ow-body" d="M95,26 C58,26 40,60 40,106 C40,152 64,182 95,182 C126,182 150,152 150,106 C150,60 132,26 95,26 Z"/>' +
          '<path class="ow-body" d="M84,29 L90,15 L95,25 L100,15 L106,29 Z"/>' +
          '<circle class="ow-iris" cx="72" cy="70" r="16"/><circle class="ow-iris" cx="118" cy="70" r="16"/>' +
          '<circle class="ow-pupil" cx="74" cy="72" r="10.5"/><circle class="ow-pupil" cx="116" cy="72" r="10.5"/>' +
          '<circle class="ow-catch" cx="78" cy="67" r="3.8"/><circle class="ow-catch" cx="120" cy="67" r="3.8"/>' +
          '<path class="ow-lid" d="M54,60 Q72,50 91,66 Q73,58 56,66 Z"/>' +
          '<path class="ow-lid" d="M136,60 Q118,50 99,66 Q117,58 134,66 Z"/>' +
          '<path class="ow-beak" d="M95,78 L87,89 Q95,95 103,89 Z"/>' +
          '<g class="ow-tex">' +
            '<path d="M68,110 q8,7 16,0"/><path d="M90,108 q8,7 16,0"/>' +
            '<path d="M78,124 q8,7 16,0"/><path d="M100,122 q8,7 16,0"/>' +
          '</g>' +
          '<g class="ow-foot"><path d="M82,178 l-6,9 M82,178 l0,10 M82,178 l6,9"/><path d="M108,178 l-6,9 M108,178 l0,10 M108,178 l6,9"/></g>' +
          '<g class="ow-parcel">' +
            '<rect class="ow-env" x="65" y="130" width="60" height="40" rx="3"/>' +
            '<path class="ow-envflap" d="M67,133 L95,151 L123,133"/>' +
            '<circle class="ow-wax" cx="95" cy="149" r="8"/>' +
            '<text class="ow-waxh" x="95" y="152.5" text-anchor="middle">H</text>' +
          '</g>' +
        '</svg>';
      document.body.appendChild(owl);
      rustle(1.4, 0.014);
      [0, 340, 700, 1040, 1380, 1720, 2060, 3700, 4050, 4400].forEach(function (ms) { setTimeout(flap, ms); });
      setTimeout(function () { place(true); owl.classList.add("released"); }, 3100); // let the letter go at the low point
      setTimeout(function () { if (owl.parentNode) owl.parentNode.removeChild(owl); }, 5400);
    }

    /* ---- run: the note arrives only after ~20s of complete stillness ---- */
    if (seen) return;                                           // once per visit

    // idle = no real actions; a resting (even slightly jittering) mouse does NOT reset it
    var ACTIVITY = ["pointerdown", "keydown", "wheel", "scroll", "touchstart", "click"];
    function stopWatching() {
      ACTIVITY.forEach(function (ev) { window.removeEventListener(ev, resetIdle, true); });
    }
    function arrive() {
      stopWatching();
      if (interacted) return;                                   // never after they've started navigating
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      if (reduce) { note.classList.add("fade"); place(false); }
      else flyOwl();
    }
    function resetIdle() {
      if (flyTimer) clearTimeout(flyTimer);
      flyTimer = setTimeout(arrive, 20000);                     // 20s of doing nothing
    }
    ACTIVITY.forEach(function (ev) { window.addEventListener(ev, resetIdle, { passive: true, capture: true }); });
    resetIdle();
  })();

  /* ---- every off-site link opens in a new tab (LinkedIn, Behance, Medium,
     WhatsApp, the portfolio site … anything not on this host) ---- */
  [].forEach.call(document.querySelectorAll("a[href]"), function (a) {
    var href = a.getAttribute("href");
    if (!href || !/^https?:\/\//i.test(href)) return;          // only absolute http(s) links
    if (a.hostname && a.hostname === window.location.hostname) return;  // keep same-site links in place
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  /* ================================================================
     TYPOGRAPHY MORPH - a hidden interaction, not autoplay. The line
     shows only "Hands-on learning × shared experiences". Hover (desktop)
     or tap (mobile) and, after a short beat, the letters lift off, float
     and cross, then reassemble into the hidden message - "meaningful /
     connections" - hold 2s, and fly home. Replayable. Honours reduced-
     motion and the shared sound mute. (Not a literal anagram: a few
     letters ink in / dissolve, masked by the motion.)
     ================================================================ */
  (function () {
    if (reduce || !window.requestAnimationFrame) return;
    var eq = document.querySelector(".ff-eq[data-eqmorph]");
    if (!eq) return;

    /* default state: reveal only the two source phrases; the "= message"
       is hidden here but kept in the DOM for the no-JS fallback */
    var opEq = eq.querySelector(".op.eq");
    var dstSpan = eq.querySelector('[data-eqrole="dst"]');
    if (opEq) opEq.style.display = "none";
    if (dstSpan) dstSpan.style.display = "none";

    /* split each source phrase into measurable per-letter spans (once) */
    var srcCh = [];
    [].forEach.call(eq.querySelectorAll('[data-eqrole="src"]'), function (span) {
      var txt = span.textContent, out = "", i, ch;
      for (i = 0; i < txt.length; i++) {
        ch = txt[i];
        out += (ch === " ") ? " "
          : '<span class="eq-ch">' + (ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch) + "</span>";
      }
      span.innerHTML = out;
      [].forEach.call(span.querySelectorAll(".eq-ch"), function (cs) { srcCh.push({ el: cs, ch: cs.textContent }); });
    });

    function isL(c) { return /[a-z]/i.test(c); }
    function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    function sound(name, v) { try { Paper.play(name, v); } catch (e) {} }

    /* trigger: hover (desktop) / tap (mobile), with a beat so a passing
       cursor doesn't trip it. Replayable - never while one run is live. */
    var running = false, timer = null;
    function tryStart() { if (running || timer) return; timer = setTimeout(function () { timer = null; run(); }, 360); }
    function cancelStart() { if (timer) { clearTimeout(timer); timer = null; } }
    eq.addEventListener("mouseenter", tryStart);
    eq.addEventListener("mouseleave", cancelStart);
    eq.addEventListener("touchstart", function () { tryStart(); }, { passive: true });
    /* keyboard-operable: the line is a real control, not decoration */
    eq.setAttribute("tabindex", "0");
    eq.setAttribute("role", "button");
    eq.setAttribute("aria-label", "Reveal the hidden phrase");
    eq.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tryStart(); } });

    function run() {
      running = true;
      try { eq.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}  // keep the whole morph on-screen
      eq.classList.add("eq-morphing");
      var target = null;
      var opX = eq.querySelector(".op:not(.eq)");           // the × operator lifts away too
      if (opX) { opX.style.transition = "opacity .5s ease"; opX.style.opacity = "0"; }

      function cleanup() {
        [].forEach.call(eq.querySelectorAll(".eq-fly"), function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
        [].forEach.call(eq.querySelectorAll('[data-eqrole="src"] .eq-ch'), function (s) { s.style.visibility = ""; });
        if (target && target.node && target.node.parentNode) target.node.parentNode.removeChild(target.node);
        if (opX) { opX.style.opacity = ""; opX.style.transition = ""; }
        eq.classList.remove("eq-morphing");
        running = false;
      }

      try {
        var base = eq.getBoundingClientRect();
        function m(el) { var r = el.getBoundingClientRect(); return { x: r.left - base.left, y: r.top - base.top }; }

        srcCh.forEach(function (o) { var p = m(o.el); o.x = p.x; o.y = p.y; });

        /* the hidden target: two centred lines, same size (letters never scale) */
        var t = make("div", { "class": "eq-target", "aria-hidden": "true" });
        t.innerHTML = '<span class="eq-tl"></span><span class="eq-tl"></span>';
        var lines = t.querySelectorAll(".eq-tl");
        ["meaningful", "connections"].forEach(function (word, li) {
          var out = "";
          for (var i = 0; i < word.length; i++) out += '<span class="eq-ch">' + word[i] + "</span>";
          lines[li].innerHTML = out;
        });
        eq.appendChild(t);
        target = { node: t, letters: [] };
        [].forEach.call(t.querySelectorAll(".eq-ch"), function (cs) {
          var p = m(cs); target.letters.push({ ch: cs.textContent, x: p.x, y: p.y });
        });
        t.style.visibility = "hidden";                    // the flying clones do the showing

        srcCh.forEach(function (o) { o.el.style.visibility = "hidden"; });   // keep layout, hide ink

        var clones = [];
        srcCh.forEach(function (o) {
          if (!isL(o.ch)) return;
          var c = make("span", { "class": "eq-fly" }); c.textContent = o.ch;
          c.style.left = o.x + "px"; c.style.top = o.y + "px";
          eq.appendChild(c);
          clones.push({ el: c, ch: o.ch.toLowerCase(), x0: o.x, y0: o.y });
        });

        var used = {}, inkIn = [];                        // match target letters to source clones
        target.letters.forEach(function (d) {
          var pick = -1, i;
          for (i = 0; i < clones.length; i++) { if (!used[i] && clones[i].ch === d.ch.toLowerCase()) { pick = i; break; } }
          if (pick >= 0) { used[pick] = 1; clones[pick].dst = d; } else inkIn.push(d);
        });

        var fwd = [], maxEnd = 0;
        clones.forEach(function (c, i) {                  // stagger + varied speed → never all at once
          var delay = (i % 6) * 95 + (i * 17 % 160), dur = 1750 + (i * 61 % 950);
          var tx, ty, drift = false;
          if (c.dst) { tx = c.dst.x - c.x0; ty = c.dst.y - c.y0; }
          else { drift = true; var a = (i * 2.3999632) % (Math.PI * 2), r = 150 + (i * 41 % 200); tx = Math.cos(a) * r; ty = Math.sin(a) * r; }
          var len = Math.max(1, Math.sqrt(tx * tx + ty * ty)), px = -ty / len, py = tx / len;
          var bow = ((i % 2) ? 1 : -1) * (60 + (i * 29 % 130));   // perpendicular bow → curved, crossing paths
          c.end = { tx: tx, ty: ty, bx: px * bow, by: py * bow, drift: drift };
          fwd.push({ el: c.el, start: delay, dur: dur, fx: 0, fy: 0, tx: tx, ty: ty, bx: px * bow, by: py * bow,
            rot: ((i % 2) ? 1 : -1) * (14 + (i * 13 % 30)), fo: 1, to: drift ? 0 : 1, hasOp: drift });
          maxEnd = Math.max(maxEnd, delay + dur);
        });

        inkIn.forEach(function (d, k) {                   // the few letters the source can't supply, inked in
          var c = make("span", { "class": "eq-fly" }); c.textContent = d.ch;
          c.style.left = d.x + "px"; c.style.top = d.y + "px"; c.style.opacity = "0"; c.style.transition = "opacity .7s ease";
          eq.appendChild(c); d.clone = c;
          setTimeout(function () { c.style.opacity = "1"; }, Math.max(450, maxEnd - 480) + k * 55);
        });

        sound("letters");                                 // one airy cue: paper letters float and swirl
        setTimeout(function () { sound("sparkle"); }, maxEnd + 60);   // ends on a single tiny spark as they reconnect

        function animate(list, cb) {
          var t0 = performance.now();
          (function step() {
            var tt = performance.now() - t0, alive = false, i, w;
            for (i = 0; i < list.length; i++) {
              w = list[i]; if (w.done) continue;
              var p = (tt - w.start) / w.dur;
              if (p < 0) { alive = true; continue; }
              if (p >= 1) { p = 1; w.done = true; } else alive = true;
              var e = ease(p), bp = Math.sin(p * Math.PI);
              var dx = w.fx + (w.tx - w.fx) * e + w.bx * bp;
              var dy = w.fy + (w.ty - w.fy) * e + w.by * bp;
              w.el.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) rotate(" + (w.rot * bp).toFixed(2) + "deg)";
              if (w.hasOp) w.el.style.opacity = (w.fo + (w.to - w.fo) * e).toFixed(3);
            }
            if (alive) requestAnimationFrame(step); else if (cb) cb();
          })();
        }

        animate(fwd, function () {
          setTimeout(function () {                        // hold the message 2s
            sound("letters");
            inkIn.forEach(function (d) { if (d.clone) d.clone.style.opacity = "0"; });
            if (opX) opX.style.opacity = "";               // the × fades back as the line reforms
            var rev = [];
            clones.forEach(function (c, i) {
              var delay = (i % 6) * 85 + (i * 19 % 140), dur = 1650 + (i * 47 % 820), e = c.end;
              rev.push({ el: c.el, start: delay, dur: dur, fx: e.tx, fy: e.ty, tx: 0, ty: 0, bx: -e.bx, by: -e.by,
                rot: ((i % 2) ? -1 : 1) * (12 + (i * 11 % 24)), fo: e.drift ? 0 : 1, to: 1, hasOp: e.drift });
            });
            animate(rev, function () { sound("rustle", 0.7); cleanup(); });
          }, 2000);
        });
      } catch (e) { cleanup(); }
    }
  })();

  /* ================================================================
     CONTACT LETTER - the contact form is a letter you fold and send.
     On "Fold & Send": the letter lifts out, folds itself, drops back
     into the envelope, the flap closes, a wax seal is stamped, an owl
     carries it off, and an open reply note is left behind. Honours
     reduced-motion and the shared sound mute; degrades to a plain form.
     ================================================================ */
  (function () {
    var stage = document.getElementById("postStage");
    if (!stage) return;
    var scene = document.getElementById("envScene");
    var form = document.getElementById("letterForm");
    if (!scene || !form) return;
    var sent = false;
    function sound(n, v) { try { Paper.play(n, v); } catch (e) {} }

    function note() {
      var done = document.getElementById("postDone");
      if (done) {
        done.innerHTML = '<p class="post-note">Letter received.<br>I’ll read it soon and get back to you.</p>';
        done.classList.add("show");
        try { done.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); } catch (e) {}  // never leave the confirmation below the fold
      }
      sound("bell");
    }

    function finish() {                                     // reduced-motion: jump straight to the sealed state
      form.style.opacity = "0";
      scene.classList.add("flapshut", "waxed");
      scene.style.transition = "none"; scene.style.height = "300px";
      note();
    }

    function run() {                                        // ONE continuous fold → sink → close → seal motion
      try { scene.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
      var h = Math.round(scene.getBoundingClientRect().height);
      scene.style.height = h + "px";                        // lock the height so the collapse can transition
      scene.classList.add("sealing");                       // the letter folds and sinks in (one motion)
      sound("fold");                                        // paper folding - starts on contact with the motion
      setTimeout(function () { scene.classList.add("flapshut"); }, 760);                  // the flap closes over it
      setTimeout(function () { scene.style.height = "300px"; }, 980);                     // the stage settles down with it
      setTimeout(function () { scene.classList.add("waxed"); sound("wax"); }, 1480);      // one soft wax press
      setTimeout(note, 2300);                                                            // the handwritten note beneath
    }

    var nameF = form.querySelector('[name="name"]'), emailF = form.querySelector('[name="email"]'), msgF = form.querySelector('[name="message"]');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function fieldOf(i) { return (i.closest && i.closest(".l-field")) || i.parentNode; }
    function setErr(i, m) { var f = fieldOf(i); if (!f) return; f.classList.add("invalid"); i.setAttribute("aria-invalid", "true"); var e = f.querySelector(".l-err"); if (e) e.textContent = m; }
    function clearErr(i) { var f = fieldOf(i); if (!f) return; f.classList.remove("invalid"); i.removeAttribute("aria-invalid"); var e = f.querySelector(".l-err"); if (e) e.textContent = ""; }
    function validate() {
      var first = null;
      function check(i, ok, m) { if (!i) return; if (ok) { clearErr(i); } else { setErr(i, m); if (!first) first = i; } }
      check(nameF, nameF && nameF.value.trim().length > 0, "Please add your name.");
      check(emailF, emailF && EMAIL_RE.test(emailF.value.trim()), (emailF && emailF.value.trim()) ? "That email doesn't look quite right." : "I'll need your email to reply.");
      check(msgF, msgF && msgF.value.trim().length > 0, "Add a line or two here.");
      return first;
    }
    var lastQuill = 0;
    [nameF, emailF, msgF].forEach(function (i) { if (i) i.addEventListener("input", function () {
      if (fieldOf(i).classList.contains("invalid")) clearErr(i);
      var now = Date.now(); if (now - lastQuill > 110) { lastQuill = now; sound("quill"); }   // fountain pen, not a keyboard - throttled and faint
    }); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sent) return;
      var invalid = validate();
      if (invalid) { invalid.focus(); return; }         // stop and show the first correction
      var name = nameF, email = emailF, msg = msgF;
      sent = true;
      var btn = form.querySelector(".l-send"); if (btn) btn.setAttribute("disabled", "disabled");
      // open the visitor's mail app with the letter pre-filled - no backend, nothing silently lost
      var to = form.getAttribute("data-mailto") || "chetnagrover00@gmail.com";
      var who = name ? name.value.trim() : "", from = email ? email.value.trim() : "";
      var subject = "Hello from your portfolio" + (who ? ", " + who : "");
      var body = (msg ? msg.value.trim() : "") + "\n\n- " + who + (from ? " (" + from + ")" : "");
      var mailto = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      try { window.location.href = mailto; } catch (e) {}
      if (reduce) { finish(); } else { run(); }
    });
  })();

  /* ================================================================
     THE PATH I WALKED - a wandering trail of ink footprints stamps in
     as you scroll, one step at a time (footstep, pause, footstep), and
     the clipping it reaches gives a soft thump and lifts a few pixels.
     Honours reduced-motion and the shared sound mute.
     ================================================================ */
  (function () {
    var path = document.getElementById("path");
    if (!path) return;
    function sound(n, v) { try { Paper.play(n, v); } catch (e) {} }
    /* touch devices have no hover to replay the trail - there, the footprints
       are revealed by scrolling and kept, so the journey builds up under the thumb */
    var noHover = !!(window.matchMedia && window.matchMedia("(hover: none)").matches);

    var FOOT = '<svg viewBox="0 0 22 34"><ellipse cx="11" cy="23" rx="7.4" ry="10.4"/>' +
      '<circle cx="6" cy="8.5" r="2"/><circle cx="10" cy="5.2" r="2.3"/><circle cx="14.4" cy="6.2" r="2.1"/><circle cx="17.8" cy="9.6" r="1.7"/></svg>';

    /* which side of the trail a given edition sits on (as a % across the path) */
    function sideX(clip) {
      if (!clip || !clip.classList || !clip.classList.contains("clip")) return 50;
      if (clip.classList.contains("tl")) return 30;    // left stop
      if (clip.classList.contains("tr")) return 70;    // right stop
      return 50;
    }

    /* weave each trail from the previous stop across to the next - a real path, not a straight line */
    [].forEach.call(path.querySelectorAll(".trail"), function (trail) {
      var fromX = sideX(trail.previousElementSibling);
      var toX = sideX(trail.nextElementSibling);
      var n = parseInt(trail.getAttribute("data-fp"), 10) || 5;
      var prevX = fromX;
      for (var i = 0; i < n; i++) {
        var t = (i + 0.5) / n;                         // 0..1 down the trail
        var ease = t * t * (3 - 2 * t);                // smoothstep: eases out of one side and into the other
        var wander = Math.sin(t * Math.PI * 2) * 3;    // a little natural sway along the way
        var side = (i % 2 === 0) ? -1 : 1;             // left / right foot
        var x = fromX + (toX - fromX) * ease + wander + side * 2.2;   // %
        var y = t * 100;                               // %
        var lean = (x - prevX) * 2.4;                  // toe points the way it walks
        if (lean > 30) lean = 30; else if (lean < -30) lean = -30;
        prevX = x;
        var fp = make("span", { "class": "fp" });
        fp.innerHTML = FOOT;
        fp.style.left = x + "%"; fp.style.top = y + "%";
        fp.style.transform = "translate(-50%,-50%) rotate(" + (180 + lean).toFixed(1) + "deg) scaleX(" + side + ")";
        trail.appendChild(fp);
      }
    });

    /* number each edition like a numbered stop on the map */
    [].forEach.call(path.querySelectorAll(".clip"), function (clip, ci) {
      var no = make("span", { "class": "clip-no", "aria-hidden": "true" });
      no.textContent = (ci + 1 < 10 ? "0" : "") + (ci + 1);
      clip.insertBefore(no, clip.firstChild);
    });

    /* the very last footprint is pressed a little deeper - the journey rests here */
    var lastTrail = path.querySelector(".trail.last");
    if (lastTrail) {
      var lastFeet = lastTrail.querySelectorAll(".fp");
      if (lastFeet.length) lastFeet[lastFeet.length - 1].classList.add("dark");
    }

    if (reduce || !("IntersectionObserver" in window)) {         // no walk - just show the trail
      [].forEach.call(path.querySelectorAll(".fp"), function (f) { f.classList.add("on"); });
      return;
    }

    var LINGER = 5500;                                           // how long each footprint stays before fading (ms)

    function walk(trail, force) {
      if (trail.dataset.walking === "1") return;                // already mid-walk, don't stack
      if (trail.dataset.walked === "1" && !force) return;       // scroll only walks it once
      trail.dataset.walked = "1"; trail.dataset.walking = "1";
      var feet = trail.querySelectorAll(".fp");
      [].forEach.call(feet, function (f) {                       // clear any lingering prints before replay
        if (!f.classList.contains("dark")) f.classList.remove("on");
      });
      var next = trail.nextElementSibling;
      var i = 0;
      (function step() {
        if (i >= feet.length) {                                  // arrived at the next edition
          trail.dataset.walking = "";
          if (next && next.classList.contains("clip")) { next.classList.add("arrived"); sound("land"); }
          if (trail.dataset.hovered === "1") setTimeout(function () { walk(trail, true); }, 500);  // keep walking while hovered
          return;
        }
        var foot = feet[i];
        foot.classList.add("on");                                // press the footprint down
        sound("footstep");                                       // soft leather footstep, exactly on impact
        if (!noHover) setTimeout(function () {                   // hover devices: let it fade a good while later
          if (!foot.classList.contains("dark")) foot.classList.remove("on");
        }, LINGER);                                              // touch: the print stays, so the trail keeps as you scroll
        i++;
        setTimeout(step, 300 + Math.random() * 190);             // footstep … pause … footstep
      })();
    }

    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { walk(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4, rootMargin: "0px 0px -12% 0px" });
    [].forEach.call(path.querySelectorAll(".trail"), function (t) { io.observe(t); });

    /* scroll-driven reveal: the same walk, but never dependent on IntersectionObserver firing.
       On touch this IS the interaction - the journey unrolls under your thumb as you scroll. */
    function revealVisible() {
      [].forEach.call(path.querySelectorAll(".trail"), function (t) {
        if (t.dataset.walked === "1") return;
        var r = t.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.88 && r.bottom > 0) walk(t);
      });
    }
    window.addEventListener("scroll", revealVisible, { passive: true });
    window.addEventListener("resize", revealVisible);
    revealVisible();

    /* hovering anywhere along the journey keeps those footsteps walking - again and again */
    function startHover(trail) { if (!trail) return; trail.dataset.hovered = "1"; walk(trail, true); }
    function stopHover(trail) { if (!trail) return; trail.dataset.hovered = ""; }

    /* touch has no hover, so a tap on the start marker or any stop replays the steps that led there */
    function tapReplay(trail) { if (trail) walk(trail, true); }

    var begin = document.querySelector(".path-begin");
    var firstTrail = path.querySelector(".trail");
    if (begin && firstTrail) {
      begin.addEventListener("mouseenter", function () { startHover(firstTrail); });
      begin.addEventListener("mouseleave", function () { stopHover(firstTrail); });
      begin.addEventListener("click", function () { tapReplay(firstTrail); });
    }
    [].forEach.call(path.querySelectorAll(".trail"), function (t) {
      t.addEventListener("mouseenter", function () { startHover(t); });
      t.addEventListener("mouseleave", function () { stopHover(t); });
    });
    [].forEach.call(path.querySelectorAll(".clip"), function (c) {   // hovering (or tapping) a stop lights the path that led to it
      var prev = c.previousElementSibling;
      if (!prev || !prev.classList.contains("trail")) return;
      c.addEventListener("mouseenter", function () { startHover(prev); });
      c.addEventListener("mouseleave", function () { stopHover(prev); });
      c.addEventListener("click", function () { tapReplay(prev); });
    });
  })();

  /* ================================================================
     THE PENSIEVE  ·  drag a clipping into the basin to relive it.
     Physical, paper-like, no app transitions. Falls back to a click.
     ================================================================ */
  (function () {
    var room = document.getElementById("pensieve");
    if (!room) return;
    var basin = document.getElementById("basin");
    if (!basin) return;
    /* phone: no basin drag - the clippings stay plain links you tap to open */
    if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) return;
    var liquid = basin.querySelector(".basin-liquid");
    function sound(n, v) { try { Paper.play(n, v); } catch (e) {} }

    var veil = make("div", { "class": "pensieve-veil" });
    document.body.appendChild(veil);

    function basinCenter() {
      var r = basin.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, rad: Math.min(r.width, r.height) / 2 };
    }
    function ripple() {
      if (!liquid) return;
      var rp = make("span", { "class": "ripple live" });
      liquid.appendChild(rp);
      setTimeout(function () { if (rp.parentNode) rp.parentNode.removeChild(rp); }, 1600);
    }

    var entering = false;
    function relive(memo, slug) {                       // the clipping falls in, ink melts, the memory fills the screen
      if (entering) return; entering = true;
      var b = basinCenter(), m = memo.getBoundingClientRect();
      var dx = b.x - (m.left + m.width / 2), dy = b.y - (m.top + m.height / 2);
      basin.classList.add("reacting"); basin.style.setProperty("--react", "1");
      ripple(); sound("ripple");                          // the memory touches the liquid - the satisfying drop
      memo.classList.remove("lifting");
      memo.style.transition = "transform .8s cubic-bezier(.5,.15,.2,1), opacity .7s ease, filter .7s ease";
      memo.style.transform = "translate(" + dx + "px," + dy + "px) rotate(9deg) scale(.3)";  // tilt, touch, sink
      memo.style.opacity = "0";
      memo.style.filter = "blur(3px) grayscale(1)";     // the newspaper ink melts into the liquid
      setTimeout(function () { ripple(); sound("swirl"); }, 240);   // the memory opens - a soft liquid swirl
      setTimeout(function () { ripple(); }, 520);
      setTimeout(function () {                            // the ripple expands until the memory fills the view
        veil.style.setProperty("--vx", b.x + "px");
        veil.style.setProperty("--vy", b.y + "px");
        veil.classList.add("show"); void veil.offsetWidth; veil.classList.add("fill");
        sound("page", .5);
      }, 640);
      setTimeout(function () { location.href = "project.html?p=" + encodeURIComponent(slug); }, 1520);
    }

    [].forEach.call(room.querySelectorAll(".memo"), function (memo) {
      var slug = memo.getAttribute("data-p");
      var sx, sy, moved = false, dragging = false;

      function proximity() {                             // liquid reacts; returns true if over the basin mouth
        var b = basinCenter(), r = memo.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var d = Math.hypot(b.x - cx, b.y - cy);
        var near = Math.max(0, 1 - d / (b.rad * 3.4));
        basin.style.setProperty("--react", near.toFixed(3));
        if (near > 0.1) { basin.classList.add("reacting"); if (Math.random() < near * 0.22) ripple(); }
        else basin.classList.remove("reacting");
        return d < b.rad * 1.12;
      }

      memo.addEventListener("pointerdown", function (e) {
        if (entering) return;
        e.preventDefault();
        dragging = true; moved = false; sx = e.clientX; sy = e.clientY;
        try { memo.setPointerCapture(e.pointerId); } catch (i) {}
        memo.classList.add("lifting");
        sound("drag");                                   // parchment lifting off the pile
      });
      memo.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        memo.style.transform = "translate(" + dx + "px," + dy + "px) rotate(0deg) scale(1.03)";
        proximity();
      });
      function release(e) {
        if (!dragging) return; dragging = false;
        memo.classList.remove("lifting");
        var over = proximity();
        if (over || !moved) { relive(memo, slug); }      // dropped in the basin, or a simple tap
        else {                                           // carried away - settle back into place
          basin.classList.remove("reacting"); basin.style.setProperty("--react", "0");
          memo.classList.add("settling"); memo.style.transform = "";
          setTimeout(function () { memo.classList.remove("settling"); }, 560);
        }
      }
      memo.addEventListener("pointerup", release);
      memo.addEventListener("pointercancel", function () {
        if (!dragging) return; dragging = false; moved = true;
        memo.classList.remove("lifting"); memo.classList.add("settling"); memo.style.transform = "";
        basin.classList.remove("reacting"); basin.style.setProperty("--react", "0");
        setTimeout(function () { memo.classList.remove("settling"); }, 560);
      });
      memo.addEventListener("click", function (e) {      // keyboard / no-drag activation
        e.preventDefault();
        if (moved) { moved = false; return; }            // a real drag already handled it
        relive(memo, slug);
      });
    });
  })();

  /* ================================================================
     AI · THE AI CUP  ·  click the silver cup; a parchment rises, unrolls,
     and each visit deals the eight scrolls in a fresh order.
     ================================================================ */
  (function () {
    var stage = document.getElementById("cupstage");
    if (!stage) return;
    var cup = document.getElementById("cup");
    var parch = document.getElementById("parch");
    var headEl = document.getElementById("parchHead");
    var textEl = document.getElementById("parchText");
    var hintEl = document.getElementById("cupHint");
    var progEl = document.getElementById("cupProgress");
    if (!cup || !parch || !headEl || !textEl) return;
    function sound(n, v) { try { Paper.play(n, v); } catch (e) {} }

    var TOPICS = [
      { h: "Think", t: "AI becomes my thinking partner before I start designing. I use it to make sense of research, challenge assumptions, explore possibilities and surface questions I might have missed." },
      { h: "Build", t: "I don't stop at the mockup. I use AI to turn ideas into working prototypes and interfaces, moving from design decisions to something people can actually experience." },
      { h: "Create", t: "From visuals to words, AI helps me explore more directions, find sharper ideas and refine the details that shape an experience." },
      { h: "Evolve", t: "AI keeps the work moving after the first version. I use it to document decisions, learn unfamiliar things faster and continuously improve how I design and build." }
    ];
    /* four cards, always in order: Think -> Build -> Create -> Evolve, then loop back to Think */
    var order = [0, 1, 2, 3], idx = 0, cardNo = 0;
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function nextItem() {
      if (idx >= order.length) idx = 0;                        // after the fourth card, loop back to the first
      cardNo = idx + 1;                                        // 1..4
      return TOPICS[order[idx++]];
    }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var RISE = reduce ? 260 : 1050, UNROLL = reduce ? 260 : 1100, ROLLUP = reduce ? 220 : 1000, SINK = reduce ? 220 : 950;
    var state = "idle", busy = false;

    function setHint(txt) { if (hintEl) hintEl.textContent = txt; }

    function fill(item) {
      headEl.textContent = item.h || "";
      textEl.textContent = item.t || "";
      if (progEl) progEl.textContent = cardNo ? (pad(cardNo) + " / 04") : "";   // 01 / 04 … 04 / 04
    }

    function draw() {
      busy = true; stage.classList.add("busy");
      cup.classList.add("charged");
      var item = nextItem();
      fill(item);
      parch.classList.remove("open");                  // make sure it starts rolled
      parch.setAttribute("aria-hidden", "false");
      setTimeout(function () {                          // one paint in the rolled state, then let it rise
        parch.classList.add("rise");                   // float up out of the cup
        setTimeout(function () {
          parch.classList.add("open"); sound("unfold");                                        // then the parchment unfolds
          try { parch.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }); } catch (e) {}  // if it opened below the fold, bring it up (minimal move)
        }, RISE);
        setTimeout(function () {
          cup.classList.remove("charged");
          busy = false; stage.classList.remove("busy");
          state = "open"; setHint("Click the cup to keep exploring");
        }, RISE + UNROLL);
      }, 40);
    }

    function close(after) {
      busy = true; stage.classList.add("busy");
      parch.classList.remove("open");                  // roll closed
      sound("fold");                                   // reverse paper fold as it rolls shut
      setTimeout(function () { parch.classList.remove("rise"); sound("swirl"); }, ROLLUP);   // soft magical swirl as it sinks back
      setTimeout(function () {
        parch.setAttribute("aria-hidden", "true");
        busy = false;
        if (after) after();
      }, ROLLUP + SINK);
    }

    cup.addEventListener("click", function () {
      if (busy) return;
      if (state === "idle") { state = "drawing"; sound("brass"); draw(); }   // one clean brass note summons the scroll
      else if (state === "open") { close(draw); }
    });

    /* close the interaction: roll the scroll back into the cup and rest */
    function closeToIdle() {
      if (busy || state !== "open") return;
      state = "closing";
      close(function () {
        state = "idle"; idx = 0; cardNo = 0;
        if (progEl) progEl.textContent = "";
        setHint("Click the cup to keep exploring");
      });
    }
    var closeBtn = document.getElementById("parchClose");
    if (closeBtn) closeBtn.addEventListener("click", function (e) { e.stopPropagation(); closeToIdle(); });
    document.addEventListener("keydown", function (e) {  // Escape also closes the open scroll
      if (e.key === "Escape" || e.key === "Esc") closeToIdle();
    });
  })();

  /* ================================================================
     HOME · "connect"  ·  the vertical word sits in a bottom-right pocket.
     A hidden float, dropped to the paragraph's foot, makes only the last
     lines wrap around it, so the prose keeps its full measure above.
     ================================================================ */
  (function () {
    var p = document.querySelector(".frontlead .bigflow .ft");
    var c = p && p.querySelector(".connect-portal");
    if (!p || !c) return;
    var shim = make("span", { "class": "connect-shim", "aria-hidden": "true" });

    function shape(h, ch, w) {
      // a full-height float whose shape excludes ONLY the bottom pocket, so the prose
      // keeps its full measure above and just the last lines wrap around the word
      shim.style.cssFloat = "right";
      shim.style.width = w + "px";
      shim.style.height = h + "px";
      shim.style.shapeMargin = "9px";
      shim.style.shapeOutside = "inset(" + Math.max(0, h - ch - 6) + "px 0px 0px 0px)";
    }
    function layout() {
      var wide = !(window.matchMedia && window.matchMedia("(max-width:760px)").matches);
      if (!wide) { if (shim.parentNode) shim.parentNode.removeChild(shim); return; }   // mobile: connect flows inline
      if (shim.parentNode !== p) p.insertBefore(shim, p.firstChild);
      shim.style.shapeOutside = "none"; shim.style.width = "1px"; shim.style.height = "1px";   // neutral, to read the natural measure
      var cr = c.getBoundingClientRect();
      var cw = Math.ceil(cr.width), ch = Math.ceil(cr.height);
      var h = Math.round(p.getBoundingClientRect().height);
      shape(h, ch, cw + 16);
      var h2 = Math.round(p.getBoundingClientRect().height);   // wrapping the last lines can add a line; correct once
      if (h2 > h + 1) shape(h2, ch, cw + 16);
    }
    layout();
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  })();

  /* ================================================================
     FIRST-VISIT HINT  ·  a faint one-liner the first time someone lands
     on an interactive page, gone the moment they act (and on return).
     ================================================================ */
  (function () {
    function seen(k) { try { return localStorage.getItem("hint_" + k) === "1"; } catch (e) { return false; } }
    function mark(k) { try { localStorage.setItem("hint_" + k, "1"); } catch (e) {} }
    var key, text, targets, anchor, before = false;
    if (document.querySelector(".hatfig")) { key = "skills"; text = "Click a hat to try it on"; targets = document.querySelectorAll(".hatfig .hat"); }
    else if (document.getElementById("path")) { key = "experience"; text = "The footprints appear as you scroll"; targets = null; }
    else return;   // the community morph is left as a hidden surprise - no hint
    if (seen(key)) return;
    if (!anchor) anchor = document.querySelector(".pagehead .deck") || document.querySelector(".deck");
    if (!anchor || !anchor.parentNode) return;

    var h = make("p", { "class": "uxhint", "aria-hidden": "true" });
    h.textContent = text;
    anchor.parentNode.insertBefore(h, before ? anchor : anchor.nextSibling);
    var shownAt = Date.now();
    setTimeout(function () { h.classList.add("in"); }, 400);

    var done = false, scheduled = false, t;
    function fade() {
      if (done) return; done = true; mark(key);
      h.classList.remove("in");
      setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 700);
    }
    function dismiss() {                                  // honour a minimum on-screen time so it never just flashes
      if (done || scheduled) return;
      var wait = 1600 - (Date.now() - shownAt);
      if (wait > 0) { scheduled = true; setTimeout(fade, wait); } else fade();
    }
    t = setTimeout(dismiss, 8000);                        // fades on its own if they just read
    // dismiss the moment they engage the actual interaction (not on stray window events)
    if (targets && targets.length) {
      [].forEach.call(targets, function (el) { el.addEventListener("click", function () { clearTimeout(t); dismiss(); }, { once: true }); });
    } else {
      var base = window.scrollY;
      window.addEventListener("scroll", function onScroll() {
        if (Math.abs(window.scrollY - base) < 80) return;   // only a real, intentional scroll counts
        window.removeEventListener("scroll", onScroll); clearTimeout(t); dismiss();
      }, { passive: true });
    }
  })();

  /* ================================================================
     ENTERING & LEAVING A MEMORY  ·  the project page surfaces, then drains
     ================================================================ */
  (function () {
    if (!document.body || document.body.className.indexOf("memory-page") < 0) return;
    function sound(n, v) { try { Paper.play(n, v); } catch (e) {} }

    var veil = make("div", { "class": "pensieve-veil show fill" });   // start submerged in the liquid
    veil.style.setProperty("--vx", "50%"); veil.style.setProperty("--vy", "50%");
    document.body.appendChild(veil);
    if ("requestAnimationFrame" in window) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { veil.classList.remove("fill"); }); });
    } else { veil.classList.remove("fill"); }
    setTimeout(function () { if (veil.parentNode) veil.parentNode.removeChild(veil); }, 1100);
    sound("shimmer");                                    // the memory surfaces - a gentle Pensieve shimmer

    var back = document.querySelector(".return-archive");
    if (back) back.addEventListener("click", function (e) {           // the memory drains, then we surface in the archive
      e.preventDefault();
      var v = make("div", { "class": "pensieve-veil show" });
      v.style.setProperty("--vx", "50%"); v.style.setProperty("--vy", "50%");
      document.body.appendChild(v);
      void v.offsetWidth; v.classList.add("fill");
      sound("unripple");                                 // the memory drains back - a reverse ripple
      setTimeout(function () { location.href = back.getAttribute("href"); }, 820);
    });
  })();

  /* ================================================================
     THE HATS I NEVER TOOK OFF  ·  wear a hat, read the lesson,
     then stitch them all into one. Physical, handcrafted, no magic.
     ================================================================ */
  (function () {
    var room = document.getElementById("atelier");
    if (!room) return;
    function sound(n, v) { try { Paper.play(n, v); } catch (e) {} }

    var rest = room.querySelector(".hat-rest");
    var clip = room.querySelector(".hat-clip");
    var figs = [].slice.call(room.querySelectorAll(".hatfig"));
    var worn = null;

    function centerDelta(el) {
      var a = el.getBoundingClientRect(), b = rest.getBoundingClientRect();
      return { dx: (b.left + b.width / 2) - (a.left + a.width / 2),
               dy: (b.top + b.height / 2) - (a.top + a.height / 2) };
    }

    function fillClip(fig) {
      var used = (fig.getAttribute("data-used") || "").split("·").map(function (s) { return s.trim(); }).filter(Boolean);
      clip.querySelector(".hc-role").textContent = fig.getAttribute("data-role") || "";
      clip.querySelector(".hc-lesson").textContent = fig.getAttribute("data-lesson") || "";
      var usedHtml = used.length ? "Used in &nbsp;<b>" + used.join("</b> &middot; <b>") + "</b>" : "";
      clip.querySelector(".hc-used").innerHTML = usedHtml;
    }

    function takeOff() {
      if (!worn) return;
      if (slot) { slot.classList.remove("show"); }    // phone: lift the hat off her head
      else {
        var hat = worn.querySelector(".hat");
        hat.style.transition = "transform .55s cubic-bezier(.3,.7,.2,1)";
        hat.style.transform = "";                     // settle back to its resting spot
      }
      worn.classList.remove("worn");
      worn = null;
      clip.classList.remove("show");
      sound("fabric");                                  // the hat lifts away - soft cloth
    }

    var portrait = document.querySelector(".portrait");
    function headScale(hat) {                            // shrink the hat to sit like a real hat on her head
      if (!portrait) return 1;
      var target = portrait.getBoundingClientRect().width * 0.30;   // hat brim ~ a little wider than her head
      var hw = hat.getBoundingClientRect().width;
      return (hw ? target / hw : 1);
    }

    /* phone: the scattered-hat fly doesn't map onto the grid, so instead we
       rest a copy of the chosen hat on her head via a fixed slot in the portrait */
    var narrow = !!(window.matchMedia && window.matchMedia("(max-width: 760px)").matches);
    var slot = null;
    if (narrow && portrait) { slot = make("div", { "class": "worn-hat", "aria-hidden": "true" }); portrait.appendChild(slot); }

    function wear(fig) {
      if (worn === fig) { takeOff(); return; }
      if (worn) takeOff();
      if (slot) {                                       // phone: rest a copy of the chosen hat on her head
        var ink = fig.querySelector(".hat-ink");
        slot.innerHTML = ink ? ink.outerHTML : "";
        slot.style.setProperty("--hatcol", fig.style.getPropertyValue("--hatcol") || "");
        slot.classList.add("show");
        fig.classList.add("worn");
        worn = fig;
        fillClip(fig);
        clip.classList.add("show");
        /* the lesson can sit below the fold on small phones - center it so it's never missed */
        try { clip.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); } catch (e) {}
        sound("fabric");
        return;
      }
      var hat = fig.querySelector(".hat");
      var d = centerDelta(hat);
      var sc = headScale(hat);
      hat.style.transition = "transform .8s cubic-bezier(.34,.08,.2,1)";
      hat.style.transform = "translate(" + d.dx + "px," + d.dy + "px) rotate(0deg) scale(" + sc.toFixed(3) + ")";  // floats up, lands on her head
      fig.classList.add("worn");
      worn = fig;
      fillClip(fig);
      setTimeout(function () { clip.classList.add("show"); }, 380);
      sound("fabric");                                  // the hat settles on - soft fabric movement
    }

    figs.forEach(function (fig) {
      fig.querySelector(".hat").addEventListener("click", function () { wear(fig); });
    });
    var xbtn = clip.querySelector(".hc-x");
    if (xbtn) xbtn.addEventListener("click", takeOff);
  })();

  /* ================================================================
     404 · DOBBY  ·  hover/tap the sock - it wiggles, a folded note
     unfurls, then folds itself away. Three clicks reveal a secret.
     ================================================================ */
  (function () {
    var sock = document.getElementById("dobby-sock");
    if (!sock) return;
    var note = document.getElementById("dobby-note");
    var tip = document.getElementById("dobby-tip");
    function sound(n) { try { Paper.play(n); } catch (e) {} }

    var noteTimer, tipTimer, lastReveal = 0, clicks = 0, resetTimer;

    function hideNote() { if (note) { note.classList.remove("show"); note.setAttribute("aria-hidden", "true"); } }
    function reveal() {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(hideNote, 2600);            // the note folds itself back after ~2.6s
      var now = (window.Date && Date.now) ? Date.now() : +new Date();
      if (now - lastReveal < 360) return;                // ignore the hover+click double-fire
      lastReveal = now;
      sock.classList.remove("wiggle"); void sock.offsetWidth; sock.classList.add("wiggle");  // a gentle wiggle
      sound("fabric");                                   // soft cloth as it stirs
      setTimeout(function () { sock.classList.remove("wiggle"); }, 640);
      if (note) {
        note.classList.add("show"); note.setAttribute("aria-hidden", "false");
        setTimeout(function () { sound("unfold"); }, 230);   // parchment as it unfurls
      }
    }

    sock.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") reveal(); });
    sock.addEventListener("click", function () {
      reveal();
      clicks++; clearTimeout(resetTimer); resetTimer = setTimeout(function () { clicks = 0; }, 2500);
      if (clicks >= 3 && tip) {                           // the three-click secret
        clicks = 0;
        tip.classList.add("show");
        clearTimeout(tipTimer); tipTimer = setTimeout(function () { tip.classList.remove("show"); }, 2000);
      }
    });
  })();

  /* ================================================================
     RETURN  ·  a quiet, history-based "go back" in the header.
     Takes you to wherever you were before this page; home if there
     is no meaningful history. Hover reveals the known destination.
     ================================================================ */
  function goReturn() {
    var sameOrigin = false;
    try { var u = new URL(document.referrer); sameOrigin = (u.origin === location.origin) && (u.href !== location.href); } catch (e) {}
    if (sameOrigin && window.history.length > 1) window.history.back();   // back to where I actually was
    else window.location.href = "index.html";                            // fallback: home
  }
  (function () {
    var links = document.querySelectorAll("a.mast-return");
    if (!links.length) return;
    [].forEach.call(links, function (a) {                 // label always reads "RETURN"; no text change on hover
      if (reduce) {                                       // reduced motion: the page-turn handler is off, so navigate here
        a.addEventListener("click", function (e) { e.preventDefault(); try { Paper.play("page"); } catch (x) {} goReturn(); });
      }
    });
  })();
})();
