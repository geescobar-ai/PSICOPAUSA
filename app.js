/**
 * PSICOPAUSA - Aplicación Web de Autocuidado Emocional
 * Router, Navegación Adaptable y Micro-Interacciones
 */

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initDashboard();
  initRegulacion();
  initLimites();
  initDiario();
  initCrisis();
  updateLiveDates();
});

/* ==========================================================================
   1. ROUTER Y NAVEGACIÓN ADAPTABLE (ESCRITORIO & MÓVIL)
   ========================================================================== */
const VALID_VIEWS = ['dashboard', 'regulacion', 'limites', 'diario', 'crisis'];

function initRouter() {
  // Manejar clics en cualquier botón o enlace con data-nav o data-path
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav], [data-path]');
    if (navEl) {
      e.preventDefault();
      let targetView = navEl.getAttribute('data-nav') || navEl.getAttribute('data-path');
      
      // Normalizar nombres si vienen con sufijos de stitch
      if (targetView === 'limites-profesionales') targetView = 'limites';
      if (targetView === 'diario-privado') targetView = 'diario';
      if (targetView === 'ayuda-crisis') targetView = 'crisis';
      
      if (VALID_VIEWS.includes(targetView)) {
        navigateTo(targetView);
      }
    }
  });

  // Escuchar cambios en el hash de la URL (soporte para botón atrás/adelante)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (VALID_VIEWS.includes(hash)) {
      navigateTo(hash, false);
    }
  });

  // Vista inicial desde la URL o por defecto 'dashboard'
  const initialHash = window.location.hash.replace('#', '');
  if (VALID_VIEWS.includes(initialHash)) {
    navigateTo(initialHash, false);
  } else {
    navigateTo('dashboard', false);
  }
}

function navigateTo(viewName, updateHash = true) {
  if (!VALID_VIEWS.includes(viewName)) return;

  // 1. Mostrar vista activa y ocultar las demás
  VALID_VIEWS.forEach((v) => {
    const section = document.getElementById(`view-${v}`);
    if (section) {
      if (v === viewName) {
        section.classList.remove('hidden');
        section.classList.add('flex');
      } else {
        section.classList.add('hidden');
        section.classList.remove('flex');
      }
    }
  });

  // 2. Actualizar estilos en el Sidebar de Escritorio
  const sidebarItems = document.querySelectorAll('#desktop-sidebar-nav .sidebar-nav-item');
  sidebarItems.forEach((btn) => {
    const itemNav = btn.getAttribute('data-nav');
    if (itemNav === viewName) {
      if (viewName === 'crisis') {
        btn.className = 'sidebar-nav-item flex items-center gap-space-sm px-space-md py-space-sm rounded-xl transition-all duration-200 group text-left w-full bg-error text-on-error font-semibold shadow-md';
      } else {
        btn.className = 'sidebar-nav-item flex items-center gap-space-sm px-space-md py-space-sm rounded-xl transition-all duration-200 group text-left w-full bg-primary-container text-on-primary-container font-semibold shadow-[0_2px_12px_-2px_rgba(37,52,47,0.12)]';
      }
    } else {
      if (itemNav === 'crisis') {
        btn.className = 'sidebar-nav-item flex items-center gap-space-sm px-space-md py-space-sm rounded-xl text-error hover:bg-error/10 transition-all duration-200 group text-left w-full';
      } else {
        btn.className = 'sidebar-nav-item flex items-center gap-space-sm px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 group text-left w-full';
      }
    }
  });

  // 3. Actualizar estilos en el Menú Inferior Móvil
  const mobileNavItems = document.querySelectorAll('#mobile-bottom-nav .mobile-nav-item');
  mobileNavItems.forEach((btn) => {
    const itemNav = btn.getAttribute('data-nav');
    btn.classList.remove('active', 'active-crisis');
    if (itemNav === viewName) {
      if (viewName === 'crisis') {
        btn.classList.add('active-crisis');
      } else {
        btn.classList.add('active');
      }
    }
  });

  // 4. Actualizar hash en la barra de direcciones
  if (updateHash) {
    history.pushState(null, '', `#${viewName}`);
  }

  // 5. Scroll suave al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   2. FUNCIONALIDAD DEL DASHBOARD Y REGISTRO EMOCIONAL (Paso 2)
   ========================================================================== */
function initDashboard() {
  // Selector de Turno (Mañana / Tarde)
  const shiftBtns = document.querySelectorAll('#shift-toggle-group .shift-btn');
  shiftBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      shiftBtns.forEach((b) => {
        b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
        b.classList.add('text-on-surface-variant');
      });
      btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
      btn.classList.remove('text-on-surface-variant');
    });
  });

  // Nube de Emociones (seleccionar hasta 3)
  const emotionChips = document.querySelectorAll('#emotions-cloud .emotion-chip');
  const selectedEmotions = new Set(['Calma']); // Selección por defecto

  emotionChips.forEach((chip) => {
    const emo = chip.getAttribute('data-emotion');
    if (selectedEmotions.has(emo)) {
      setChipActive(chip, true);
    }

    chip.addEventListener('click', () => {
      const name = chip.getAttribute('data-emotion');
      if (selectedEmotions.has(name)) {
        selectedEmotions.delete(name);
        setChipActive(chip, false);
      } else {
        if (selectedEmotions.size < 3) {
          selectedEmotions.add(name);
          setChipActive(chip, true);
        } else {
          // Vibración o aviso sutil de límite de 3
          chip.classList.add('ring-2', 'ring-secondary');
          setTimeout(() => chip.classList.remove('ring-2', 'ring-secondary'), 300);
        }
      }
    });
  });

  function setChipActive(chip, isActive) {
    if (isActive) {
      chip.classList.add('bg-primary-container', 'text-on-primary-container', 'font-semibold', 'ring-1', 'ring-primary');
      chip.classList.remove('bg-surface-container', 'text-on-surface-variant');
    } else {
      chip.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-semibold', 'ring-1', 'ring-primary');
      chip.classList.add('bg-surface-container', 'text-on-surface-variant');
    }
  }

  // Slider de Intensidad Emocional con descriptores clínicos
  const slider = document.getElementById('intensity-slider');
  const numDisplay = document.getElementById('intensity-number');
  const descDisplay = document.getElementById('intensity-descriptor');

  const descriptors = {
    1: 'Leve y sereno: Buen anclaje emocional. Tu energía fluye sin rumiación.',
    2: 'Calmo y consciente: Hay presencia clínica y balance físico claro.',
    3: 'Sensación de fatiga normal: Día de trabajo activo, pero tus fronteras están íntegras.',
    4: 'Leve y manejable: Notas la carga de los consultantes pero puedes transitarla sin bloqueo.',
    5: 'Tensión moderada: Aparece cierto cansancio mental. Se aconseja no sobrecargar la noche.',
    6: 'Sobrecarga detectable: Los casos reverberan en la cabeza. Necesitas desconectar pronto.',
    7: 'Fatiga por empatía tangible: Inquietud corporal o pesadez en el pecho tras sesiones.',
    8: 'Saturación considerable: Deseo de aislarte o irritabilidad residual post-práctica.',
    9: 'Agotamiento severo: Dificultad para procesar nueva información. Pausa mandatoria.',
    10: 'Desborde emocional que requiere pausa: Por favor consulta con un colega de confianza o tu tutor.'
  };

  if (slider && numDisplay && descDisplay) {
    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      numDisplay.textContent = `${val} / 10`;
      descDisplay.textContent = `"${descriptors[val] || ''}"`;
    });
  }

  // Guardado de Registro del Día (Simulación interactiva y toast)
  const saveBtn = document.getElementById('save-log-btn');
  const toast = document.getElementById('save-toast');
  const closeToast = document.getElementById('close-toast');

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.disabled = true;
      const originalHtml = saveBtn.innerHTML;
      saveBtn.innerHTML = `<span class="material-symbols-outlined text-base animate-spin">progress_activity</span><span>Guardando localmente...</span>`;

      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-base">check</span><span>¡Registrado!</span>`;
        if (toast) toast.classList.remove('hidden');

        setTimeout(() => {
          saveBtn.innerHTML = originalHtml;
        }, 3000);
      }, 500);
    });
  }

  if (closeToast && toast) {
    closeToast.addEventListener('click', () => toast.classList.add('hidden'));
  }
}

/* ==========================================================================
   3. GIMNASIO DE REGULACIÓN EMOCIONAL (Paso 3)
   ========================================================================== */
function initRegulacion() {
  // Pasos Grounding 5-4-3-2-1
  const stepCards = document.querySelectorAll('#groundingStepsContainer .step-card');
  stepCards.forEach((card) => {
    card.addEventListener('click', () => {
      stepCards.forEach((c) => {
        c.classList.remove('active-step', 'bg-surface-container-low');
        c.classList.add('bg-surface-container/40');
      });
      card.classList.add('active-step', 'bg-surface-container-low');
      card.classList.remove('bg-surface-container/40');
    });
  });

  // Selector de Audio (Voz cálida vs Campanas)
  const soundVoiceBtn = document.getElementById('soundVoiceBtn');
  const soundBellsBtn = document.getElementById('soundBellsBtn');

  if (soundVoiceBtn && soundBellsBtn) {
    soundVoiceBtn.addEventListener('click', () => {
      soundVoiceBtn.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      soundVoiceBtn.classList.remove('text-on-surface-variant');
      soundBellsBtn.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      soundBellsBtn.classList.add('text-on-surface-variant');
    });

    soundBellsBtn.addEventListener('click', () => {
      soundBellsBtn.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      soundBellsBtn.classList.remove('text-on-surface-variant');
      soundVoiceBtn.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      soundVoiceBtn.classList.add('text-on-surface-variant');
    });
  }

  // Reproductor / Animación del Orbe
  const playBtn = document.getElementById('mainPlayPauseBtn');
  const playIcon = document.getElementById('mainPlayIcon');
  const orbOuter = document.getElementById('orbGlowOuter');
  const orbMiddle = document.getElementById('orbGlowMiddle');
  let isPlaying = false;

  if (playBtn && playIcon) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        playIcon.textContent = 'pause';
        if (orbOuter) orbOuter.classList.add('scale-125', 'opacity-90');
        if (orbMiddle) orbMiddle.classList.add('scale-110');
      } else {
        playIcon.textContent = 'play_arrow';
        if (orbOuter) orbOuter.classList.remove('scale-125', 'opacity-90');
        if (orbMiddle) orbMiddle.classList.remove('scale-110');
      }
    });
  }
}

/* ==========================================================================
   4. ENTRENAMIENTO EN LÍMITES PROFESIONALES (Paso 5)
   ========================================================================== */
window.selectOption = function(option) {
  const cards = document.querySelectorAll('.option-card');
  cards.forEach((c) => {
    c.classList.remove('bg-primary-fixed', 'text-on-primary-fixed', 'ring-2', 'ring-primary');
    c.classList.add('bg-surface-container-low');
  });

  // Resaltar tarjeta seleccionada
  const selectedCard = event ? event.currentTarget : null;
  if (selectedCard) {
    selectedCard.classList.remove('bg-surface-container-low');
    selectedCard.classList.add('bg-primary-fixed', 'text-on-primary-fixed', 'ring-2', 'ring-primary');
  }

  const titleEl = document.getElementById('feedback-title');
  const bodyEl = document.getElementById('feedback-body');
  const iconEl = document.getElementById('feedback-icon');

  if (!titleEl || !bodyEl || !iconEl) return;

  if (option === 'A') {
    titleEl.textContent = 'Opción A: Riesgo de Sobrecarga y Desdibujamiento';
    bodyEl.textContent = 'Al atender por chat en un domingo por la noche, refuerzas la fantasía de rescate inmediato y generas una expectativa insostenible a largo plazo. Además, vulneras tu propio derecho al descanso restaurativo, elevando el riesgo de fatiga por compasión.';
    iconEl.textContent = 'warning';
    iconEl.className = 'material-symbols-outlined text-secondary text-2xl';
  } else if (option === 'B') {
    titleEl.textContent = 'Opción B: Respuesta Ética, Cuidadosa y Sostenible (Recomendada)';
    bodyEl.textContent = 'Excelente abordaje. Validas la seriedad de la situación sin asumir un rol de urgencias 24/7 que la psicoterapia ambulatoria no contempla. Provees alternativas concretas de salvaguarda (línea 106 de crisis) y mantienes el espacio terapéutico protegido para profundizar en sesión hábil.';
    iconEl.textContent = 'verified';
    iconEl.className = 'material-symbols-outlined text-primary text-2xl';
  } else if (option === 'C') {
    titleEl.textContent = 'Opción C: Silencio Sin Marco Previsto';
    bodyEl.textContent = 'Aunque protege tu tiempo de descanso, dejar en visto sin un protocolo previamente explicitado puede generar vivencia de abandono o escalamiento del riesgo en el usuario. Lo ideal es siempre contar con un encuadre digital prefijado o una respuesta institucional automatizada.';
    iconEl.textContent = 'help';
    iconEl.className = 'material-symbols-outlined text-outline text-2xl';
  }
};

function initLimites() {
  // Asegura que las opciones sean clicables
  const optionCards = document.querySelectorAll('#decision-options .option-card');
  optionCards.forEach((card, idx) => {
    const letters = ['A', 'B', 'C'];
    card.addEventListener('click', (e) => {
      window.selectOption(letters[idx]);
    });
  });
}

/* ==========================================================================
   5. DIARIO PRIVADO DE REFLEXIÓN (Paso 4)
   ========================================================================== */
window.togglePrompt = function(step) {
  const desc = document.getElementById(`prompt-desc-${step}`);
  const input = document.getElementById(`prompt-input-${step}`);
  const icon = document.getElementById(`prompt-icon-${step}`);

  if (input) {
    const isHidden = input.classList.contains('hidden');
    if (isHidden) {
      input.classList.remove('hidden');
      if (desc) desc.classList.remove('hidden');
      if (icon) icon.textContent = 'expand_less';
    } else {
      input.classList.add('hidden');
      if (desc) desc.classList.add('hidden');
      if (icon) icon.textContent = 'expand_more';
    }
  }
};

window.handleWordCount = function(textarea) {
  const countBadge = document.getElementById('word-count-badge');
  if (countBadge && textarea) {
    const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
    countBadge.textContent = `${words} palabras registradas`;
  }
};

window.toggleTag = function(btn) {
  btn.classList.toggle('bg-primary-container');
  btn.classList.toggle('text-on-primary-container');
  btn.classList.toggle('font-semibold');
};

window.toggleSupervisionTag = function() {
  const icon = document.getElementById('supervision-icon');
  const text = document.getElementById('supervision-text');
  if (icon && text) {
    if (icon.textContent === 'bookmark_border') {
      icon.textContent = 'bookmark';
      text.textContent = 'Marcado para supervisión ✓';
    } else {
      icon.textContent = 'bookmark_border';
      text.textContent = 'Marcar para llevar a supervisión';
    }
  }
};

window.saveJournalEntry = function() {
  alert('Entrada guardada en la memoria local de tu navegador. Gracias por regalarte este cierre reflexivo.');
};

window.openClosureRitualModal = function() {
  alert('Ritual de cierre: Inhala profundo tres veces, sacude suavemente tus manos y di para tus adentros: "Mi jornada formativa terminó por hoy; los consultantes quedan al cuidado de sus propias fuerzas y de la red de apoyo hasta el próximo encuentro."');
};

function initDiario() {
  // Selector de turno en el diario
  const diarioShifts = document.querySelectorAll('#view-diario .shift-btn');
  diarioShifts.forEach((btn) => {
    btn.addEventListener('click', () => {
      diarioShifts.forEach((b) => {
        b.classList.remove('bg-primary', 'text-on-primary', 'shadow-xs');
        b.classList.add('text-on-surface-variant');
      });
      btn.classList.add('bg-primary', 'text-on-primary', 'shadow-xs');
      btn.classList.remove('text-on-surface-variant');
    });
  });
}

/* ==========================================================================
   6. CENTRO DE AYUDA EN CRISIS (Paso 6)
   ========================================================================== */
function initCrisis() {
  const btnBreathing = document.getElementById('btn-breathing');
  const boxBreathing = document.getElementById('box-breathing-anim');
  const circlePulse = document.getElementById('circle-pulse');
  const breathText = document.getElementById('breath-text');
  const breathSub = document.getElementById('breath-sub');

  let isBreathing = false;
  let timerId = null;

  if (btnBreathing && boxBreathing) {
    btnBreathing.addEventListener('click', () => {
      isBreathing = !isBreathing;
      if (isBreathing) {
        boxBreathing.classList.remove('hidden');
        boxBreathing.classList.add('flex');
        btnBreathing.innerHTML = '<span class="material-symbols-outlined text-base">stop</span><span>Detener Ritmo</span>';
        runBreathingCycle();
      } else {
        boxBreathing.classList.add('hidden');
        boxBreathing.classList.remove('flex');
        btnBreathing.innerHTML = '<span class="material-symbols-outlined text-base">play_arrow</span><span>Iniciar Ritmo Guiado (4-7-8)</span>';
        clearTimeout(timerId);
      }
    });

    function runBreathingCycle() {
      let phase = 0;
      function step() {
        if (!isBreathing) return;
        if (phase === 0) {
          // Inhala (4s)
          if (breathText) breathText.textContent = 'Inhala';
          if (breathSub) breathSub.textContent = 'Inhala lentamente por tu nariz sintiendo tu abdomen expandirse... (4s)';
          if (circlePulse) {
            circlePulse.style.transform = 'scale(1.4)';
            circlePulse.className = 'w-24 h-24 rounded-full bg-primary/40 flex items-center justify-center transition-all duration-1000';
          }
          phase = 1;
          timerId = setTimeout(step, 4000);
        } else if (phase === 1) {
          // Sostén (4s)
          if (breathText) breathText.textContent = 'Sostén';
          if (breathSub) breathSub.textContent = 'Mantén el aire con calma, sin tensión en tus hombros... (4s)';
          if (circlePulse) {
            circlePulse.style.transform = 'scale(1.4)';
            circlePulse.className = 'w-24 h-24 rounded-full bg-tertiary-fixed flex items-center justify-center transition-all duration-1000';
          }
          phase = 2;
          timerId = setTimeout(step, 4000);
        } else {
          // Exhala (6s)
          if (breathText) breathText.textContent = 'Exhala';
          if (breathSub) breathSub.textContent = 'Suelta todo el aire por la boca de forma continua y suave... (6s)';
          if (circlePulse) {
            circlePulse.style.transform = 'scale(0.9)';
            circlePulse.className = 'w-24 h-24 rounded-full bg-secondary-fixed flex items-center justify-center transition-all duration-1000';
          }
          phase = 0;
          timerId = setTimeout(step, 6000);
        }
      }
      step();
    }
  }
}

/* ==========================================================================
   7. FECHAS Y HORARIOS DINÁMICOS
   ========================================================================== */
function updateLiveDates() {
  const now = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  const formatted = now.toLocaleDateString('es-ES', options);
  
  const dateLabel = document.getElementById('current-date-label');
  if (dateLabel) {
    dateLabel.textContent = `Hoy, ${now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
  }

  const dateDisplay = document.getElementById('current-date-display');
  if (dateDisplay) {
    dateDisplay.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
