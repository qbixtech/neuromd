/* NeuroMD — parser.js
   Мини-парсер Markdown в HTML. Без внешних зависимостей.
   Экранирует HTML до разбора, чтобы исключить инъекции.

   Поддержка: заголовки, жирный/курсив, инлайн-код, блоки кода, маркированные
   и нумерованные списки, чек-листы, цитаты, ссылки, картинки, горизонтальные
   линии, таблицы. API: Neuro.parser.parse(md) -> html. */
(function () {
  "use strict";

  var Neuro = (window.Neuro = window.Neuro || {});

  var CODE_TOKEN = "\u0001"; /* маркер строки-заглушки блока кода */
  var INLINE_TOKEN = "\u0000"; /* маркер инлайн-кода */

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* Кавычки в атрибутах. Текст уже экранирован (& < >), остаётся только ". */
  function q(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  /* Декодируем сущности только для проверки протокола, не меняя HTML-вывод. */
  function decodeEntities(s) {
    var value = String(s);
    for (var pass = 0; pass < 2; pass++) {
      var decoded = value.replace(/&(?:#x([0-9a-f]+)|#(\d+)|((?:amp|colon|tab|newline|sol|quest)));/gi,
        function (match, hex, dec, named) {
          if (hex) return String.fromCharCode(parseInt(hex, 16));
          if (dec) return String.fromCharCode(parseInt(dec, 10));
          if (named === "amp") return "&";
          if (named === "colon") return ":";
          if (named === "tab") return "\t";
          if (named === "newline") return "\n";
          if (named === "sol") return "/";
          if (named === "quest") return "?";
          return match;
        });
      if (decoded === value) break;
      value = decoded;
    }
    return value;
  }

  /* Разрешаем только безопасные web-ссылки и относительные пути. */
  function safeUrl(url, allowDataImage) {
    var u = String(url).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    var normalized = decodeEntities(u).replace(/[\u0000-\u0020]+/g, "").toLowerCase();
    var allowedProtocol = allowDataImage
      ? /^https?:/.test(normalized)
      : /^(https?:|mailto:)/.test(normalized);
    var hasProtocol = /^[a-z][a-z0-9+.-]*:/.test(normalized);

    /* Data URLs are intentionally disabled: SVG/data payloads are not needed here. */
    if (/^data:/.test(normalized)) return "#";
    if (hasProtocol && !allowedProtocol) return "#";
    return u || "#";
  }

  function isBlank(s) { return /^\s*$/.test(s); }

  function isBlockStart(s) {
    return (
      /^\s*```/.test(s) ||
      /^\s*\u0001\d+\u0001\s*$/.test(s) ||
      /^\s{0,3}(#{1,6})\s+/.test(s) ||
      /^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(s) ||
      /^\s{0,3}&gt;/.test(s) ||
      /^(\s*)([-*+]|\d+\.)\s+/.test(s)
    );
  }

  /* ---------- Ссылки и картинки ---------- */
  /* Сканирует текст, заменяя [label](url "title") и ![alt](url "title") на токены.
     Учитывает вложенные скобки в URL. Готовый HTML складывает в store. */
  function linkify(text, store) {
    var out = "";
    var i = 0;

    function emit(html) {
      store.push(html);
      return INLINE_TOKEN + "l" + (store.length - 1) + INLINE_TOKEN;
    }

    while (i < text.length) {
      var img = text[i] === "!" && text[i + 1] === "[";
      var link = text[i] === "[";
      if (!img && !link) { out += text[i]; i++; continue; }

      var openBracket = img ? i + 1 : i;
      var depthB = 0;
      var closeBracket = -1;
      for (var j = openBracket; j < text.length; j++) {
        if (text[j] === "[") depthB++;
        else if (text[j] === "]") { depthB--; if (depthB === 0) { closeBracket = j; break; } }
      }
      if (closeBracket === -1 || text[closeBracket + 1] !== "(") {
        out += text[i]; i++; continue;
      }

      var depthP = 0;
      var closeParen = -1;
      for (var k = closeBracket + 1; k < text.length; k++) {
        if (text[k] === "(") depthP++;
        else if (text[k] === ")") { depthP--; if (depthP === 0) { closeParen = k; break; } }
      }
      if (closeParen === -1) { out += text[i]; i++; continue; }

      var label = text.slice(openBracket + 1, closeBracket);
      var inner = text.slice(closeBracket + 2, closeParen).trim();
      var tm = /^(\S+?)(?:\s+"([^"]*)")?$/.exec(inner);
      var url = tm ? tm[1] : inner;
      var title = tm && tm[2] ? tm[2] : "";

      if (img) {
        out += emit('<img src="' + q(safeUrl(url, true)) + '" alt="' + q(label) + '"' +
          (title ? ' title="' + q(title) + '"' : "") + ">");
      } else {
        out += emit('<a href="' + q(safeUrl(url, false)) + '"' +
          (title ? ' title="' + q(title) + '"' : "") +
          ' target="_blank" rel="noopener noreferrer">' + inlineCore(label, false) + "</a>");
      }
      i = closeParen + 1;
    }

    return out;
  }

  /* ---------- Инлайн-разбор ---------- */
  function inline(text) { return inlineCore(text, true); }

  function inlineCore(text, allowLinks) {
    var store = [];

    /* Инлайн-код первым, чтобы внутри него не срабатывали * и _ */
    text = text.replace(/`([^`\n]+)`/g, function (m, c) {
      store.push('<code class="inline">' + c + "</code>");
      return INLINE_TOKEN + "l" + (store.length - 1) + INLINE_TOKEN;
    });

    /* Ссылки и картинки */
    if (allowLinks) text = linkify(text, store);

    /* Жирный */
    text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^\w])__([^_\n]+)__(?!\w)/g, "$1<strong>$2</strong>");

    /* Курсив */
    text = text.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    text = text.replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");

    /* Зачёркивание */
    text = text.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    /* Возврат плейсхолдеров (код, ссылки, картинки) */
    text = text.replace(/\u0000l(\d+)\u0000/g, function (m, i) {
      return store[+i] || "";
    });

    return text;
  }

  /* ---------- Блоки ---------- */
  function splitRow(row) {
    var r = row.trim();
    r = r.replace(/^\|/, "").replace(/\|$/, "");
    return r.split("|").map(function (c) { return c.trim(); });
  }

  function isTableSep(s) {
    return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(s) && /-/.test(s);
  }

  function alignOf(s) {
    var t = s.trim();
    if (/^:-+:$/.test(t) || /^:.*:$/.test(t)) return "center";
    if (/^:/.test(t)) return "left";
    if (/:$/.test(t)) return "right";
    return "";
  }

  function renderTable(header, align, rows) {
    var html = '<table><thead><tr>';
    header.forEach(function (h, idx) {
      html += "<th" + (align[idx] ? ' style="text-align:' + align[idx] + '"' : "") +
        ">" + inline(h) + "</th>";
    });
    html += "</tr></thead><tbody>";
    rows.forEach(function (cells) {
      html += "<tr>";
      for (var c = 0; c < header.length; c++) {
        html += "<td" + (align[c] ? ' style="text-align:' + align[c] + '"' : "") +
          ">" + inline(cells[c] || "") + "</td>";
      }
      html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
  }

  function renderList(items, ordered) {
    var isTask = items.length > 0 && items.every(function (it) { return /^\[[ xX]\]\s?/.test(it); });
    var tag = ordered ? "ol" : "ul";
    var html = "<" + tag + (isTask ? ' class="task-list"' : "") + ">";
    items.forEach(function (it) {
      if (isTask) {
        var checked = /^\[[xX]\]/.test(it);
        var label = it.replace(/^\[[ xX]\]\s?/, "");
        html += "<li" + (checked ? ' class="done"' : "") + '>' +
          '<input type="checkbox" disabled' + (checked ? " checked" : "") + ">" +
          "<span>" + inline(label) + "</span></li>";
      } else {
        html += "<li>" + inline(it) + "</li>";
      }
    });
    html += "</" + tag + ">";
    return html;
  }

  function renderCode(block) {
    var lang = (block.lang || "").replace(/[^\w+#-]/g, "");
    return '<pre><code' + (lang ? ' class="language-' + lang + '"' : "") + ">" +
      block.code + "</code></pre>";
  }

  function blocks(lines, codes) {
    var html = "";
    var i = 0;
    var n = lines.length;

    while (i < n) {
      var line = lines[i];

      /* Блок кода (заглушка) */
      var cm = /^\u0001(\d+)\u0001\s*$/.exec(line);
      if (cm) {
        html += renderCode(codes[+cm[1]]);
        i++;
        continue;
      }

      if (isBlank(line)) { i++; continue; }

      /* Горизонтальная линия */
      if (/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        html += "<hr>";
        i++;
        continue;
      }

      /* Заголовок */
      var h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
      if (h) {
        var lvl = h[1].length;
        html += "<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">";
        i++;
        continue;
      }

      /* Цитата */
      if (/^\s{0,3}&gt;/.test(line)) {
        var ql = [];
        while (i < n && /^\s{0,3}&gt;/.test(lines[i])) {
          ql.push(lines[i].replace(/^\s{0,3}&gt;\s?/, ""));
          i++;
        }
        html += "<blockquote>" + blocks(ql, codes) + "</blockquote>";
        continue;
      }

      /* Таблица */
      if (line.indexOf("|") !== -1 && i + 1 < n && isTableSep(lines[i + 1])) {
        var header = splitRow(line);
        var align = splitRow(lines[i + 1]).map(alignOf);
        i += 2;
        var rows = [];
        while (i < n && !isBlank(lines[i]) && lines[i].indexOf("|") !== -1) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        html += renderTable(header, align, rows);
        continue;
      }

      /* Списки */
      var lm = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(line);
      if (lm) {
        var ordered = /\d+\./.test(lm[2]);
        var items = [];
        while (i < n) {
          var m2 = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(lines[i]);
          if (!m2 || /\d+\./.test(m2[2]) !== ordered) break;
          items.push(m2[3]);
          i++;
        }
        html += renderList(items, ordered);
        continue;
      }

      /* Параграф */
      var para = [line];
      i++;
      while (i < n && !isBlank(lines[i]) && !isBlockStart(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      html += "<p>" + inline(para.join(" ")) + "</p>";
    }

    return html;
  }

  function render(md) {
    var text = String(md == null ? "" : md).replace(/\r\n?/g, "\n");
    var escaped = escapeHtml(text);
    var lines = escaped.split("\n");

    /* Выносим блоки кода, чтобы их содержимое не разбиралось как разметка. */
    var codes = [];
    var out = [];
    var i = 0;
    while (i < lines.length) {
      var fence = /^\s*```(.*)$/.exec(lines[i]);
      if (fence) {
        var lang = fence[1].trim();
        var buf = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++; /* закрывающий забор */
        codes.push({ lang: lang, code: buf.join("\n") });
        out.push(CODE_TOKEN + (codes.length - 1) + CODE_TOKEN);
      } else {
        out.push(lines[i]);
        i++;
      }
    }

    return blocks(out, codes);
  }

  Neuro.parser = {
    parse: function (md) {
      try {
        return render(md);
      } catch (e) {
        return '<p class="parse-error">Не удалось разобрать Markdown.</p>';
      }
    },
    escapeHtml: escapeHtml,
    inline: inline,
    safeUrl: safeUrl
  };
})();
