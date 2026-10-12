/* NeuroMD — neuro-bg.js
   Анимированный canvas-фон: узлы-нейроны и синапсы, лёгкая реакция на курсор.
   Отключается при prefers-reduced-motion или отсутствии <canvas id="neuro-bg">. */
(function () {
  "use strict";

  var Neuro = (window.Neuro = window.Neuro || {});

  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function accentRgb() {
    try {
      /* Акцент задаётся на body (data-section), поэтому читаем именно оттуда. */
      var v = getComputedStyle(document.body).getPropertyValue("--accent-rgb").trim();
      if (v) return v;
    } catch (e) {}
    return "34, 224, 208";
  }

  function init() {
    var canvas = document.getElementById("neuro-bg");
    if (!canvas || !canvas.getContext) return;
    if (reduced()) return;

    var ctx = canvas.getContext("2d");
    var nodes = [];
    var w = 0;
    var h = 0;
    var dpr = 1;
    var mouse = { x: -9999, y: -9999 };
    var raf = null;
    var rgb = accentRgb();
    var requestFrame = window.requestAnimationFrame || function (callback) {
      return window.setTimeout(callback, 16);
    };
    var cancelFrame = window.cancelAnimationFrame || function (id) {
      window.clearTimeout(id);
    };

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var count = Math.max(24, Math.min(70, Math.round((w * h) / 26000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: 1.2 + Math.random() * 1.8
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      var i, j, a, b, dx, dy, dist, link;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < -20) a.x = w + 20;
        if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20;
        if (a.y > h + 20) a.y = -20;

        dx = a.x - mouse.x;
        dy = a.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          a.x += (dx / (dist || 1)) * 0.5;
          a.y += (dy / (dist || 1)) * 0.5;
        }
      }

      /* Синапсы */
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          a = nodes[i];
          b = nodes[j];
          dx = a.x - b.x;
          dy = a.y - b.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            link = 1 - dist / 150;
            ctx.strokeStyle = "rgba(" + rgb + "," + (link * 0.32).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      /* Узлы */
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = "rgba(" + rgb + ",0.85)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestFrame(step);
    }

    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("mouseleave", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(resize, 200);
    });

    /* Пауза, когда вкладка неактивна — экономим ресурсы. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (raf) cancelFrame(raf);
        raf = null;
      } else if (!raf) {
        raf = requestFrame(step);
      }
    });

    resize();
    raf = requestFrame(step);
  }

  Neuro.bg = { init: init };
})();
