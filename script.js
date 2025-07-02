class CSSPlayer {
  constructor() {
    this.elements = {
      htmlArea: document.getElementById("html"),
      cssArea: document.getElementById("css"),
      tabs: document.querySelectorAll(".tab"),
      tabContents: document.querySelectorAll(".tab-content"),
      preview: document.getElementById("preview"),
      playBtn: document.getElementById("playBtn"),
      stopBtn: document.getElementById("stopBtn"),
      colorPicker: document.getElementById("colorPicker"),
      status: document.getElementById("status"),
      speedInput: document.getElementById("speedInput"),
    };

    this.state = {
      typingInterval: null,
      isShowingExample: false,
      isPlaying: false,
      currentIndex: 0,
      cssCode: "",
      htmlCode: "",
      originalCSS: "",
      backgroundColor: "#161616",
      currentStyleTag: null,
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadExamples();
    this.elements.colorPicker.value = this.state.backgroundColor;
    this.showTab("html");
    this.setupPreview();
    this.initializeHighlighting();
  }

  initializeHighlighting() {
    // Aplicar highlighting inicial
    hljs.highlightElement(this.elements.htmlArea);
    hljs.highlightElement(this.elements.cssArea);

    // Re-aplicar highlighting quando o conteúdo muda
    this.elements.htmlArea.addEventListener("input", () => {
      this.reapplyHighlighting(this.elements.htmlArea);
    });

    this.elements.cssArea.addEventListener("input", () => {
      this.reapplyHighlighting(this.elements.cssArea);
    });

    const editable = this.elements.cssArea;
    const highlight = document.getElementById("css-highlight");
    editable.addEventListener("scroll", () => {
      highlight.parentElement.scrollTop = editable.scrollTop;
      highlight.parentElement.scrollLeft = editable.scrollLeft;
    });
  }

  reapplyHighlighting(element) {
    // Remove classes do highlight.js
    element.classList.remove("hljs");
    element.removeAttribute("data-highlighted");

    // Reaplica o highlighting
    setTimeout(() => {
      hljs.highlightElement(element);
    }, 0);
  }

  bindEvents() {
    // Event listeners para as abas
    this.elements.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabType = tab.getAttribute("data-tab");
        this.showTab(tabType);
      });
    });

    // Event listeners para os botões
    this.elements.playBtn.addEventListener("click", () => this.playCSS());
    this.elements.stopBtn.addEventListener("click", () => this.stopCSS());

    // Event listener para o color picker
    this.elements.colorPicker.addEventListener("change", (e) => {
      this.changeBackgroundColor(e.target.value);
    });

    // Event listener para o input de velocidade
    this.elements.speedInput.addEventListener("input", () => {
      this.updateStatus(
        `⚡ Velocidade definida para ${this.getCurrentTypingSpeed()}ms`,
        "info"
      );
    });

    // Event listener para teclas de atalho
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "Enter":
            e.preventDefault();
            this.playCSS();
            break;
          case "Escape":
            e.preventDefault();
            this.stopCSS();
            break;
        }
      }
    });
  }

  showTab(tabType) {
    // Atualizar abas ativas
    this.elements.tabs.forEach((tab) => {
      tab.classList.remove("active");
      if (tab.getAttribute("data-tab") === tabType) {
        tab.classList.add("active");
      }
    });

    // Atualizar conteúdo das abas
    this.elements.tabContents.forEach((content) => {
      content.classList.remove("active");
    });

    const targetTab = document.getElementById(`${tabType}-tab`);
    if (targetTab) {
      targetTab.classList.add("active");
    }
  }

  updateStatus(message, type = "info") {
    this.elements.status.textContent = message;
    this.elements.status.className = `status show ${type}`;

    setTimeout(() => {
      this.elements.status.classList.remove("show");
    }, 3000);
  }

  changeBackgroundColor(color) {
    this.state.backgroundColor = color;

    if (this.state.currentStyleTag) {
      try {
        const iframeDoc =
          this.elements.preview.contentDocument ||
          this.elements.preview.contentWindow.document;
        const body = iframeDoc.body;
        if (body) {
          body.style.backgroundColor = color;
          this.updateStatus(`🎨 Background alterado para ${color}`, "success");
        }
      } catch (error) {
        console.error("Erro ao alterar background:", error);
      }
    } else {
      this.updateStatus(`🎨 Background definido para ${color}`, "info");
    }
  }

  autoScrollToBottom() {
    const codeBlock = this.elements.cssArea;
    const isScrollNeeded = codeBlock.scrollHeight > codeBlock.clientHeight;

    if (isScrollNeeded) {
      const isNearBottom =
        codeBlock.scrollTop + codeBlock.clientHeight >= codeBlock.scrollHeight;

      if (!isNearBottom) {
        codeBlock.scrollTop = codeBlock.scrollHeight;
      }
    }
  }

  validateInputs() {
    this.state.cssCode = this.elements.cssArea.textContent.trim();
    this.state.htmlCode = this.elements.htmlArea.textContent.trim();

    if (!this.state.cssCode && !this.state.isShowingExample) {
      this.updateStatus("⚠️ Digite algum código CSS primeiro!", "warning");
      return false;
    }

    const speed = this.getCurrentTypingSpeed();
    if (isNaN(speed) || speed < 0) {
      this.updateStatus(
        "⚠️ A velocidade deve ser um número positivo!",
        "error"
      );
      return false;
    }

    return true;
  }

  setupPreview() {
    try {
      const iframeDoc =
        this.elements.preview.contentDocument ||
        this.elements.preview.contentWindow.document;

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-tap-highlight-color: transparent;
            }
            body {
              height: 100vh;
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: ${this.state.backgroundColor};
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              position: relative;
            }
          </style>
          <style id="dynamic-style"></style>
        </head>
        <body>
          ${this.state.htmlCode}
        </body>
        </html>
      `);
      iframeDoc.close();

      this.state.currentStyleTag = iframeDoc.getElementById("dynamic-style");
      return this.state.currentStyleTag;
    } catch (error) {
      console.error("Erro ao configurar preview:", error);
      this.updateStatus("❌ Erro ao configurar preview", "error");
      return null;
    }
  }

  playCSS() {
    if (!this.validateInputs()) return;
    if (this.state.isPlaying) return;

    this.state.originalCSS = this.elements.cssArea.textContent;
    this.elements.cssArea.textContent = "";

    // Adicionar classe de digitação
    this.elements.cssArea.parentElement.classList.add("typing");

    this.state.isPlaying = true;
    this.state.currentIndex = 0;
    this.elements.playBtn.disabled = true;
    this.elements.stopBtn.disabled = false;

    this.elements.cssArea.setAttribute("contenteditable", "false");
    this.elements.htmlArea.setAttribute("contenteditable", "false");

    const styleTag = this.setupPreview();
    if (!styleTag) return;

    this.updateStatus("🚀 Iniciando animação...", "info");
    this.typeCSS(styleTag);
  }

  typeCSS(styleTag) {
    if (
      this.state.currentIndex <= this.state.cssCode.length &&
      this.state.isPlaying
    ) {
      const typedCSS = this.state.cssCode.slice(0, this.state.currentIndex);

      // Atualiza a camada de fundo com syntax highlight
      const highlighted = hljs.highlight(typedCSS, { language: "css" }).value;
      document.getElementById("css-highlight").innerHTML = highlighted;

      // Atualiza o conteúdo editável com texto invisível para manter o caret
      this.elements.cssArea.textContent = typedCSS;

      this.autoScrollToBottom();

      try {
        styleTag.textContent = typedCSS;
      } catch (error) {
        console.error("Erro ao aplicar CSS:", error);
      }

      this.state.currentIndex++;
      const typingSpeed = this.getCurrentTypingSpeed();
      this.state.typingInterval = setTimeout(() => {
        this.typeCSS(styleTag);
      }, typingSpeed);
    } else {
      this.finishAnimation();
    }
  }

  finishAnimation() {
    this.state.isPlaying = false;
    this.elements.playBtn.disabled = false;

    // Remover classe de digitação
    this.elements.cssArea.parentElement.classList.remove("typing");

    this.elements.cssArea.setAttribute("contenteditable", "true");
    this.elements.cssArea.parentElement.classList.remove("typing");

    this.elements.htmlArea.setAttribute("contenteditable", "true");

    // Aplicar highlighting final
    this.reapplyHighlighting(this.elements.cssArea);
    this.reapplyHighlighting(this.elements.htmlArea);

    // Espera o highlight.js terminar para aplicar scroll final
    setTimeout(() => {
      this.elements.cssArea.scrollTop = this.elements.cssArea.scrollHeight;

      const highlight = document.getElementById("css-highlight");
      if (highlight) {
        highlight.parentElement.scrollTop = this.elements.cssArea.scrollTop;
        highlight.parentElement.scrollLeft = this.elements.cssArea.scrollLeft;
      }
    }, 5); // pequeno delay para o DOM estabilizar

    // Sincronizar scroll do highlight (camada de fundo)
    const highlight = document.getElementById("css-highlight");
    highlight.parentElement.scrollTop = this.elements.cssArea.scrollTop;
    highlight.parentElement.scrollLeft = this.elements.cssArea.scrollLeft;

    if (this.state.currentIndex > this.state.cssCode.length) {
      this.updateStatus("✅ Animação concluída!", "success");

      document.getElementById("css-highlight").innerHTML = "";
    }
  }

  stopCSS() {
    if (this.state.typingInterval) {
      clearTimeout(this.state.typingInterval);
      this.state.typingInterval = null;
    }

    this.state.isPlaying = false;
    this.elements.playBtn.disabled = false;
    this.elements.stopBtn.disabled = true;

    // Remover classe de digitação
    this.elements.cssArea.parentElement.classList.remove("typing");

    this.elements.cssArea.setAttribute("contenteditable", "true");

    this.elements.htmlArea.setAttribute("contenteditable", "true");

    if (this.state.originalCSS) {
      this.elements.cssArea.textContent = this.state.originalCSS;
      this.reapplyHighlighting(this.elements.cssArea);

      document.getElementById("css-highlight").innerHTML = "";
    }

    try {
      const iframeDoc =
        this.elements.preview.contentDocument ||
        this.elements.preview.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(
        `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title><style>body { background-color: ${this.state.backgroundColor}; }</style></head><body></body></html>`
      );
      iframeDoc.close();
      this.state.currentStyleTag = null;
    } catch (error) {
      console.error("Erro ao limpar o iframe:", error);
    }

    this.updateStatus("⏹️ Animação interrompida", "warning");
  }

  getCurrentTypingSpeed() {
    return parseInt(this.elements.speedInput.value) || 25;
  }

  loadExamples() {
    // Adicionar exemplos básicos
    this.elements.htmlArea.textContent = `<div class="box">
  <h1>Hello World!</h1>
  <p>Este é um exemplo de CSS Player</p>
</div>`;

    this.elements.cssArea.textContent = `.box {
  width: 300px;
  height: 200px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: Arial, sans-serif;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

h1 {
  margin: 0;
  font-size: 24px;
}

p {
  margin: 10px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}`;

    // Aplicar highlighting inicial
    setTimeout(() => {
      this.reapplyHighlighting(this.elements.htmlArea);
      this.reapplyHighlighting(this.elements.cssArea);
    }, 100);
  }
}

// Inicializar a aplicação
document.addEventListener("DOMContentLoaded", () => {
  new CSSPlayer();
});

// Atalhos de teclado
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    const playBtn = document.getElementById("playBtn");
    if (!playBtn.disabled) {
      playBtn.click();
    }
  }

  if (e.key === "Escape") {
    e.preventDefault();
    const stopBtn = document.getElementById("stopBtn");
    if (!stopBtn.disabled) {
      stopBtn.click();
    }
  }
});
