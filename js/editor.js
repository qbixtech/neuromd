/* NeuroMD — editor.js
   Логика страницы редактора: рендер с debounce, тулбар, хоткеи, режимы,
   тема, метрики, шаблоны, импорт/экспорт. */
(function () {
  "use strict";

  var Neuro = (window.Neuro = window.Neuro || {});

  function $(sel) { return document.querySelector(sel); }

  function init() {
    var input = $("#md-input");
    var preview = $("#md-preview");
    var workspace = $("#md-workspace");
    if (!input || !preview || !workspace) return;

    var saveTimer = null;
    var renderTimer = null;
    var currentFile = "document.md";
    var EMPTY = preview.innerHTML;

    /* ---------- Рендер ---------- */
    function render() {
      var md = input.value;
      if (md.trim() === "") {
        preview.innerHTML = EMPTY;
        updateStats();
        return;
      }
      try {
        preview.innerHTML = Neuro.parser.parse(md);
      } catch (e) {
        preview.innerHTML = '<p class="parse-error">Не удалось разобрать Markdown.</p>';
      }
      updateStats();
    }

    function scheduleRender() {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(render, 120);
    }

    /* ---------- Метрики ---------- */
    function updateStats() {
      var text = input.value;
      var words = text.trim() ? text.trim().split(/\s+/).length : 0;
      var chars = text.length;
      var lines = text ? text.split("\n").length : 0;
      setText("#stat-words", words);
      setText("#stat-chars", chars);
      setText("#stat-lines", lines);
    }

    function setText(sel, val) {
      var el = $(sel);
      if (el) el.textContent = val;
    }

    function flashSaved() {
      var msg = $("#status-msg");
      if (!msg) return;
      msg.classList.add("is-ok");
      msg.innerHTML = Neuro.icons.use("i-check") + "<span>Черновик сохранён</span>";
      setTimeout(function () {
        msg.classList.remove("is-ok");
        msg.innerHTML = "<span>Автосохранение включено</span>";
      }, 1400);
    }

    /* ---------- Автосохранение ---------- */
    function scheduleSave() {
      if (!Neuro.storage.isAvailable()) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        if (Neuro.storage.save(input.value)) flashSaved();
      }, 600);
    }

    /* ---------- Тулбар ---------- */
    function wrapSelection(before, after, placeholder) {
      var start = input.selectionStart;
      var end = input.selectionEnd;
      var value = input.value;
      var selected = value.slice(start, end) || placeholder || "";
      var text = before + selected + (after || before);
      input.value = value.slice(0, start) + text + value.slice(end);
      input.focus();
      var caret = start + before.length + selected.length;
      input.setSelectionRange(caret, caret);
      afterChange();
    }

    function prefixLines(prefix, placeholder) {
      var start = input.selectionStart;
      var end = input.selectionEnd;
      var value = input.value;
      var lineStart = value.lastIndexOf("\n", start - 1) + 1;
      var lineEnd = value.indexOf("\n", end);
      if (lineEnd === -1) lineEnd = value.length;
      var block = value.slice(lineStart, lineEnd);
      var lines = block.split("\n");
      var out = lines.map(function (l) {
        if (prefix === "- [ ] ") return "- [ ] " + l.replace(/^-\s*(\[[ xX]\]\s*)?/, "");
        return prefix + l;
      }).join("\n");
      if (block.trim() === "" && placeholder) out = prefix + placeholder;
      input.value = value.slice(0, lineStart) + out + value.slice(lineEnd);
      input.focus();
      input.setSelectionRange(lineStart, lineStart + out.length);
      afterChange();
    }

    function insertBlock(text) {
      var start = input.selectionStart;
      var value = input.value;
      var before = value.slice(0, start);
      var after = value.slice(input.selectionEnd);
      var pad = before.length && !/\n\n$/.test(before) ? (/\n$/.test(before) ? "\n" : "\n\n") : "";
      input.value = before + pad + text + after;
      input.focus();
      var caret = (before + pad + text).length;
      input.setSelectionRange(caret, caret);
      afterChange();
    }

    function afterChange() {
      scheduleRender();
      scheduleSave();
    }

    input.addEventListener("input", afterChange);

    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-action]") : null;
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      switch (action) {
        case "bold": wrapSelection("**", "**", "жирный текст"); break;
        case "italic": wrapSelection("*", "*", "курсив"); break;
        case "code": wrapSelection("`", "`", "код"); break;
        case "heading": prefixLines("## ", "Заголовок"); break;
        case "list": prefixLines("- ", "пункт"); break;
        case "checklist": prefixLines("- [ ] ", "задача"); break;
        case "quote": prefixLines("> ", "цитата"); break;
        case "link": wrapSelection("[", "](https://)", "ссылка"); break;
        case "image": wrapSelection("![", "](image.png)", "описание"); break;
        case "table": insertBlock(
          "| Столбец 1 | Столбец 2 |\n| --- | --- |\n| Значение | Значение |\n"); break;
        case "hr": insertBlock("---\n"); break;
      }
    });

    /* ---------- Хоткеи ---------- */
    input.addEventListener("keydown", function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "b" || e.key === "B")) { e.preventDefault(); wrapSelection("**", "**", "жирный текст"); }
      else if (mod && (e.key === "i" || e.key === "I")) { e.preventDefault(); wrapSelection("*", "*", "курсив"); }
      else if (mod && (e.key === "k" || e.key === "K")) { e.preventDefault(); wrapSelection("[", "](https://)", "ссылка"); }
      else if (e.key === "Tab") {
        e.preventDefault();
        var s = input.selectionStart;
        var en = input.selectionEnd;
        input.value = input.value.slice(0, s) + "  " + input.value.slice(en);
        input.setSelectionRange(s + 2, s + 2);
        afterChange();
      }
    });

    /* ---------- Режимы ---------- */
    function setMode(mode) {
      workspace.setAttribute("data-mode", mode);
      Array.prototype.forEach.call(document.querySelectorAll("[data-mode-btn]"), function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-mode-btn") === mode);
      });
    }
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-mode-btn]") : null;
      if (btn) setMode(btn.getAttribute("data-mode-btn"));
    });

    /* ---------- Шаблоны ---------- */
    var tplSelect = $("#tpl-select");
    if (tplSelect && Neuro.templates) {
      Neuro.templates.list.forEach(function (t) {
        var opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.label;
        tplSelect.appendChild(opt);
      });
      tplSelect.addEventListener("change", function () {
        var text = Neuro.templates.get(tplSelect.value);
        if (!text) return;
        if (input.value.trim() !== "" && !window.confirm("Заменить текущий текст шаблоном?")) {
          tplSelect.value = "";
          return;
        }
        input.value = text;
        currentFile = tplSelect.value === "skill" ? "SKILL.md" : tplSelect.value === "readme" ? "README.md" : "document.md";
        afterChange();
        render();
        Neuro.ui.toast("Шаблон загружен: " + tplSelect.options[tplSelect.selectedIndex].text, "ok");
        tplSelect.value = "";
      });
    }

    /* ---------- Кнопки ---------- */
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-cmd]") : null;
      if (!btn) return;
      var cmd = btn.getAttribute("data-cmd");
      if (cmd === "clear") {
        if (input.value.trim() !== "" && !window.confirm("Очистить редактор?")) return;
        input.value = "";
        Neuro.storage.clear();
        preview.innerHTML = EMPTY;
        updateStats();
        Neuro.ui.toast("Редактор очищен", "ok");
      } else if (cmd === "copy") {
        Neuro.ui.copyText(input.value, function (ok) {
          Neuro.ui.toast(ok ? "Markdown скопирован" : "Не удалось скопировать", ok ? "ok" : "err");
        });
      } else if (cmd === "download-md") {
        Neuro.storage.download(currentFile, input.value, "text/markdown;charset=utf-8");
        Neuro.ui.toast("Файл " + currentFile + " скачан", "ok");
      } else if (cmd === "download-html") {
        /* Парсим актуальный текст, а не preview.innerHTML: он может отставать из-за debounce. */
        var html = Neuro.storage.exportHtml(currentFile.replace(/\.md$/, ""), Neuro.parser.parse(input.value));
        Neuro.storage.download(currentFile.replace(/\.md$/, "") + ".html", html, "text/html;charset=utf-8");
        Neuro.ui.toast("Файл HTML скачан", "ok");
      } else if (cmd === "upload") {
        var fileInput = $("#file-input");
        if (fileInput) fileInput.click();
      }
    });

    var fileInput = $("#file-input");
    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        Neuro.storage.readFile(file, function (err, text) {
          if (err) { Neuro.ui.toast("Не удалось прочитать файл", "err"); return; }
          input.value = text;
          currentFile = file.name.replace(/\.[^.]+$/, "") + ".md";
          afterChange();
          render();
          Neuro.ui.toast("Загружено: " + file.name, "ok");
          fileInput.value = "";
        });
      });
    }

    /* ---------- Старт ---------- */
    var saved = Neuro.storage.load();
    if (saved && saved.trim() !== "") {
      input.value = saved;
      render();
      var msg = $("#status-msg");
      if (msg) msg.innerHTML = "<span>Восстановлен черновик из прошлой сессии</span>";
    } else {
      preview.innerHTML = EMPTY;
      updateStats();
    }

    if (!Neuro.storage.isAvailable()) {
      var sm = $("#status-msg");
      if (sm) sm.innerHTML = "<span>Автосохранение недоступно</span>";
    }

    setMode("split");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
