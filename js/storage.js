/* NeuroMD — storage.js
   Сохранение черновика в localStorage, импорт/экспорт файлов.
   Все операции с localStorage обёрнуты в try/catch: в приватном режиме
   или при запрете хранилища редактор продолжает работать без автосохранения. */
(function () {
  "use strict";

  var Neuro = (window.Neuro = window.Neuro || {});
  var KEY = "neuromd.draft";
  var THEME_KEY = "neuromd.theme";
  var MAX_FILE_SIZE = 5 * 1024 * 1024;
  var available = null;

  function safeFilename(name) {
    return String(name || "document")
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "document";
  }

  function canUse() {
    if (available !== null) return available;
    try {
      var probe = "__neuromd_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      available = true;
    } catch (e) {
      available = false;
    }
    return available;
  }

  function download(filename, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = safeFilename(filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      return true;
    } catch (e) {
      return false;
    }
  }

  function readFile(file, cb) {
    try {
      if (!file || typeof file.size !== "number") {
        cb(new Error("invalid file"), null);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        cb(new Error("file is too large"), null);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () { cb(null, String(reader.result)); };
      reader.onerror = function () { cb(reader.error || new Error("read error"), null); };
      reader.readAsText(file, "utf-8");
    } catch (e) {
      cb(e, null);
    }
  }

  function exportHtml(title, bodyHtml) {
    var t = String(title || "Документ").replace(/[<>&]/g, "");
    return "<!DOCTYPE html>\n" +
      '<html lang="ru">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      "<title>" + t + "</title>\n<style>\n" +
      "body{max-width:820px;margin:40px auto;padding:0 20px;font-family:system-ui,'Segoe UI',sans-serif;line-height:1.7;color:#10182a}\n" +
      "pre{background:#0b0f19;color:#cfe3ff;padding:14px 16px;border-radius:8px;overflow-x:auto}\n" +
      "code{font-family:Consolas,monospace}\n" +
      "table{border-collapse:collapse;width:100%}th,td{border:1px solid #c6d2e6;padding:8px 12px}\n" +
      "blockquote{border-left:3px solid #12b6d6;margin:0;padding:6px 16px;color:#4a5a76}\n" +
      "img{max-width:100%}\n" +
      "</style>\n</head>\n<body>\n" + bodyHtml + "\n</body>\n</html>";
  }

  Neuro.storage = {
    isAvailable: canUse,
    save: function (md) {
      if (!canUse()) return false;
      try { window.localStorage.setItem(KEY, md); return true; }
      catch (e) { return false; }
    },
    load: function () {
      if (!canUse()) return null;
      try { return window.localStorage.getItem(KEY); }
      catch (e) { return null; }
    },
    clear: function () {
      if (!canUse()) return false;
      try { window.localStorage.removeItem(KEY); return true; }
      catch (e) { return false; }
    },
    saveTheme: function (theme) {
      if (!canUse()) return false;
      try { window.localStorage.setItem(THEME_KEY, theme); return true; }
      catch (e) { return false; }
    },
    loadTheme: function () {
      if (!canUse()) return null;
      try { return window.localStorage.getItem(THEME_KEY); }
      catch (e) { return null; }
    },
    download: download,
    readFile: readFile,
    exportHtml: exportHtml
  };
})();
