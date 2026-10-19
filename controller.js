(() => {
  const questions = window.QUIZ_QUESTIONS || [];
  const list = document.getElementById("questionList");
  const startBtn = document.getElementById("startBtn");
  const nextBtn = document.getElementById("nextBtn");
  const showQuestionBtn = document.getElementById("showQuestionBtn");
  const currentMeta = document.getElementById("currentMeta");
  const currentMovie = document.getElementById("currentMovie");
  const currentQuestion = document.getElementById("currentQuestion");
  const connection = document.getElementById("controllerConnection");
  const introInput = document.getElementById("introSeconds");
  const toast = document.getElementById("toast");
  let currentIndex = -1;
  let introSeconds = 15;
  let connected = false;

  async function send(payload) {
    try {
      const response = await fetch("/api/event", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, sentAt: Date.now() })
      });
      if (!response.ok) throw new Error("No se pudo enviar el evento");
      return true;
    } catch (error) {
      notify("No hay conexión con el servidor. Revisa que esté iniciado.");
      return false;
    }
  }
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function updateConnection(ok) {
    connected = ok;
    connection.classList.toggle("ok", ok);
    connection.classList.toggle("error", !ok);
    connection.lastChild.textContent = ok ? " Conectado" : " Sin conexión";
  }
  function renderList() {
    list.innerHTML = "";
    questions.forEach((q, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "question-item" + (index === currentIndex ? " active" : "") + (index < currentIndex ? " done" : "");
      button.innerHTML = `<span class="question-index">${String(index + 1).padStart(2, "0")}</span><span><strong></strong><small></small></span><span class="item-arrow">›</span>`;
      button.querySelector("strong").textContent = q.movie;
      button.querySelector("small").textContent = q.question;
      button.addEventListener("click", () => beginRound(index));
      list.appendChild(button);
    });
  }
  function updateCurrent() {
    if (currentIndex < 0) {
      currentMeta.textContent = "SIN RONDA ACTIVA";
      currentMovie.textContent = "¡Listos para jugar!";
      currentQuestion.textContent = "Inicia la primera ronda para mostrar la animación y la canción.";
      startBtn.disabled = false;
      startBtn.textContent = "▶ Iniciar primera ronda";
      nextBtn.disabled = true;
      showQuestionBtn.disabled = true;
    } else {
      const q = questions[currentIndex];
      currentMeta.textContent = `PREGUNTA ${String(currentIndex + 1).padStart(2, "0")} DE ${questions.length}`;
      currentMovie.textContent = q.movie;
      currentQuestion.textContent = q.question;
      startBtn.disabled = true;
      startBtn.textContent = "Ronda en curso";
      nextBtn.disabled = currentIndex >= questions.length - 1;
      nextBtn.textContent = currentIndex >= questions.length - 1 ? "✓ Última pregunta" : "⏭ Siguiente pregunta";
      showQuestionBtn.disabled = false;
    }
    renderList();
  }
  async function beginRound(index) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;
    updateCurrent();
    const ok = await send({ type: "startRound", index, introSeconds });
    if (ok) notify(`Ronda ${index + 1}: ${questions[index].movie}`);
  }
  startBtn.addEventListener("click", () => beginRound(currentIndex < 0 ? 0 : currentIndex));
  nextBtn.addEventListener("click", () => {
    if (currentIndex < questions.length - 1) beginRound(currentIndex + 1);
  });
  showQuestionBtn.addEventListener("click", async () => {
    if (currentIndex >= 0 && await send({ type: "showQuestion" })) notify("Pregunta mostrada en pantalla");
  });
  document.getElementById("welcomeBtn").addEventListener("click", async () => {
    currentIndex = -1;
    updateCurrent();
    await send({ type: "welcome" });
    notify("Pantalla inicial activada");
  });
  document.getElementById("saveSettings").addEventListener("click", () => {
    introSeconds = Math.min(60, Math.max(1, Number(introInput.value) || 15));
    introInput.value = introSeconds;
    notify(`Introducción configurada en ${introSeconds} segundos`);
  });
  document.getElementById("resetBtn").addEventListener("click", async () => {
    if (!confirm("¿Reiniciar el juego y volver a la pantalla inicial?")) return;
    currentIndex = -1;
    updateCurrent();
    await send({ type: "reset" });
    notify("Juego reiniciado");
  });

  const es = new EventSource("/events");
  es.onopen = () => updateConnection(true);
  es.onerror = () => updateConnection(false);
  es.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "startRound") {
        // Sincroniza si otra controladora inicia una ronda.
        currentIndex = data.index;
        updateCurrent();
      }
    } catch (e) { console.error(e); }
  };
  updateCurrent();
})();
