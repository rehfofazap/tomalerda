// componentes no estilo do UI Moments (guanmo-ai/ui-moments, MIT), adaptados ao tomalerda
(() => {
  const css = `
  .hold{position:relative;overflow:hidden}
  .hold .hfill{position:absolute;inset:0;background:rgba(255,255,255,.22);transform-origin:left;transform:scaleX(0);pointer-events:none}
  .hold .hdica{position:absolute;left:0;right:0;bottom:-22px;font-size:11px;opacity:.7;text-align:center;pointer-events:none}
  .bar{position:relative;overflow:hidden}
  .bar #bar{position:relative;overflow:hidden;transition:width .4s ease}
  .bar #bar::after{content:"";position:absolute;inset:-6px -40px;background:radial-gradient(14px 8px at 10px 0,rgba(255,255,255,.35) 98%,transparent) 0 0/28px 8px repeat-x;animation:mare 1.2s linear infinite}
  @keyframes mare{to{transform:translateX(28px)}}
  .odo{display:inline-flex;overflow:hidden;height:1.25em;vertical-align:bottom}
  .odo span{display:inline-block;height:1.25em;line-height:1.25em}
  .toggle{position:relative}
  .tinta{position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px;border-radius:50%;background:currentColor;opacity:.35;pointer-events:none}
  .copiado{transition:background .2s}
  .anelD{position:absolute;inset:-4px;pointer-events:none}`;
  document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
  const A = () => window.anime;

  // 1. segurar para confirmar (botão de apagar)
  function segurar(btn, ms = 1100) {
    if (!btn || btn.dataset.hold) return;
    btn.dataset.hold = 1;
    btn.classList.add("hold");
    const fill = Object.assign(document.createElement("span"), { className: "hfill" });
    const dica = Object.assign(document.createElement("span"), { className: "hdica", textContent: "segure para confirmar" });
    btn.append(fill, dica);
    let t, anim, liberado = false;
    const soltar = () => { clearTimeout(t); anim?.pause(); A().animate(fill, { scaleX: 0, duration: 250, ease: "outQuad" }); };
    btn.addEventListener("pointerdown", () => {
      if (btn.disabled) return;
      anim = A().animate(fill, { scaleX: [0, 1], duration: ms, ease: "linear" });
      t = setTimeout(() => {
        liberado = true;
        A().animate(btn, { scale: [1, 1.06, 1], duration: 380, ease: "outBack" });
        btn.click();
        A().animate(fill, { scaleX: 0, opacity: [1, 1], duration: 300, delay: 200 });
      }, ms);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((e) => btn.addEventListener(e, () => { if (!liberado) soltar(); }));
    btn.addEventListener("click", (e) => { if (!liberado) { e.stopImmediatePropagation(); e.preventDefault(); A().animate(btn, { translateX: [0, -5, 5, -3, 3, 0], duration: 350 }); } liberado = false; }, true);
  }

  // 3. números rolando (odômetro)
  function odometro(el) {
    if (!el) return;
    let ultimo = "";
    new MutationObserver(() => {
      const txt = el.textContent;
      if (txt === ultimo || el.querySelector(".odo")) return;
      ultimo = txt;
      const partes = txt.split(/(\d[\d.]*)/);
      el.innerHTML = "";
      partes.forEach((p, i) => {
        if (i % 2 === 0) return el.append(p);
        const caixa = Object.assign(document.createElement("span"), { className: "odo" });
        [...p].forEach((c) => {
          const s = document.createElement("span");
          s.textContent = c;
          caixa.append(s);
          if (/\d/.test(c)) A().animate(s, { translateY: ["100%", "0%"], opacity: [0, 1], duration: 320, ease: "outCubic" });
        });
        el.append(caixa);
      });
      ultimo = el.textContent;
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }

  // 4. interruptor com mancha de tinta
  document.addEventListener("change", (e) => {
    const lab = e.target.closest?.(".toggle");
    if (!lab) return;
    const s = lab.querySelector("span");
    const g = Object.assign(document.createElement("i"), { className: "tinta" });
    lab.append(g);
    A().animate(g, { scale: [0, 5], opacity: [0.4, 0], duration: 550, ease: "outQuad", onComplete: () => g.remove() });
    if (s) A().animate(s, { scaleX: [1, 1.12, 1], scaleY: [1, 0.9, 1], duration: 400, ease: "outBack" });
  });

  // 5. botão de copiar vira ✓  /  6. anel em botões de baixar/atualizar
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("button");
    if (!b) return;
    const t = b.textContent.trim().toLowerCase();
    if (t.startsWith("copiar") && !b.dataset.ok) {
      b.dataset.ok = 1;
      const antes = b.innerHTML;
      b.classList.add("copiado");
      A().animate(b, { scale: [0.92, 1], duration: 300, ease: "outBack" });
      b.textContent = "✓ Copiado";
      setTimeout(() => { b.innerHTML = antes; delete b.dataset.ok; }, 1600);
    }
    if (/^(baixar|atualizar|instalar)/.test(t)) {
      if (getComputedStyle(b).position === "static") b.style.position = "relative";
      const r = b.getBoundingClientRect();
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "anelD");
      svg.setAttribute("viewBox", `0 0 ${r.width + 8} ${r.height + 8}`);
      svg.innerHTML = `<rect x="2" y="2" width="${r.width + 4}" height="${r.height + 4}" rx="12" fill="none" stroke="currentColor" stroke-width="2" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>`;
      b.append(svg);
      A().animate(svg.firstChild, { strokeDashoffset: [100, 0], duration: 1400, ease: "inOutQuad", onComplete: () => A().animate(svg, { opacity: 0, duration: 300, onComplete: () => svg.remove() }) });
    }
  });

  addEventListener("DOMContentLoaded", () => {
    segurar(document.getElementById("startBtn"));
    odometro(document.getElementById("countLine"));
  });
})();
