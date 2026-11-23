
(function () {
  "use strict";

  
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const icon = (name) => { const t = document.getElementById("tpl-" + name); return t ? t.innerHTML : ""; };
  const num = (n, d = 2) => n.toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d });
  const hora = () => new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const anunciar = (msg) => { const a = $("#anuncio"); if (!a) return; a.textContent = ""; window.setTimeout(() => { a.textContent = msg; }, 30); };

  const NIVEL = {
    normal: { nombre: "Normal", icono: "ok" },
    precaucion: { nombre: "Precaución", icono: "warn" },
    critico: { nombre: "Crítico", icono: "crit" }
  };
  const badge = (lvl) => '<span class="sev sev-' + lvl + '">' + icon(NIVEL[lvl].icono) + " " + NIVEL[lvl].nombre + "</span>";

  
  const Menu = {
    init() {
      this.btn = $(".nav-toggle");
      this.nav = $("#menu-principal");
      this.btn.addEventListener("click", () => this.set(this.btn.getAttribute("aria-expanded") !== "true"));
      $$("a", this.nav).forEach((a) => a.addEventListener("click", () => this.set(false)));
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.btn.getAttribute("aria-expanded") === "true") { this.set(false); this.btn.focus(); }
      });
      window.matchMedia("(min-width: 960px)").addEventListener("change", (m) => { if (m.matches) this.set(false); });
    },
    set(open) {
      this.btn.setAttribute("aria-expanded", String(open));
      this.nav.classList.toggle("open", open);
      $(".sr-only", this.btn).textContent = open ? "Cerrar menú de navegación" : "Abrir menú de navegación";
    }
  };

  
  const NavActiva = {
    init() {
      const links = $$('.main-nav a[href^="#"]:not(.btn)');
      const porId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
      const alias = { problema: "como-funciona", calculadora: "demo", seguridad: "instalacion" };
      if (!("IntersectionObserver" in window)) return;
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = porId.has(en.target.id) ? en.target.id : alias[en.target.id];
          links.forEach((a) => a.removeAttribute("aria-current"));
          if (id && porId.has(id)) porId.get(id).setAttribute("aria-current", "true");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      $$("main section[id]").forEach((s) => io.observe(s));
    }
  };

  
  const VolverArriba = {
    init() {
      const b = $("#volver-arriba");
      window.addEventListener("scroll", () => b.classList.toggle("visible", window.scrollY > 700), { passive: true });
    }
  };

  
  const Perfiles = {
    init() {
      $$("[data-tabs]").forEach((wrap) => {
        const tabs = $$('[role="tab"]', wrap);
        const select = (tab, focus) => {
          tabs.forEach((t) => {
            const on = t === tab;
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
          });
          if (focus) tab.focus();
        };
        tabs.forEach((t, i) => {
          t.addEventListener("click", () => select(t));
          t.addEventListener("keydown", (e) => {
            const mapa = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
            if (e.key in mapa) { e.preventDefault(); select(tabs[mapa[e.key]], true); }
          });
        });
      });
      $$("[data-perfil]").forEach((b) => b.addEventListener("click", () => {
        $("#f-segmento").value = b.dataset.perfil;
        $("#contacto").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        $("#f-nombre").focus({ preventScroll: true });
      }));
    }
  };

  
  const Faq = {
    init() {
      $$(".accordion button").forEach((b) => b.addEventListener("click", () => {
        const abierto = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!abierto));
        document.getElementById(b.getAttribute("aria-controls")).hidden = abierto;
      }));
    }
  };

  
  const Demo = {
    ZONAS: ["Sala", "Cocina", "Lavandería", "Dormitorio 1", "Dormitorio 2", "Baño"],
    BASE: { Sala: [221, 1.8, 1], Cocina: [220, 2.4, 1], "Lavandería": [221, 0.6, 1], "Dormitorio 1": [221, 0.4, 0], "Dormitorio 2": [221, 0.3, 0], "Baño": [220, 0.1, 1] },
    ESCENARIOS: {
      leve: { zona: "Lavandería", fuga: 18 },
      critica: { zona: "Cocina", fuga: 45 }
    },
    PASOS: {
      precaucion: [
        "No es una emergencia, pero la fuga sigue sumando a tu recibo.",
        "Revisa si hay humedad o cables expuestos en la zona, sin tocarlos.",
        "Comparte la alerta con tu electricista y agenda una revisión esta semana."
      ],
      critico: [
        "Aléjate de los enchufes y equipos de la zona.",
        "Corta el circuito desde aquí o baja su llave en el tablero.",
        "Llama a tu electricista. Si ves humo o fuego, llama al 116."
      ]
    },
    DIAS: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    KWH: [8.2, 7.9, 8.4, 9.6, 9.9, 10.4, 9.1],
    EVENTOS: [false, false, false, true, true, true, false],
    estado: { escenario: null, cortado: false, umbral: 15, hora: "" },

    init() {
      $$("[data-sim]").forEach((b) => b.addEventListener("click", () => this.simular(b.dataset.sim)));
      const sw = $("#vista-switch");
      sw.addEventListener("click", () => {
        const on = sw.getAttribute("aria-checked") !== "true";
        sw.setAttribute("aria-checked", String(on));
        $("#vista-tecnica").hidden = !on;
      });
      const u = $("#umbral");
      u.addEventListener("input", () => {
        this.estado.umbral = Number(u.value);
        $("#umbral-out").textContent = u.value;
        this.render();
      });
      this.initCorte();
      $("#btn-compartir").addEventListener("click", () => this.compartir());
      this.render();
    },

    nivel(fuga) {
      if (fuga > 30) return "critico";
      if (fuga >= this.estado.umbral) return "precaucion";
      return "normal";
    },

    simular(tipo) {
      const e = this.estado;
      e.cortado = false;
      e.escenario = tipo === "reset" ? null : this.ESCENARIOS[tipo];
      e.hora = hora();
      this.render();
      if (!e.escenario) { anunciar("Demo restablecida. Estado normal, sin fugas."); return; }
      const lvl = this.nivel(e.escenario.fuga);
      anunciar(lvl === "normal"
        ? "Fuga de " + e.escenario.fuga + " miliamperios en " + e.escenario.zona + ", por debajo del umbral. Estado normal."
        : "Alerta " + NIVEL[lvl].nombre + ": fuga detectada en " + e.escenario.zona + ".");
    },

    fugaDe(zona) {
      const e = this.estado;
      if (e.escenario && e.escenario.zona === zona && !e.cortado) return e.escenario.fuga;
      return this.BASE[zona][2];
    },

    render() {
      const e = this.estado, esc_ = e.escenario;
      const fuga = esc_ && !e.cortado ? esc_.fuga : 4;
      const lvl = this.nivel(fuga);

      const est = $("#estado");
      est.dataset.level = lvl;
      $("#estado-icono").innerHTML = icon(NIVEL[lvl].icono);
      $("#estado-texto").textContent = lvl !== "normal"
        ? NIVEL[lvl].nombre + ": fuga en " + esc_.zona
        : (e.cortado ? "Normal: circuito de " + esc_.zona + " apagado" : "Normal: sin fugas detectadas");
      $("#m-fuga").textContent = fuga + " mA";
      let kw = 1.24;
      if (esc_ && !e.cortado) kw += fuga * 0.0022;
      if (esc_ && e.cortado) kw -= this.BASE[esc_.zona][1] * 0.22;
      $("#m-consumo").textContent = num(kw) + " kW";

      $$(".zone").forEach((g) => {
        const z = g.dataset.zone, t = $("text", g), x = t.getAttribute("x");
        g.classList.remove("precaucion", "critico", "cortado");
        let sub = "";
        if (esc_ && esc_.zona === z) {
          if (e.cortado) { g.classList.add("cortado"); sub = "Apagado"; }
          else if (lvl !== "normal") { g.classList.add(lvl); sub = (lvl === "critico" ? "! " : "▲ ") + NIVEL[lvl].nombre; }
        }
        t.innerHTML = sub
          ? '<tspan x="' + x + '" dy="-6">' + z + '</tspan><tspan class="zsub" x="' + x + '" dy="20">' + sub + "</tspan>"
          : z;
      });
      $("#plano-desc").textContent = esc_ && lvl !== "normal"
        ? "Plano de la vivienda. Alerta de nivel " + NIVEL[lvl].nombre + " en la zona " + esc_.zona + "."
        : (e.cortado ? "Plano de la vivienda. El circuito de " + esc_.zona + " está apagado." : "Plano de la vivienda con seis zonas. Ninguna zona tiene alerta.");
      $("#plano-vacio").hidden = Boolean(esc_ && (lvl !== "normal" || e.cortado));

      const alerta = $("#alerta");
      if (esc_ && lvl !== "normal") {
        alerta.hidden = false;
        alerta.dataset.level = lvl;
        $("#alerta-sev").outerHTML = '<span class="sev sev-' + lvl + '" id="alerta-sev">' + icon(NIVEL[lvl].icono) + " " + NIVEL[lvl].nombre + "</span>";
        $("#alerta-titulo").textContent = "Fuga detectada en " + esc_.zona;
        $("#alerta-hora").textContent = "Detectada hoy a las " + e.hora + " · circuito " + esc_.zona;
        $("#alerta-detalle").textContent = "Corriente de fuga de " + fuga + " mA. Tu umbral está en " + e.umbral + " mA" +
          (lvl === "critico" ? " y el valor supera el límite de 30 mA." : ".");
        $("#alerta-pasos").innerHTML = this.PASOS[lvl].map((p) => "<li>" + p + "</li>").join("");
      } else {
        alerta.hidden = true;
      }

      $("#tele-body").innerHTML = this.ZONAS.map((z) => {
        const [v, a] = this.BASE[z];
        const fz = this.fugaDe(z), l = this.nivel(fz);
        const apagado = e.cortado && esc_ && esc_.zona === z;
        const cls = apagado ? "" : (l === "critico" ? "alto" : l === "precaucion" ? "medio" : "");
        const txt = apagado ? "Apagado" : fz + " mA" + (l !== "normal" ? " · " + NIVEL[l].nombre : "");
        return '<tr><th scope="row">' + z + "</th><td>" + (apagado ? "0" : v) + " V</td><td>" + (apagado ? "0.0" : num(a, 1)) + ' A</td><td class="' + cls + '">' + txt + "</td></tr>";
      }).join("");

      this.renderHistorial();
    },

    renderHistorial() {
      const e = this.estado;
      const datos = this.KWH.slice();
      const hoyEvento = Boolean(e.escenario && !e.cortado && this.nivel(e.escenario.fuga) !== "normal");
      if (hoyEvento) datos[6] = Number((datos[6] + e.escenario.fuga * 0.024).toFixed(1));
      const max = 12, h = 150, x0 = 30, w = 52;
      let out = '<title id="grafico-titulo">Consumo diario en kWh</title><desc id="grafico-desc"></desc>' +
        '<defs><pattern id="trama-barra" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<rect width="6" height="6" fill="#FFF7E6"/><line x1="0" y1="0" x2="0" y2="6" stroke="#B45309" stroke-width="3"/></pattern></defs>';
      [0, 4, 8, 12].forEach((v) => {
        const y = 170 - (v / max) * h;
        out += '<line class="grid" x1="' + x0 + '" x2="410" y1="' + y + '" y2="' + y + '"/><text class="axis" x="0" y="' + (y + 4) + '">' + v + "</text>";
      });
      let conEvento = 0;
      datos.forEach((v, i) => {
        const bh = (v / max) * h, x = x0 + 10 + i * w, y = 170 - bh;
        const ev = this.EVENTOS[i] || (i === 6 && hoyEvento);
        if (ev) conEvento++;
        out += '<rect class="bar' + (ev ? " evento" : "") + '" x="' + x + '" y="' + y + '" width="32" height="' + bh + '" rx="4"/>';
        out += '<text class="val" x="' + (x + 16) + '" y="' + (y - 6) + '">' + (ev ? "▲ " : "") + v + "</text>";
        out += '<text class="axis" x="' + (x + 16) + '" y="190" text-anchor="middle">' + this.DIAS[i] + "</text>";
      });
      $("#grafico").innerHTML = out;
      $("#grafico-desc").textContent = "Consumo en kWh por día: " + datos.map((v, i) =>
        this.DIAS[i] + " " + v + ((this.EVENTOS[i] || (i === 6 && hoyEvento)) ? " con evento de fuga" : "")).join("; ") + ".";
      const total = datos.reduce((a, b) => a + b, 0);
      $("#grafico-resumen").textContent = conEvento + " de 7 días con eventos de fuga (barras con trama y ▲). Consumo de la semana: " + num(total, 1) + " kWh.";
    },

    initCorte() {
      const dlg = $("#dlg-corte");
      let origen = null;
      const cerrar = () => { if (dlg.open) dlg.close(); if (origen) origen.focus(); };
      $("#btn-corte").addEventListener("click", (ev) => {
        if (!this.estado.escenario) return;
        origen = ev.currentTarget;
        $("#dlg-zona").textContent = this.estado.escenario.zona;
        if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
        $("#dlg-cancelar").focus();
      });
      $("#dlg-cancelar").addEventListener("click", () => { cerrar(); anunciar("Corte cancelado. El circuito sigue encendido."); });
      $("#dlg-confirmar").addEventListener("click", () => {
        this.estado.cortado = true;
        if (dlg.open) dlg.close();
        this.render();
        anunciar("Circuito de " + this.estado.escenario.zona + " apagado. El resto de la vivienda sigue con energía.");
        $("#estado").setAttribute("tabindex", "-1");
        $("#estado").focus();
      });
      dlg.addEventListener("cancel", () => { anunciar("Corte cancelado. El circuito sigue encendido."); window.setTimeout(() => origen && origen.focus(), 0); });
    },

    compartir() {
      const b = $("#btn-compartir");
      const original = b.innerHTML;
      b.textContent = "Enlace copiado para tu electricista";
      b.disabled = true;
      anunciar("Enlace de la alerta copiado. Pégalo en un mensaje a tu electricista.");
      window.setTimeout(() => { b.innerHTML = original; b.disabled = false; }, 2500);
    }
  };

  
  const Locales = {
    DATOS: [
      { n: "Panadería, local Surco", fuga: 42, zona: "Horno", act: "hace 3 min" },
      { n: "Panadería, local Miraflores", fuga: 6, zona: "", act: "hace 1 min" },
      { n: "Cafetería San Borja", fuga: 22, zona: "Cámara de frío", act: "hace 12 min" },
      { n: "Panadería, local Lince", fuga: 3, zona: "", act: "hace 2 min" },
      { n: "Almacén Ate", fuga: 17, zona: "Iluminación exterior", act: "hace 25 min" }
    ],
    ORDEN: { critico: 0, precaucion: 1, normal: 2 },
    init() {
      $$("[data-mode]").forEach((b) => b.addEventListener("click", () => {
        $$("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        $("#demo-hogar").hidden = b.dataset.mode !== "hogar";
        $("#demo-locales").hidden = b.dataset.mode !== "locales";
      }));
      $("#orden").addEventListener("change", () => this.render());
      $("#solo-alertas").addEventListener("change", () => this.render());
      this.render();
    },
    nivel: (f) => (f > 30 ? "critico" : f >= 15 ? "precaucion" : "normal"),
    render() {
      const todos = this.DATOS.map((s) => Object.assign({ l: this.nivel(s.fuga) }, s));
      const cuenta = { critico: 0, precaucion: 0, normal: 0 };
      todos.forEach((s) => { cuenta[s.l]++; });
      $("#contadores").innerHTML = ["critico", "precaucion", "normal"].map((l) =>
        "<li>" + badge(l).replace("</span>", ": " + cuenta[l] + (cuenta[l] === 1 ? " local" : " locales") + "</span>") + "</li>").join("");
      let lista = todos;
      if ($("#solo-alertas").checked) lista = lista.filter((s) => s.l !== "normal");
      const orden = $("#orden").value;
      lista.sort((a, b) => orden === "nombre" ? a.n.localeCompare(b.n, "es") : this.ORDEN[a.l] - this.ORDEN[b.l] || b.fuga - a.fuga);
      $("#sitios").innerHTML = lista.length ? lista.map((s) =>
        '<li class="site" data-level="' + s.l + '"><strong>' + esc(s.n) + '</strong><span class="meta">' +
        (s.l === "normal" ? "Sin alertas · fuga de " + s.fuga + " mA" : esc(s.zona) + " · fuga de " + s.fuga + " mA") +
        " · actualizado " + s.act + "</span>" + badge(s.l) + "</li>").join("")
        : '<li class="site">No hay locales con alerta.</li>';
    }
  };

  
  const Calculadora = {
    init() {
      this.form = $("#form-calc");
      $$("[data-preset]", this.form).forEach((b) => b.addEventListener("click", () => {
        $("#c-fuga").value = b.dataset.preset;
        $$("[data-preset]", this.form).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        this.calcular();
      }));
      $$("[data-preset]", this.form).forEach((x) => x.setAttribute("aria-pressed", "false"));
      $("#c-fuga").addEventListener("input", () => $$("[data-preset]", this.form).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.preset === $("#c-fuga").value))));
      this.form.addEventListener("submit", (e) => { e.preventDefault(); this.calcular(true); });
    },
    calcular(enfocarError) {
      const fi = $("#c-fuga"), ti = $("#c-tarifa");
      const ma = parseFloat(fi.value), tarifa = parseFloat(ti.value), v = parseFloat($("#c-tension").value);
      const reglas = [
        [fi, $("#c-fuga-err"), !(ma >= 1 && ma <= 1000), "Ingresa una corriente entre 1 y 1000 mA."],
        [ti, $("#c-tarifa-err"), !(tarifa >= 0.1 && tarifa <= 5), "Ingresa una tarifa entre S/ 0.10 y S/ 5.00 por kWh."]
      ];
      let primero = null;
      reglas.forEach(([inp, err, malo, msg]) => {
        inp.setAttribute("aria-invalid", String(malo));
        err.textContent = malo ? msg : "";
        if (malo && !primero) primero = inp;
      });
      const res = $("#calc-resultado");
      if (primero) { res.innerHTML = ""; if (enfocarError) primero.focus(); return; }
      const watts = v * ma / 1000;
      const kwh = watts * 24 * 30 / 1000;
      const soles = kwh * tarifa;
      const focos = watts / 9;
      res.innerHTML = '<div class="result-box"><span>Pierdes aproximadamente</span><strong class="big">S/ ' + num(soles) + " al mes</strong>" +
        "<p>Son " + num(kwh, 1) + " kWh al mes (" + num(watts, 1) + " W encendidos todo el día) y S/ " + num(soles * 12) + " al año.</p>" +
        "<p>Es como dejar " + (focos < 1 ? "un foco LED de 9 W" : num(focos, 1) + " focos LED de 9 W") + " prendidos día y noche.</p></div>";
    }
  };

  
  const Planes = {
    init() {
      $$("[data-select-plan]").forEach((b) => b.addEventListener("click", () => this.elegir(b.closest(".plan-card"))));
    },
    elegir(card) {
      const plan = card.dataset.plan;
      $$(".plan-card").forEach((c) => {
        const on = c === card, btn = $("[data-select-plan]", c);
        c.classList.toggle("selected", on);
        btn.setAttribute("aria-pressed", String(on));
        btn.textContent = on ? "✓ Plan elegido" : "Elegir " + c.dataset.plan;
      });
      const precio = $(".price", card).textContent.replace(/\s+/g, " ").trim();
      const r = $("#plan-resumen");
      r.hidden = false;
      r.innerHTML = "<p><strong>Elegiste el plan " + plan + ":</strong> " + precio + ". La visita de instalación está incluida.</p>" +
        '<a class="btn btn-primary btn-sm" href="#contacto">Continuar con mi solicitud</a>';
      $("#f-plan").value = plan;
    }
  };

  
  const Compatibilidad = {
    init() {
      $("#form-compat").addEventListener("submit", (e) => {
        e.preventDefault();
        const s = $("#s-suministro").value, i = $("#s-inmueble").value, out = $("#compat-resultado");
        if (!s || !i) {
          out.innerHTML = '<div class="result-box warn"><strong>Faltan datos.</strong> Elige el tipo de suministro y el tipo de inmueble.</div>';
          (!s ? $("#s-suministro") : $("#s-inmueble")).focus();
          return;
        }
        if (s === "nose") {
          out.innerHTML = '<div class="result-box warn"><strong>Revísalo en tu recibo de luz.</strong> En "Datos del suministro" figura si es monofásico o trifásico. Si prefieres, pide una visita técnica y lo verificamos por ti.</div>';
          return;
        }
        const sensor = s === "mono" ? "sensor monofásico" : "sensor trifásico";
        const plan = i === "casa" ? "Hogar" : i === "negocio" ? "Negocio" : "Negocio Plus";
        out.innerHTML = '<div class="result-box ok"><strong>' + icon("ok") + " Compatible.</strong> Tu instalación usa el " + sensor +
          ". Te recomendamos el plan " + plan + ". En la visita, el técnico confirmará el espacio en tu tablero.</div>";
      });
    }
  };

  
  const Contacto = {
    init() {
      this.form = $("#form-contacto");
      this.distrito = $("#campo-distrito");
      this.reglas = [
        ["f-nombre", (v) => v.trim().split(/\s+/).filter(Boolean).length >= 2 && v.trim().length >= 5, "Escribe tu nombre y apellido."],
        ["f-correo", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), "Revisa tu correo. Debe tener la forma nombre@correo.com."],
        ["f-celular", (v) => /^9\d{8}$/.test(v.replace(/\s/g, "")), "El celular debe tener 9 dígitos y empezar con 9."],
        ["f-segmento", (v) => v !== "", "Elige si eres hogar, negocio o técnico electricista."],
        ["f-distrito", (v) => this.distrito.hidden || v.trim().length >= 3, "Indica el distrito para programar la visita."],
        ["f-mensaje", (v) => v.trim().length >= 10, "Cuéntanos tu caso en al menos 10 caracteres."]
      ];

      $$('input[name="tipo"]', this.form).forEach((r) => r.addEventListener("change", () => {
        this.distrito.hidden = this.tipo() !== "Visita técnica";
        if (this.distrito.hidden) { $("#f-distrito").removeAttribute("aria-invalid"); $("#f-distrito-err").textContent = ""; }
      }));

      this.reglas.forEach(([id]) => {
        const el = document.getElementById(id);
        const ev = el.tagName === "SELECT" ? "change" : "input";
        el.addEventListener(ev, () => { if (el.getAttribute("aria-invalid") === "true") this.validar(id); });
      });
      $("#f-acepto").addEventListener("change", (e) => {
        if (e.target.checked) { e.target.removeAttribute("aria-invalid"); $("#f-acepto-err").textContent = ""; }
      });

      const msg = $("#f-mensaje"), cont = $("#f-mensaje-cont");
      msg.addEventListener("input", () => { cont.textContent = msg.value.length + " de 500 caracteres"; });

      this.form.addEventListener("submit", (e) => { e.preventDefault(); this.enviar(); });
      $("#resumen-errores").addEventListener("click", (e) => {
        const a = e.target.closest("a");
        if (!a) return;
        e.preventDefault();
        document.getElementById(a.getAttribute("href").slice(1)).focus();
      });
    },
    tipo() { return $('input[name="tipo"]:checked', this.form).value; },
    validar(id) {
      const r = this.reglas.find((x) => x[0] === id);
      const el = document.getElementById(id), ok = r[1](el.value);
      el.setAttribute("aria-invalid", String(!ok));
      document.getElementById(id + "-err").textContent = ok ? "" : r[2];
      return ok;
    },
    enviar() {
      const errores = this.reglas.filter(([id]) => !this.validar(id)).map(([id, , msg]) => [id, msg]);
      const acepto = $("#f-acepto");
      if (!acepto.checked) {
        acepto.setAttribute("aria-invalid", "true");
        $("#f-acepto-err").textContent = "Necesitamos tu autorización para responderte.";
        errores.push(["f-acepto", "Acepta el uso de tus datos para esta solicitud."]);
      }
      const resumen = $("#resumen-errores"), ok = $("#confirmacion");
      if (errores.length) {
        ok.hidden = true;
        resumen.hidden = false;
        resumen.innerHTML = "<strong>Revisa " + (errores.length === 1 ? "1 campo" : errores.length + " campos") + " antes de enviar:</strong><ul>" +
          errores.map(([id, msg]) => '<li><a href="#' + id + '">' + msg + "</a></li>").join("") + "</ul>";
        resumen.focus();
        return;
      }
      resumen.hidden = true;
      const datos = {
        nombre: $("#f-nombre").value.trim().split(/\s+/)[0],
        correo: $("#f-correo").value.trim(),
        tipo: this.tipo(),
        perfil: $("#f-segmento").value,
        plan: $("#f-plan").value
      };
      ok.hidden = false;
      ok.innerHTML = "<strong>" + icon("ok") + " ¡Listo, " + esc(datos.nombre) + "! Recibimos tu solicitud.</strong>" +
        "<p>Tipo: " + esc(datos.tipo.toLowerCase()) + " · Perfil: " + esc(datos.perfil) + (datos.plan ? " · Plan: " + esc(datos.plan) : "") +
        ". Te escribiremos a " + esc(datos.correo) + " en un día hábil.</p>";
      this.form.reset();
      this.distrito.hidden = true;
      $("#f-mensaje-cont").textContent = "0 de 500 caracteres";
      $$("[aria-invalid]", this.form).forEach((x) => x.removeAttribute("aria-invalid"));
      ok.focus();
    }
  };

  
  [Menu, NavActiva, VolverArriba, Perfiles, Faq, Demo, Locales, Calculadora, Planes, Compatibilidad, Contacto].forEach((m) => m.init());
})();
