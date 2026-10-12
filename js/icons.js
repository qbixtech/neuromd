/* NeuroMD — SVG-спрайт иконок.
   Инлайнится в DOM при загрузке: внешние <use href="file.svg#id"> не работают
   в браузерах по протоколу file:// (CORS), а офлайн-запуск — обязательное требование. */
(function () {
  "use strict";

  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
    '<defs><style>.ico{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}</style></defs>' +
    '<symbol id="i-editor" viewBox="0 0 24 24"><path class="ico" d="M4 4h16v16H4z"/><path class="ico" d="M8 8h5M8 12h8M8 16h6"/></symbol>' +
    '<symbol id="i-learn" viewBox="0 0 24 24"><path class="ico" d="M3 6l9-3 9 3-9 3-9-3z"/><path class="ico" d="M7 8v5c0 1.7 2.2 3 5 3s5-1.3 5-3V8"/><path class="ico" d="M21 7v6"/></symbol>' +
    '<symbol id="i-skills" viewBox="0 0 24 24"><path class="ico" d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></symbol>' +
    '<symbol id="i-harness" viewBox="0 0 24 24"><circle class="ico" cx="12" cy="5" r="2.4"/><circle class="ico" cx="5" cy="18" r="2.4"/><circle class="ico" cx="19" cy="18" r="2.4"/><path class="ico" d="M12 7.4v4.1M10.3 12.6L6.6 15.9M13.7 12.6l3.7 3.3"/></symbol>' +
    '<symbol id="i-download" viewBox="0 0 24 24"><path class="ico" d="M12 3v11M8 10l4 4 4-4"/><path class="ico" d="M4 19h16"/></symbol>' +
    '<symbol id="i-upload" viewBox="0 0 24 24"><path class="ico" d="M12 15V4M8 8l4-4 4 4"/><path class="ico" d="M4 19h16"/></symbol>' +
    '<symbol id="i-copy" viewBox="0 0 24 24"><rect class="ico" x="9" y="9" width="11" height="11" rx="2"/><path class="ico" d="M5 15V6a2 2 0 012-2h9"/></symbol>' +
    '<symbol id="i-clear" viewBox="0 0 24 24"><path class="ico" d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path class="ico" d="M10 11v6M14 11v6"/></symbol>' +
    '<symbol id="i-bold" viewBox="0 0 24 24"><path class="ico" d="M7 4h6a4 4 0 010 8H7zM7 12h7a4 4 0 010 8H7z"/></symbol>' +
    '<symbol id="i-italic" viewBox="0 0 24 24"><path class="ico" d="M10 4h8M6 20h8M14 4l-4 16"/></symbol>' +
    '<symbol id="i-code" viewBox="0 0 24 24"><path class="ico" d="M9 8l-4 4 4 4M15 8l4 4-4 4"/></symbol>' +
    '<symbol id="i-heading" viewBox="0 0 24 24"><path class="ico" d="M6 4v16M18 4v16M6 12h12"/></symbol>' +
    '<symbol id="i-list" viewBox="0 0 24 24"><path class="ico" d="M9 6h11M9 12h11M9 18h11"/><circle class="ico" cx="4.5" cy="6" r="1.1"/><circle class="ico" cx="4.5" cy="12" r="1.1"/><circle class="ico" cx="4.5" cy="18" r="1.1"/></symbol>' +
    '<symbol id="i-checklist" viewBox="0 0 24 24"><path class="ico" d="M4 7l2 2 3-3M4 16l2 2 3-3M12 7h8M12 17h8"/></symbol>' +
    '<symbol id="i-quote" viewBox="0 0 24 24"><path class="ico" d="M6 8h5v5H8v3H5v-5a3 3 0 011-3zM15 8h5v5h-3v3h-3v-5a3 3 0 011-3z"/></symbol>' +
    '<symbol id="i-link" viewBox="0 0 24 24"><path class="ico" d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7L11.6 6.7"/><path class="ico" d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.4-1.4"/></symbol>' +
    '<symbol id="i-image" viewBox="0 0 24 24"><rect class="ico" x="4" y="5" width="16" height="14" rx="2"/><circle class="ico" cx="9" cy="10" r="1.5"/><path class="ico" d="M5 17l4.5-4.5L13 16l3-3 3 3"/></symbol>' +
    '<symbol id="i-table" viewBox="0 0 24 24"><rect class="ico" x="4" y="5" width="16" height="14" rx="1.5"/><path class="ico" d="M4 10h16M4 15h16M10 5v14M15 5v14"/></symbol>' +
    '<symbol id="i-hr" viewBox="0 0 24 24"><path class="ico" d="M3 12h18M7 8v8M17 8v8"/></symbol>' +
    '<symbol id="i-theme" viewBox="0 0 24 24"><circle class="ico" cx="12" cy="12" r="4"/><path class="ico" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></symbol>' +
    '<symbol id="i-menu" viewBox="0 0 24 24"><path class="ico" d="M4 7h16M4 12h16M4 17h16"/></symbol>' +
    '<symbol id="i-close" viewBox="0 0 24 24"><path class="ico" d="M6 6l12 12M18 6L6 18"/></symbol>' +
    '<symbol id="i-external" viewBox="0 0 24 24"><path class="ico" d="M14 4h6v6M20 4l-8 8"/><path class="ico" d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path class="ico" d="M5 12l5 5L19 7"/></symbol>' +
    '<symbol id="i-warn" viewBox="0 0 24 24"><path class="ico" d="M12 4l9 16H3z"/><path class="ico" d="M12 10v4M12 17h.01"/></symbol>' +
    '<symbol id="i-spark" viewBox="0 0 24 24"><path class="ico" d="M12 3v5M12 16v5M3 12h5M16 12h5"/><path class="ico" d="M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3"/></symbol>' +
    '<symbol id="i-terminal" viewBox="0 0 24 24"><rect class="ico" x="3" y="4" width="18" height="16" rx="2"/><path class="ico" d="M7 9l3 3-3 3M13 15h4"/></symbol>' +
    '<symbol id="i-folder" viewBox="0 0 24 24"><path class="ico" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></symbol>' +
    '<symbol id="i-cloud" viewBox="0 0 24 24"><path class="ico" d="M7 18a4 4 0 010-8 5 5 0 019.6-1.4A4 4 0 0117 18z"/></symbol>' +
    '<symbol id="i-robot" viewBox="0 0 24 24"><rect class="ico" x="5" y="8" width="14" height="11" rx="3"/><circle class="ico" cx="10" cy="13" r="1.2"/><circle class="ico" cx="14" cy="13" r="1.2"/><path class="ico" d="M12 8V5M9 19v2M15 19v2"/></symbol>' +
    "</svg>";

  var Neuro = (window.Neuro = window.Neuro || {});

  Neuro.icons = {
    mount: function () {
      try {
        if (document.getElementById("neuro-icon-sprite")) return;
        var holder = document.createElement("div");
        holder.id = "neuro-icon-sprite";
        holder.innerHTML = SPRITE;
        var svg = holder.firstChild;
        if (svg && svg.setAttribute) svg.setAttribute("id", "neuro-icon-sprite");
        document.body.insertBefore(svg || holder, document.body.firstChild);
      } catch (e) {
        /* Иконки не критичны для работы страницы — молча деградируем. */
      }
    },
    /* Возвращает HTML-строку иконки: Neuro.icons.use("i-download", "btn__ico") */
    use: function (id, cls) {
      return (
        '<svg class="icon ' + (cls || "") + '" aria-hidden="true" focusable="false"><use href="#' + id + '" xlink:href="#' + id + '"></use></svg>'
      );
    }
  };

  Neuro.icons.mount();
})();
