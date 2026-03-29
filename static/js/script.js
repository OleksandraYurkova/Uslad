// MAIN PAGE I BLOCK
document.addEventListener("DOMContentLoaded", () => {
  console.log("SCRIPT JS LOADED");
  const $ = (id) => document.getElementById(id);

  function pluralUA(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function formatDisplay(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  function todayISO() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function addDaysISO(iso, days) {
    const [y, m, d] = iso.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  (function initBurger() {
    const burger = document.getElementById("burger");
    const nav = document.getElementById("nav-menu");
    const closeBtn = document.getElementById("menu-close");

    if (!burger || !nav) return;

    // 🔓 Відкрити / закрити меню
    function toggleMenu() {
      burger.classList.toggle("active");
      nav.classList.toggle("active");

      document.body.style.overflow = nav.classList.contains("active")
        ? "hidden"
        : "auto";
    }
    
    function closeMenu() {
      burger.classList.remove("active");
      nav.classList.remove("active");
      document.body.style.overflow = "auto";
    }

    // 👉 Бургер
    burger.addEventListener("click", toggleMenu);

    // 👉 Хрестик
    if (closeBtn) {
      closeBtn.addEventListener("click", closeMenu);
    }

    // 👉 Клік по пункту меню
    document.querySelectorAll(".hed_nav a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // 👉 Плавний скрол
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
          e.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  })();

  /* =========================================================
     MAIN PAGE II BLOCK — Mobile text slider dots sync
  ========================================================= */
  (function initIIMobileSlider() {
    const slider = document.querySelector(".II_block .desc_slider");
    const dotsWrap = document.querySelector(".II_block .II_slider_dots");
    if (!slider || !dotsWrap) return;

    const dots = Array.from(dotsWrap.querySelectorAll(".II_dot"));
    if (dots.length <= 1) return;

    const setActive = (i) => {
      dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    };

    const getIndexByScroll = () => {
      const w = slider.clientWidth || 1;
      const i = Math.round(slider.scrollLeft / w);
      return Math.max(0, Math.min(dots.length - 1, i));
    };

    let raf = 0;
    slider.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => setActive(getIndexByScroll()));
      },
      { passive: true },
    );

    dots.forEach((dot, i) => {
      dot.style.cursor = "pointer";
      dot.addEventListener("click", () => {
        slider.scrollTo({ left: i * slider.clientWidth, behavior: "smooth" });
        setActive(i);
      });
    });

    window.addEventListener("resize", () => setActive(getIndexByScroll()));
    setActive(getIndexByScroll());
  })();

  /* =========================================================
     MAIN PAGE III BLOCK — Video controls
  ========================================================= */
  (function initVideo() {
    const video = $("usladVideo");
    const overlay = $("videoOverlay");
    const playBtn = $("playBtn");
    const controls = $("videoControls");
    const playPauseBtn = $("playPauseBtn");
    const progressBar = $("progressBar");
    const muteBtn = $("muteBtn");
    const fullscreenBtn = $("fullscreenBtn");

    if (!video || !overlay || !playBtn || !controls) return;

    function showControls() {
      controls.classList.add("active");
    }

    function hideOverlay() {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
      playBtn.style.opacity = "0";
      playBtn.style.pointerEvents = "none";
    }

    function togglePlay() {
      if (video.paused) video.play();
      else video.pause();
    }

    playBtn.addEventListener("click", () => {
      hideOverlay();
      showControls();
      video.play();
    });

    overlay.addEventListener("click", () => {
      hideOverlay();
      showControls();
      video.play();
    });

    if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlay);

    video.addEventListener("play", () => {
      if (playPauseBtn) playPauseBtn.textContent = "⏸";
    });

    video.addEventListener("pause", () => {
      if (playPauseBtn) playPauseBtn.textContent = "⏵";
    });

    if (progressBar) {
      video.addEventListener("timeupdate", () => {
        if (!video.duration) return;
        progressBar.value = String((video.currentTime / video.duration) * 100);
      });

      progressBar.addEventListener("input", () => {
        if (!video.duration) return;
        const pct = Number(progressBar.value) / 100;
        video.currentTime = pct * video.duration;
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        video.muted = !video.muted;
        muteBtn.textContent = video.muted ? "🔇" : "🔊";
      });
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", async () => {
        const container = video.closest(".video-container") || video;
        try {
          if (!document.fullscreenElement) await container.requestFullscreen();
          else await document.exitFullscreen();
        } catch (_) {
          // ignore
        }
      });
    }
  })();

  /* =========================================================
     MAIN PAGE IV BLOCK — Leisure accordion + scroll slider + dots
  ========================================================= */
  function initIvScrollSlider(ivItem) {
    const viewport = ivItem.querySelector(".iv-viewport");
    const dotsWrap = ivItem.querySelector(".slider_dots");
    const slides = Array.from(ivItem.querySelectorAll(".iv-track img"));

    if (!viewport || !dotsWrap || slides.length <= 1) return;

    dotsWrap.innerHTML = "";
    const dots = slides.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Слайд ${i + 1} з ${slides.length}`);
      dot.addEventListener("click", () => {
        viewport.scrollTo({
          left: i * viewport.clientWidth,
          behavior: "smooth",
        });
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    const setActive = (i) =>
      dots.forEach((d, idx) => d.classList.toggle("active", idx === i));

    const getIndex = () => {
      const w = viewport.clientWidth || 1;
      return Math.max(
        0,
        Math.min(dots.length - 1, Math.round(viewport.scrollLeft / w)),
      );
    };

    let raf = 0;
    viewport.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => setActive(getIndex()));
      },
      { passive: true },
    );

    window.addEventListener("resize", () => setActive(getIndex()));
    setActive(0);
  }

  (function initLeisureAccordion() {
    const ivList = document.querySelector(".iv-list");
    if (!ivList) return;

    function closeIvItem(item) {
      const btn = item.querySelector(".iv-btn");
      const details = item.querySelector(".iv-details");
      if (!btn || !details) return;
      item.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      details.hidden = true;
    }

    function openIvItem(item) {
      const btn = item.querySelector(".iv-btn");
      const details = item.querySelector(".iv-details");
      if (!btn || !details) return;

      item.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      details.hidden = false;

      if (!item.dataset.sliderInited) {
        initIvScrollSlider(item);
        item.dataset.sliderInited = "1";
      }
    }

    ivList.addEventListener("click", (e) => {
      const btn = e.target.closest(".iv-btn");
      if (!btn) return;

      const item = btn.closest(".iv-item");
      if (!item) return;

      const details = item.querySelector(".iv-details");
      if (!details) return;

      const isOpen = !details.hidden;

      ivList.querySelectorAll(".iv-item").forEach((it) => {
        if (it !== item) closeIvItem(it);
      });

      if (isOpen) closeIvItem(item);
      else openIvItem(item);
    });
  })();

  /* =========================================================
     MAIN PAGE V BLOCK — Cottages carousel (infinite + swipe + dots)
     - Dots container is your existing: [data-photo-dots]
       (Show dots only in mobile.css, hide on desktop)
  ========================================================= */
  /* =========================================================
   MAIN PAGE V BLOCK — Cottages carousel (infinite + swipe + dots)
   - Dots container: [data-cottages-dots]
   - Show dots only in mobile.css, hide on desktop
========================================================= */
  (function initCottagesCarousel() {
    const carousel = document.querySelector(
      '#cottages [data-carousel="cottages"]',
    );
    if (!carousel) return;

    const viewport = carousel.querySelector(".cottage-viewport");
    const track = carousel.querySelector(".cottage-track");
    const prevBtn = carousel.querySelector("[data-cottages-prev]");
    const nextBtn = carousel.querySelector("[data-cottages-next]");
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    // Real slides before cloning
    const realSlides = Array.from(track.querySelectorAll(".cottage-slide"));
    const realLen = realSlides.length;
    if (realLen <= 1) return;

    // Clone last + first
    const firstClone = realSlides[0].cloneNode(true);
    const lastClone = realSlides[realLen - 1].cloneNode(true);
    firstClone.dataset.clone = "first";
    lastClone.dataset.clone = "last";

    track.insertBefore(lastClone, realSlides[0]);
    track.appendChild(firstClone);

    // All slides now (with clones)
    const slides = Array.from(track.querySelectorAll(".cottage-slide"));

    // Index over slides with clones; start at first real slide
    let index = 1;

    function step() {
      return viewport.getBoundingClientRect().width;
    }

    function setTransform(withAnim = true) {
      track.style.transition = withAnim ? "transform 0.35s ease" : "none";
      track.style.transform = `translateX(-${index * step()}px)`;
    }

    function getRealIndex() {
      // real slides are at indices [1..realLen]
      let ri = index - 1; // 0..realLen-1
      if (ri < 0) ri = realLen - 1;
      if (ri >= realLen) ri = 0;
      return ri;
    }

    // ✅ Dots: use your container [data-cottages-dots]
    const dotsWraps = slides
      .map((s) => s.querySelector("[data-cottages-dots]"))
      .filter(Boolean);

    function buildDots() {
      dotsWraps.forEach((wrap) => {
        wrap.innerHTML = "";
        for (let i = 0; i < realLen; i++) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "cottage-dot" + (i === 0 ? " active" : "");
          b.setAttribute("aria-label", `Котедж ${i + 1} з ${realLen}`);
          b.addEventListener("click", () => goToReal(i));
          wrap.appendChild(b);
        }
      });
    }

    function setActiveDot(realIndex) {
      dotsWraps.forEach((wrap) => {
        const dots = Array.from(wrap.querySelectorAll(".cottage-dot"));
        dots.forEach((d, i) => d.classList.toggle("active", i === realIndex));
      });
    }

    function goToReal(realIndex) {
      index = realIndex + 1; // 0..realLen-1 -> 1..realLen
      setTransform(true);
      setActiveDot(realIndex);
    }

    function prev() {
      index -= 1;
      setTransform(true);
    }

    function next() {
      index += 1;
      setTransform(true);
    }

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    track.addEventListener("transitionend", () => {
      // If we are on clone, jump without animation
      if (index === 0) {
        index = realLen;
        setTransform(false);
      } else if (index === slides.length - 1) {
        index = 1;
        setTransform(false);
      }
      setActiveDot(getRealIndex());
    });

    // Swipe
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    viewport.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        isDragging = true;
      },
      { passive: true },
    );

    viewport.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    viewport.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next();
        else prev();
      }
    });

    window.addEventListener("resize", () => setTransform(false));

    // Start
    buildDots();
    setTransform(false);
    setActiveDot(0);
  })();

  /* =========================================================
     MAIN PAGE VI BLOCK — Booking form (dates, guests, cottage, estimate, submit)
  ========================================================= */
  (function initBooking() {
    const form = $("bookingForm");
    if (!form) return;

    // Date elements
    const checkinInput = $("checkinInput");
    const checkoutInput = $("checkoutInput");
    const checkinText = $("checkinText");
    const checkoutText = $("checkoutText");

    // Summary elements
    const sumCheckin = $("sumCheckin");
    const sumCheckout = $("sumCheckout");
    const sumCottage = $("sumCottage");
    const sumGuests = $("sumGuests");
    const sumPrice = $("sumPrice");

    const checkinBtn = document.querySelector(
      '[data-role="checkin"] .right-icon',
    );
    const checkoutBtn = document.querySelector(
      '[data-role="checkout"] .right-icon',
    );

    // Guests elements
    const MAX_TOTAL = 90;

    const guestsField = $("guestsField");
    const guestsToggle = $("guestsToggle");
    const guestsDropdown = $("guestsDropdown");
    const guestsDone = $("guestsDone");
    const guestsText = $("guestsText");

    const adultsValEl = $("adultsVal");
    const kidsValEl = $("kidsVal");
    const extraValEl = $("extraVal");

    const adultsInput = $("adultsInput");
    const kidsInput = $("kidsInput");
    const extraInput = $("extraInput");
    const petsInput = $("petsInput");
    const petsToggle = $("petsToggle");

    // Cottage elements
    const cottageField = $("cottageField");
    const cottageToggle = $("cottageToggle");
    const cottageDropdown = $("cottageDropdown");
    const cottageText = $("cottageText");
    const cottageDone = $("cottageDone");
    const cottageInput = $("cottageInput");

    // Message
    const msg = $("formMessage");

    /* ---------- Messages ---------- */
    function showMessage(text, ok = true) {
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = text;
      msg.classList.toggle("is-ok", ok);
      msg.classList.toggle("is-error", !ok);
    }

    function hideMessage() {
      if (!msg) return;
      msg.hidden = true;
      msg.textContent = "";
      msg.classList.remove("is-ok", "is-error");
    }

    /* ---------- Date helpers ---------- */
    function openNativePicker(input) {
      if (!input) return;
      if (typeof input.showPicker === "function") input.showPicker();
      else {
        input.focus();
        input.click();
      }
    }

    function syncDatesUI() {
      if (checkinText) {
        checkinText.textContent = checkinInput?.value
          ? formatDisplay(checkinInput.value)
          : "Дата заїзду";
      }
      if (checkoutText) {
        checkoutText.textContent = checkoutInput?.value
          ? formatDisplay(checkoutInput.value)
          : "Дата виїзду";
      }
      if (sumCheckin)
        sumCheckin.textContent = formatDisplay(checkinInput?.value);
      if (sumCheckout)
        sumCheckout.textContent = formatDisplay(checkoutInput?.value);
    }

    if (checkinInput && checkoutInput) {
      checkinInput.min = todayISO();
      checkoutInput.min = todayISO();

      if (checkinBtn)
        checkinBtn.addEventListener("click", () =>
          openNativePicker(checkinInput),
        );
      if (checkoutBtn)
        checkoutBtn.addEventListener("click", () =>
          openNativePicker(checkoutInput),
        );

      checkinInput.addEventListener("change", () => {
        if (!checkinInput.value) return;

        const minCheckout = addDaysISO(checkinInput.value, 1);
        checkoutInput.min = minCheckout;

        if (checkoutInput.value && checkoutInput.value < minCheckout) {
          checkoutInput.value = "";
        }

        syncDatesUI();
        estimatePrice();
      });

      checkoutInput.addEventListener("change", () => {
        if (!checkoutInput.value) return;

        if (!checkinInput.value) {
          checkoutInput.value = "";
          alert("Спочатку оберіть дату заїзду.");
          syncDatesUI();
          return;
        }

        const minCheckout = addDaysISO(checkinInput.value, 1);
        if (checkoutInput.value < minCheckout) {
          checkoutInput.value = "";
          alert("Дата виїзду має бути не раніше наступного дня після заїзду.");
        }

        syncDatesUI();
        estimatePrice();
      });

      syncDatesUI();
    }

    /* ---------- Guests ---------- */
    let adults = Number(adultsInput?.value || 1);
    let kids = Number(kidsInput?.value || 0);
    let extra = Number(extraInput?.value || 0);
    let hasPets = Number(petsInput?.value || 0) === 1;

    function guestsFieldText(a, k) {
      const adultsWord = pluralUA(a, "дорослий", "дорослих", "дорослих");
      if (k === 0) return `${a} ${adultsWord}`;
      const kidsWord = k === 1 ? "дитина" : "дітей";
      return `${a} ${adultsWord}, ${k} ${kidsWord}`;
    }

    function guestsSummaryText(a, k, ex, petsOn) {
      const adultsWord = pluralUA(a, "дорослий", "дорослих", "дорослих");
      const kidsWord = k === 1 ? "дитина" : "дітей";
      const base =
        k === 0 ? `${a} ${adultsWord}` : `${a} ${adultsWord}, ${k} ${kidsWord}`;

      const extras = [];
      if (ex > 0) extras.push(`дод. місць: ${ex}`);
      if (petsOn) extras.push("з тваринами");

      return extras.length ? `${base} (${extras.join(", ")})` : base;
    }

    function renderGuestsUI() {
      if (adultsValEl) adultsValEl.textContent = String(adults);
      if (kidsValEl) kidsValEl.textContent = String(kids);
      if (extraValEl) extraValEl.textContent = String(extra);

      if (adultsInput) adultsInput.value = String(adults);
      if (kidsInput) kidsInput.value = String(kids);
      if (extraInput) extraInput.value = String(extra);
      if (petsInput) petsInput.value = hasPets ? "1" : "0";

      if (petsToggle) {
        petsToggle.classList.toggle("is-on", hasPets);
        petsToggle.setAttribute("aria-pressed", String(hasPets));
      }

      const totalPeople = adults + kids;

      const decAdults = guestsDropdown?.querySelector(
        '[data-action="dec"][data-target="adults"]',
      );
      const incAdults = guestsDropdown?.querySelector(
        '[data-action="inc"][data-target="adults"]',
      );
      const decKids = guestsDropdown?.querySelector(
        '[data-action="dec"][data-target="kids"]',
      );
      const incKids = guestsDropdown?.querySelector(
        '[data-action="inc"][data-target="kids"]',
      );
      const decExtra = guestsDropdown?.querySelector(
        '[data-action="dec"][data-target="extra"]',
      );

      if (decAdults) decAdults.disabled = adults <= 1;
      if (decKids) decKids.disabled = kids <= 0;
      if (decExtra) decExtra.disabled = extra <= 0;

      if (incAdults) incAdults.disabled = totalPeople >= MAX_TOTAL;
      if (incKids) incKids.disabled = totalPeople >= MAX_TOTAL;
    }

    function syncGuestsSummary() {
      if (sumGuests)
        sumGuests.textContent = guestsSummaryText(adults, kids, extra, hasPets);
    }

    function openGuests() {
      if (!guestsDropdown || !guestsToggle || !guestsField) return;
      guestsDropdown.hidden = false;
      guestsToggle.setAttribute("aria-expanded", "true");
      guestsField.classList.add("is-open");
    }

    function closeGuests() {
      if (!guestsDropdown || !guestsToggle || !guestsField) return;
      guestsDropdown.hidden = true;
      guestsToggle.setAttribute("aria-expanded", "false");
      guestsField.classList.remove("is-open");
    }

    if (guestsToggle && guestsDropdown && guestsDone && guestsText) {
      guestsToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        guestsDropdown.hidden ? openGuests() : closeGuests();
      });

      guestsDropdown.addEventListener("click", (e) => {
        const btn = e.target.closest(".qty-btn");
        if (!btn) return;

        const action = btn.dataset.action;
        const target = btn.dataset.target;
        const totalPeople = adults + kids;

        if (target === "adults") {
          if (action === "inc" && totalPeople < MAX_TOTAL) adults += 1;
          if (action === "dec" && adults > 1) adults -= 1;
        } else if (target === "kids") {
          if (action === "inc" && totalPeople < MAX_TOTAL) kids += 1;
          if (action === "dec" && kids > 0) kids -= 1;
        } else if (target === "extra") {
          if (action === "inc") extra += 1;
          if (action === "dec" && extra > 0) extra -= 1;
        }

        renderGuestsUI();
        syncGuestsSummary();
        estimatePrice();
      });

      if (petsToggle) {
        petsToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          hasPets = !hasPets;
          renderGuestsUI();
          syncGuestsSummary();
          estimatePrice();
        });
      }

      guestsDone.addEventListener("click", () => {
        guestsText.textContent = guestsFieldText(adults, kids);
        syncGuestsSummary();
        closeGuests();
        estimatePrice();
      });

      document.addEventListener("click", (e) => {
        if (!guestsDropdown || guestsDropdown.hidden) return;
        if (guestsField && !guestsField.contains(e.target)) closeGuests();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && guestsDropdown && !guestsDropdown.hidden)
          closeGuests();
      });

      renderGuestsUI();
      syncGuestsSummary();
    }

    /* ---------- Cottage ---------- */
    let selectedCottage = "";

    function openCottage() {
      if (!cottageDropdown || !cottageToggle || !cottageField) return;
      cottageDropdown.hidden = false;
      cottageField.classList.add("is-open");
      cottageToggle.setAttribute("aria-expanded", "true");
    }

    function closeCottage() {
      if (!cottageDropdown || !cottageToggle || !cottageField) return;
      cottageDropdown.hidden = true;
      cottageField.classList.remove("is-open");
      cottageToggle.setAttribute("aria-expanded", "false");
    }

    if (
      cottageToggle &&
      cottageDropdown &&
      cottageDone &&
      cottageText &&
      cottageInput
    ) {
      cottageToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        cottageDropdown.hidden ? openCottage() : closeCottage();
      });

      cottageDropdown.addEventListener("click", (e) => {
        const option = e.target.closest(".cottage-option");
        if (!option) return;

        cottageDropdown
          .querySelectorAll(".cottage-option")
          .forEach((o) => o.classList.remove("active"));
        option.classList.add("active");
        selectedCottage = option.dataset.value;
      });

      cottageDone.addEventListener("click", () => {
        if (selectedCottage) {
          cottageText.textContent = selectedCottage;
          cottageInput.value = selectedCottage;
          if (sumCottage) sumCottage.textContent = selectedCottage;
        }
        closeCottage();
        estimatePrice();
      });

      document.addEventListener("click", (e) => {
        if (!cottageField) return;
        if (!cottageField.contains(e.target)) closeCottage();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && cottageDropdown && !cottageDropdown.hidden)
          closeCottage();
      });
    }

    /* ---------- Phone validation ---------- */
    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener("blur", () => {
        const value = phoneInput.value.trim();
        const phoneRegex = /^\+380\d{9}$/;
        if (value && !phoneRegex.test(value)) {
          phoneInput.setCustomValidity(
            "Номер телефону має бути у форматі +380XXXXXXXXX",
          );
        } else {
          phoneInput.setCustomValidity("");
        }
      });

      phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/[^\d+]/g, "");
      });
    }

    /* ---------- Price estimate + submit ---------- */
    let estimateTimer = null;

    async function estimatePrice() {
      if (!sumPrice) return;

      const fd = new FormData(form);
      const checkin = fd.get("checkin");
      const checkout = fd.get("checkout");
      const cottage = fd.get("cottage_type");

      if (!checkin || !checkout || !cottage) {
        sumPrice.textContent = "—";
        return;
      }

      try {
        const res = await fetch("/api/estimate", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok || !data.ok)
          throw new Error(data.error || "Помилка розрахунку");
        sumPrice.textContent = `${data.estimated_price} грн`;
      } catch (err) {
        sumPrice.textContent = "—";
        showMessage(err.message, false);
      }
    }

    function scheduleEstimate() {
      clearTimeout(estimateTimer);
      estimateTimer = setTimeout(estimatePrice, 250);
    }

    function clearUIAfterSubmit() {
      form.reset();

      if (checkinText) checkinText.textContent = "Дата заїзду";
      if (checkoutText) checkoutText.textContent = "Дата виїзду";
      if (guestsText) guestsText.textContent = "Кількість гостей";
      if (cottageText) cottageText.textContent = "Тип котеджу";

      adults = 1;
      kids = 0;
      extra = 0;
      hasPets = false;

      renderGuestsUI();
      syncGuestsSummary();

      if (sumCheckin) sumCheckin.textContent = "—";
      if (sumCheckout) sumCheckout.textContent = "—";
      if (sumCottage) sumCottage.textContent = "—";
      if (sumGuests) sumGuests.textContent = "—";
      if (sumPrice) sumPrice.textContent = "—";
    }

    form.addEventListener("input", scheduleEstimate);
    form.addEventListener("change", scheduleEstimate);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMessage();

      const fd = new FormData(form);

      try {
        const res = await fetch(form.action, { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok || !data.ok)
          throw new Error(data.error || "Не вдалося надіслати заявку");

        showMessage(
          data.message || "Вашу заявку прийнято. Очікуйте на підтвердження.",
          true,
        );
        clearUIAfterSubmit();
      } catch (err) {
        showMessage(err.message, false);
      }
    });

    // Start
    estimatePrice();
  })();
});
