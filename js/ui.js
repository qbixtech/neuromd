/* NeuroMD — ui.js
   Общий интерфейс: мобильное меню, аккордеоны, копирование кода,
   reveal-анимации, подсветка активной страницы, тема. */
(function () {
  "use strict";

  var Neuro = (window.Neuro = window.Neuro || {});
  document.documentElement.classList.add("js");

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ---------- Мобильное меню ---------- */
  function initNav() {
    var toggle = $("#nav-toggle");
    var links = $("#nav-links");
    if (!toggle || !links) return;

    toggle.setAttribute("aria-controls", "nav-links");

    function closeMenu(restoreFocus) {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (restoreFocus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      var open = !links.classList.contains("is-open");
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) closeMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) closeMenu(true);
    });
    document.addEventListener("click", function (e) {
      if (!links.classList.contains("is-open")) return;
      if (!e.target.closest || (!e.target.closest(".nav") && !e.target.closest("#nav-links"))) {
        closeMenu(false);
      }
    });
  }

  /* ---------- Активная страница ---------- */
  function initActiveLink() {
    var here = location.pathname.split("/").pop() || "index.html";
    $$(".nav__link").forEach(function (a) {
      /* Сравниваем по имени файла: ссылки бывают вида pages/editor.html и ../index.html. */
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href === here) a.classList.add("is-active");
    });
  }

  /* ---------- Аккордеоны ---------- */
  function initAccordions() {
    var accordionIndex = 0;
    $$(".accordion__head").forEach(function (head) {
      var item = head.parentElement;
      var body = item.querySelector(".accordion__body");
      if (body) {
        var bodyId = body.id || "accordion-body-" + accordionIndex++;
        body.id = bodyId;
        head.setAttribute("aria-controls", bodyId);
        body.setAttribute("aria-hidden", "true");
      }
      head.addEventListener("click", function () {
        var item = head.parentElement;
        var body = item.querySelector(".accordion__body");
        var open = item.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
        if (body) body.setAttribute("aria-hidden", open ? "false" : "true");
        if (body) body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
      });
    });
    /* Пересчёт высоты открытых блоков при изменении размера окна. */
    window.addEventListener("resize", function () {
      $$(".accordion__item.is-open .accordion__body").forEach(function (body) {
        body.style.maxHeight = body.scrollHeight + "px";
      });
    });
  }

  /* ---------- Копирование кода ---------- */
  function copyText(text, onDone) {
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var copied = document.execCommand("copy");
        document.body.removeChild(ta);
        onDone(copied);
      } catch (e) {
        onDone(false);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback);
    } else {
      fallback();
    }
  }

  function initCopyButtons() {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-copy");
        var codeWrap = btn.closest(".code");
        var node = target ? $(target) : (codeWrap ? codeWrap.querySelector("pre") : null);
        if (!node) return;
        var text = node.innerText;
        copyText(text, function (ok) {
          var label = btn.querySelector(".code__copy-label") || btn;
          var old = label.textContent;
          if (ok) btn.classList.add("is-done");
          if (label !== btn) label.textContent = ok ? "Скопировано" : "Ошибка";
          toast(ok ? "Скопировано в буфер обмена" : "Не удалось скопировать", ok ? "ok" : "err");
          setTimeout(function () {
            btn.classList.remove("is-done");
            if (label !== btn) label.textContent = old;
          }, 1600);
        });
      });
    });
  }

  /* ---------- Reveal-анимации ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    items.forEach(function (el) { el.classList.add("reveal--pending"); });
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Тема ---------- */
  function applyTheme(theme) {
    document.documentElement.classList.toggle("theme-light", theme === "light");
    $$("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    });
  }

  function initTheme() {
    var saved = Neuro.storage && Neuro.storage.loadTheme ? Neuro.storage.loadTheme() : null;
    applyTheme(saved === "light" ? "light" : "dark");
    $$("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var light = document.documentElement.classList.toggle("theme-light");
        applyTheme(light ? "light" : "dark");
        if (Neuro.storage && Neuro.storage.saveTheme) {
          Neuro.storage.saveTheme(light ? "light" : "dark");
        }
        toast(light ? "Светлая тема" : "Тёмная тема", "ok");
      });
    });
  }

  /* ---------- Toast ---------- */
  var toastStack = null;
  function toast(message, kind) {
    if (!toastStack) {
      toastStack = document.createElement("div");
      toastStack.className = "toast-stack";
      toastStack.setAttribute("aria-live", "polite");
      toastStack.setAttribute("aria-atomic", "true");
      document.body.appendChild(toastStack);
    }
    var el = document.createElement("div");
    var safeKind = kind === "ok" || kind === "err" || kind === "warn" ? kind : "";
    el.className = "toast" + (safeKind ? " toast--" + safeKind : "");
    el.setAttribute("role", "status");
    var iconId = kind === "err" ? "i-warn" : kind === "warn" ? "i-warn" : "i-check";
    el.innerHTML = Neuro.icons.use(iconId);
    var textNode = document.createElement("span");
    textNode.textContent = String(message == null ? "" : message);
    el.appendChild(textNode);
    toastStack.appendChild(el);
    setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 2400);
  }

  /* ---------- Готовые примеры (демо MD -> результат) ---------- */
  function initDemos() {
    $$('[data-demo]').forEach(function (node) {
      var pre = node.querySelector("pre code") || node.querySelector("pre");
      var out = node.querySelector(".demo__out");
      if (!pre || !out || !Neuro.parser) return;
      var md = pre.textContent;
      try { out.innerHTML = Neuro.parser.parse(md); } catch (e) { /* оставляем пустым */ }
    });
  }

  function init() {
    initNav();
    initActiveLink();
    initAccordions();
    initCopyButtons();
    initReveal();
    initTheme();
    initDemos();
    if (Neuro.bg && Neuro.bg.init) Neuro.bg.init();
  }

  Neuro.ui = {
    init: init,
    toast: toast,
    copyText: copyText,
    applyTheme: applyTheme
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
