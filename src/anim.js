// animações do app tomalerda com anime.js: só melhora o que já existe
(() => {
  if (!window.anime) return;
  // respeita "Animações" desligado na aparência (classe .still) e o reduzir movimento do Windows
  const original = window.anime.animate;
  const parado = () => document.documentElement.classList.contains("still") || document.body?.classList.contains("still") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.anime.animate = (alvo, p = {}) => original(alvo, parado() ? { ...p, duration: 0, delay: 0, loop: false } : p);
  const { animate, stagger } = anime;
  const PARTES = ".heroHead, .card, .quick, .row, .switchRow, .chip, .option, .theme, .section";

  function entrarPagina(p) {
    const itens = [...p.querySelectorAll(PARTES)].filter((e) => e.offsetParent).slice(0, 40);
    animate(itens, { opacity: [0, 1], translateY: [12, 0], duration: 460, delay: stagger(30), ease: "outCubic" });
    const cab = document.querySelector("#pageIcon");
    if (cab) animate(cab, { scale: [0.6, 1], rotate: [-15, 0], duration: 500, ease: "outBack" });
    ["#pageTitle", "#pageSub"].forEach((s, i) => document.querySelector(s) && animate(s, { opacity: [0, 1], translateX: [-8, 0], duration: 400, delay: i * 60 }));
  }

  new MutationObserver((ms) => {
    for (const m of ms) {
      const el = m.target;
      if (el.classList.contains("page") && el.classList.contains("active") && !m.oldValue?.includes("active")) entrarPagina(el);
      if (el.id === "gate" && el.classList.contains("out")) animate(el, { opacity: [1, 0], scale: [1, 1.04], duration: 450, ease: "inQuad" });
      if (el.classList.contains("navItem") && el.classList.contains("active") && !m.oldValue?.includes("active"))
        animate(el.querySelector("svg") || el, { scale: [0.8, 1], duration: 400, ease: "outBack" });
    }
  }).observe(document.body, { attributes: true, attributeFilter: ["class"], attributeOldValue: true, subtree: true });

  // tela de entrada
  addEventListener("DOMContentLoaded", () => {
    const g = document.getElementById("gate");
    if (g) animate(g.querySelectorAll("img, h1, h2, p, input, button, .gateAcc, label"), { opacity: [0, 1], translateY: [14, 0], duration: 600, delay: stagger(50), ease: "outExpo" });
    animate(".navItem", { opacity: [0, 1], translateX: [-12, 0], duration: 500, delay: stagger(35, { start: 1500 }), ease: "outCubic" });
  });

  // botões e interruptores
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button, .toggle, .navItem, .quick, .theme, .chip");
    if (b) animate(b, { scale: [1, 0.95, 1], duration: 280, ease: "outQuad" });
  });

  // números que mudam (contadores do app) dão um pulinho
  new MutationObserver((ms) => {
    for (const m of ms) {
      const el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if (el && /^\s*[\d.,]+\s*$/.test(el.textContent) && el.closest(".card")) animate(el, { scale: [1.15, 1], duration: 350, ease: "outBack" });
    }
  }).observe(document.body, { characterData: true, childList: true, subtree: true });
})();
