/**
 * PSICOPAUSA - Aplicación Web de Autocuidado Emocional
 * Router, Personalización de Perfil, Motor de Audio y Micro-Interacciones
 */

/* ==========================================================================
   UTILIDADES GLOBALES
   ========================================================================== */

/**
 * Convierte segundos totales al formato MM:SS (ej: 125 → "02:05")
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatMmSs(totalSeconds) {
  const t = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

document.addEventListener('DOMContentLoaded', () => {
  initUserProfile();
  initRouter();
  initDashboard();
  initRegulacion();
  initLimites();
  initDiario();
  initCrisis();
  updateLiveDates();
});

/* ==========================================================================
   1. PERSONALIZACIÓN DEL PERFIL DE USUARIO (LocalStorage)
   ========================================================================== */
const USER_PROFILE_KEY = 'psicopausa_user_profile';

function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer el perfil desde localStorage:', e);
  }
  return null;
}

function saveUserProfileData(name, role) {
  const cleanName = (name || '').trim();
  const cleanRole = (role || '').trim();
  
  const profile = {
    name: cleanName || 'Estudiante',
    role: cleanRole || 'Practicante de Psicología',
    isCustomized: Boolean(cleanName || cleanRole)
  };

  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error al guardar el perfil en localStorage:', e);
  }

  applyUserProfile(profile);
}

function applyUserProfile(profile) {
  const name = profile && profile.name ? profile.name : 'Estudiante';
  const role = profile && profile.role ? profile.role : 'Practicante de Psicología';

  // 1. Elementos en la barra superior (Header)
  const headerName = document.getElementById('header-profile-name');
  const headerRole = document.getElementById('header-profile-role');
  const headerAvatar = document.getElementById('header-profile-avatar');

  if (headerName) headerName.textContent = name;
  if (headerRole) headerRole.textContent = role;
  if (headerAvatar) {
    // Generar iniciales limpias de 1 o 2 letras
    const words = name.split(/\s+/).filter(Boolean);
    let initials = 'ES';
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else if (words.length === 1) {
      initials = words[0][0].toUpperCase();
    }
    headerAvatar.textContent = initials;
  }

  // 2. Saludo en el Dashboard
  const greetingName = document.getElementById('dashboard-user-name');
  if (greetingName) {
    greetingName.textContent = name;
  }
}

function openProfileModal(isEditing = false) {
  const modal = document.getElementById('profile-modal');
  const title = document.getElementById('profile-modal-title');
  const subtitle = document.getElementById('profile-modal-subtitle');
  const nameInput = document.getElementById('profile-name-input');
  const roleInput = document.getElementById('profile-role-input');
  const btnText = document.getElementById('btn-save-profile-text');
  const btnSkip = document.getElementById('btn-skip-profile');
  const btnClose = document.getElementById('close-profile-modal-btn');

  if (!modal) return;

  const current = getUserProfile();

  if (isEditing) {
    if (title) title.textContent = 'Editar tu perfil';
    if (subtitle) subtitle.textContent = 'Actualiza tu nombre y rol en PSICOPAUSA';
    if (nameInput) nameInput.value = (current && current.name !== 'Estudiante') ? current.name : '';
    if (roleInput) roleInput.value = (current && current.role !== 'Practicante de Psicología') ? current.role : '';
    if (btnText) btnText.textContent = 'Guardar cambios';
    if (btnSkip) btnSkip.classList.add('hidden');
    if (btnClose) btnClose.classList.remove('hidden');
  } else {
    if (title) title.textContent = '¡Bienvenido a PSICOPAUSA!';
    if (subtitle) subtitle.textContent = 'Tu espacio personal de autocuidado';
    if (nameInput) nameInput.value = '';
    if (roleInput) roleInput.value = '';
    if (btnText) btnText.textContent = 'Comenzar mi pausa';
    if (btnSkip) btnSkip.classList.remove('hidden');
    if (btnClose) btnClose.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  if (nameInput) {
    setTimeout(() => nameInput.focus(), 120);
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) modal.classList.add('hidden');
}

function initUserProfile() {
  const savedProfile = getUserProfile();

  if (!savedProfile) {
    // Primera visita: mostrar pantalla de bienvenida personalizada
    openProfileModal(false);
  } else {
    applyUserProfile(savedProfile);
  }

  // Formulario de perfil
  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('profile-name-input');
      const roleInput = document.getElementById('profile-role-input');
      saveUserProfileData(nameInput ? nameInput.value : '', roleInput ? roleInput.value : '');
      closeProfileModal();
    });
  }

  // Botón "Continuar como Estudiante"
  const btnSkip = document.getElementById('btn-skip-profile');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      saveUserProfileData('Estudiante', 'Practicante de Psicología');
      closeProfileModal();
    });
  }

  // Botón cerrar (X)
  const btnClose = document.getElementById('close-profile-modal-btn');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      closeProfileModal();
    });
  }

  // Clic en el perfil del encabezado para editar
  const headerBtn = document.getElementById('header-profile-btn');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      openProfileModal(true);
    });
  }
}

/* ==========================================================================
   2. ROUTER Y NAVEGACIÓN ADAPTABLE (ESCRITORIO & MÓVIL)
   ========================================================================== */
const VALID_VIEWS = ['dashboard', 'regulacion', 'limites', 'diario', 'crisis'];

function initRouter() {
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav], [data-path]');
    if (navEl) {
      e.preventDefault();
      let targetView = navEl.getAttribute('data-nav') || navEl.getAttribute('data-path');
      
      if (targetView === 'limites-profesionales') targetView = 'limites';
      if (targetView === 'diario-privado') targetView = 'diario';
      if (targetView === 'ayuda-crisis') targetView = 'crisis';
      
      if (VALID_VIEWS.includes(targetView)) {
        navigateTo(targetView);
      }
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (VALID_VIEWS.includes(hash)) {
      navigateTo(hash, false);
    }
  });

  const initialHash = window.location.hash.replace('#', '');
  if (VALID_VIEWS.includes(initialHash)) {
    navigateTo(initialHash, false);
  } else {
    navigateTo('dashboard', false);
  }
}

function navigateTo(viewName, updateHash = true) {
  if (!VALID_VIEWS.includes(viewName)) return;

  // 1. Mostrar vista activa
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

  // 2. Estilos barra lateral de escritorio
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

  // 3. Estilos menú inferior móvil
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

  if (updateHash) {
    history.pushState(null, '', `#${viewName}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   3. SÍNTESIS DE AUDIO Y GUÍA DE VOZ (Web Audio API & SpeechSynthesis)
   ========================================================================== */
class TibetanBowlSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playChime(phase = 'inhale') {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Frecuencias para armonización y calma:
      // Inhala: 432 Hz (tono suave de apertura)
      // Sostén: 528 Hz (presencia y enfoque)
      // Exhala: 360 Hz (descompresión y arraigo)
      let baseFreq = 432;
      if (phase === 'hold') baseFreq = 528;
      if (phase === 'exhale') baseFreq = 360;

      // Parciales armónicos de cuenco tibetano
      const partials = [
        { mult: 1.0, gain: 0.35, decay: 3.5 },
        { mult: 2.76, gain: 0.18, decay: 2.8 },
        { mult: 5.40, gain: 0.08, decay: 1.8 },
        { mult: 8.93, gain: 0.03, decay: 1.0 }
      ];

      partials.forEach(p => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * p.mult, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(p.gain, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + p.decay);
      });
    } catch (e) {
      console.warn('Error en síntesis de campana tibetana:', e);
    }
  }
}

class VoiceGuide {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.spanishVoice = null;
    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    this.spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Helena') || v.name.includes('Sabina') || v.name.includes('Google') || v.name.includes('Paulina')))
      || voices.find(v => v.lang.startsWith('es'))
      || null;
  }

  speak(text) {
    if (!this.synth) return;
    this.stop(); // Evitar encolamiento de frases anteriores

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.88; // Ritmo pausado y relajante
    utterance.pitch = 0.95; // Tono cálido
    if (this.spanishVoice) {
      utterance.voice = this.spanishVoice;
    }

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  pause() {
    if (this.synth) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }
}

/* ==========================================================================
   4. GIMNASIO DE REGULACIÓN EMOCIONAL (Protocolos Somáticos & Audio Autónomo)
   ========================================================================== */
function initRegulacion() {
  const tibetanBowl = new TibetanBowlSynth();
  const voiceGuide = new VoiceGuide();
  let soundMode = 'voice'; // 'voice' | 'bells' | 'mute'

  // Catálogo de configuraciones para cada protocolo somático
  const PROTOCOLS_CONFIG = {
    '4-7-8': {
      id: '4-7-8',
      title: 'Respiración Diafragmática 4-7-8',
      category: 'Respiración Guiada',
      effort: '4 min · Muy Suave · Sentado',
      desc: 'Desacelera el ritmo cardíaco e interrumpe la sobreestimulación simpática tras atender situaciones de crisis o desbordes afectivos intensos.',
      totalSeconds: 240,
      icon: 'air',
      renderLeft: () => `
        <div class="flex flex-col gap-space-sm">
          <span class="font-headline-sm text-headline-sm text-on-surface">Instrucciones del Ciclo Parasimpático</span>
          <p class="font-body-md text-body-md text-on-surface-variant">Sigue el ritmo del orbe somático. Cada ciclo dura 19 segundos para activar el nervio vago y calmar la reactividad:</p>
          <div class="flex flex-col gap-space-xs mt-1">
            <div class="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-3">
              <span class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">4s</span>
              <div><span class="font-label-md text-on-surface font-semibold">Inhala por la nariz</span><p class="text-xs text-on-surface-variant">Llena el abdomen de aire con suavidad.</p></div>
            </div>
            <div class="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-3">
              <span class="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-sm">7s</span>
              <div><span class="font-label-md text-on-surface font-semibold">Sostén el aire</span><p class="text-xs text-on-surface-variant">Retén con serenidad sin forzar la laringe.</p></div>
            </div>
            <div class="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-3">
              <span class="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm">8s</span>
              <div><span class="font-label-md text-on-surface font-semibold">Exhala por la boca</span><p class="text-xs text-on-surface-variant">Vacía lentamente soltando toda tensión física.</p></div>
            </div>
          </div>
        </div>
      `,
      onTick: (elapsed) => {
        const cycleSec = (elapsed - 1) % 19;
        let phase = 'inhale';
        let text = 'Inhala';
        let prompt = null;
        let scaleCore = '1.25', scaleOuter = '1.4', scaleMiddle = '1.2';
        let isPhaseStart = false;

        if (cycleSec < 4) {
          phase = 'inhale';
          text = `Inhala (${4 - cycleSec}s)`;
          isPhaseStart = (cycleSec === 0);
          if (isPhaseStart) prompt = 'Inhala profundamente por la nariz.';
          scaleCore = '1.25'; scaleOuter = '1.4'; scaleMiddle = '1.2';
        } else if (cycleSec < 11) {
          phase = 'hold';
          text = `Sostén (${11 - cycleSec}s)`;
          isPhaseStart = (cycleSec === 4);
          if (isPhaseStart) prompt = 'Sostén el aire con calma.';
          scaleCore = '1.2'; scaleOuter = '1.25'; scaleMiddle = '1.3';
        } else {
          phase = 'exhale';
          text = `Exhala (${19 - cycleSec}s)`;
          isPhaseStart = (cycleSec === 11);
          if (isPhaseStart) prompt = 'Exhala suavemente por la boca.';
          scaleCore = '0.92'; scaleOuter = '1.0'; scaleMiddle = '0.95';
        }

        return { phase, text, prompt, scaleCore, scaleOuter, scaleMiddle, isPhaseStart };
      }
    },

    'sacudida': {
      id: 'sacudida',
      title: 'Sacudida Somática y Liberación Muscular',
      category: 'Liberación Somática',
      effort: '6 min · Moderado · De pie',
      desc: 'Libera la hipertonía postural y el agarrotamiento en hombros, cuello y mandíbula acumulados durante horas de escucha empática profunda.',
      totalSeconds: 360,
      icon: 'vibration',
      renderLeft: () => `
        <div class="flex flex-col gap-space-sm">
          <span class="font-headline-sm text-headline-sm text-on-surface">Fases de Descarga Neurogénica</span>
          <p class="font-body-md text-body-md text-on-surface-variant">Ponte de pie con ropa cómoda. Libera la sobrecarga muscular acumulada en 3 fases progresivas:</p>
          <div class="flex flex-col gap-space-xs mt-1" id="somatic-phases-list">
            <div class="somatic-phase-card p-space-sm rounded-lg bg-surface-container-low border-l-4 border-primary transition-all duration-300" data-phase-index="1">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-primary">fitness_center</span> Fase 1 (Min 0-2): Extremidades Superiores</span>
              <p class="text-xs text-on-surface-variant">Sacude suavemente muñecas, dedos y antebrazos hacia el suelo. Permite que la adrenalina periférica drene.</p>
            </div>
            <div class="somatic-phase-card p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-phase-index="2">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-secondary">self_improvement</span> Fase 2 (Min 2-4): Hombros, Cuello y Mandíbula</span>
              <p class="text-xs text-on-surface-variant">Eleva hombros al inhalar y déjalos caer de golpe al exhalar con un suspiro sonoro. Rota suavemente el cuello.</p>
            </div>
            <div class="somatic-phase-card p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-phase-index="3">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-tertiary">accessibility_new</span> Fase 3 (Min 4-6): Enraizamiento y Quietud</span>
              <p class="text-xs text-on-surface-variant">Detén el movimiento poco a poco. Apoya firmemente ambos pies. Respira en calma y siente el alivio en tu cuerpo.</p>
            </div>
          </div>
        </div>
      `,
      onTick: (elapsed) => {
        let phaseIdx = 1;
        let text = 'Fase 1: Extremidades';
        let prompt = null;
        let isPhaseStart = false;

        if (elapsed <= 120) {
          phaseIdx = 1;
          text = `Fase 1 (${120 - elapsed}s)`;
          isPhaseStart = (elapsed === 1);
          if (isPhaseStart) prompt = 'Ponte de pie. Comienza sacudiendo suavemente tus manos y muñecas hacia el suelo.';
        } else if (elapsed <= 240) {
          phaseIdx = 2;
          text = `Fase 2 (${240 - elapsed}s)`;
          isPhaseStart = (elapsed === 121);
          if (isPhaseStart) prompt = 'Fase dos: Eleva hombros y déjalos caer con una exhalación profunda y sonora.';
        } else {
          phaseIdx = 3;
          text = `Fase 3 (${360 - elapsed}s)`;
          isPhaseStart = (elapsed === 241);
          if (isPhaseStart) prompt = 'Fase tres: Detén el movimiento gradualmente. Siente tus pies firmes en la tierra y respira en calma.';
        }

        const cards = document.querySelectorAll('#somatic-phases-list .somatic-phase-card');
        cards.forEach((c) => {
          const idx = parseInt(c.getAttribute('data-phase-index'), 10);
          if (idx === phaseIdx) {
            c.classList.add('bg-surface-container-low', 'border-primary');
            c.classList.remove('bg-surface-container/40', 'border-transparent');
          } else {
            c.classList.remove('bg-surface-container-low', 'border-primary');
            c.classList.add('bg-surface-container/40', 'border-transparent');
          }
        });

        const pulseCycle = elapsed % 2 === 0;
        return {
          phase: isPhaseStart ? 'hold' : 'inhale',
          text,
          prompt,
          scaleCore: pulseCycle ? '1.15' : '1.0',
          scaleOuter: pulseCycle ? '1.3' : '1.1',
          scaleMiddle: pulseCycle ? '1.2' : '1.05',
          isPhaseStart
        };
      }
    },

    'ritual': {
      id: 'ritual',
      title: 'El Ritual de Desprendimiento del Rol',
      category: 'Defusión & Cierre',
      effort: '8 min · Introspectivo · Sentado',
      desc: 'Visualización simbólica para depositar historias, dolores y demandas clínicas en el consultorio antes de volver a tu vida personal.',
      totalSeconds: 480,
      icon: 'door_back',
      renderLeft: () => `
        <div class="flex flex-col gap-space-sm">
          <span class="font-headline-sm text-headline-sm text-on-surface">Etapas del Cierre de Jornada</span>
          <p class="font-body-md text-body-md text-on-surface-variant">Toma asiento en un espacio de transición. Permite que el rol de terapeuta descanse hoy:</p>
          <div class="flex flex-col gap-space-xs mt-1" id="ritual-stages-list">
            <div class="ritual-stage-card p-space-sm rounded-lg bg-surface-container-low border-l-4 border-tertiary transition-all duration-300" data-stage-index="1">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-tertiary">lock_clock</span> Etapa 1 (Min 0-2:30): Cierre del Espacio Clínico</span>
              <p class="text-xs text-on-surface-variant">Agradece a tu mente el compromiso con las personas atendidas hoy. Reconoce tu límite humano con autocompasión.</p>
            </div>
            <div class="ritual-stage-card p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-stage-index="2">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-primary">work_outline</span> Etapa 2 (Min 2:30-5:30): El Maletín Simbólico</span>
              <p class="text-xs text-on-surface-variant">Imagina que depositas los diagnósticos, dolores y secretos en la mesa del consultorio. No te pertenecen; quedan bajo resguardo profesional.</p>
            </div>
            <div class="ritual-stage-card p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-stage-index="3">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-secondary">home</span> Etapa 3 (Min 5:30-8:00): Retorno a Tu Vida Personal</span>
              <p class="text-xs text-on-surface-variant">Quítate mentalmente el rol. Inhala tu propio nombre. Reconecta con tu descanso, tus afectos y tu paz.</p>
            </div>
          </div>
        </div>
      `,
      onTick: (elapsed) => {
        let stageIdx = 1;
        let text = 'Etapa 1: Cierre del espacio';
        let prompt = null;
        let isPhaseStart = false;

        if (elapsed <= 150) {
          stageIdx = 1;
          text = `Etapa 1 (${150 - elapsed}s)`;
          isPhaseStart = (elapsed === 1);
          if (isPhaseStart) prompt = 'Toma asiento cómodamente. Reconoce tu dedicación en la jornada de hoy. Este espacio clínico queda aquí.';
        } else if (elapsed <= 330) {
          stageIdx = 2;
          text = `Etapa 2 (${330 - elapsed}s)`;
          isPhaseStart = (elapsed === 151);
          if (isPhaseStart) prompt = 'Imagina que dejas las historias y dolores de tus pacientes en el consultorio. No te pertenecen; las sueltas con respeto.';
        } else {
          stageIdx = 3;
          text = `Etapa 3 (${480 - elapsed}s)`;
          isPhaseStart = (elapsed === 331);
          if (isPhaseStart) prompt = 'Inhala profundamente tu nombre. Te despides del rol de terapeuta y regresas a tu vida personal y a tu descanso.';
        }

        const stages = document.querySelectorAll('#ritual-stages-list .ritual-stage-card');
        stages.forEach((s) => {
          const idx = parseInt(s.getAttribute('data-stage-index'), 10);
          if (idx === stageIdx) {
            s.classList.add('bg-surface-container-low', 'border-tertiary');
            s.classList.remove('bg-surface-container/40', 'border-transparent');
          } else {
            s.classList.remove('bg-surface-container-low', 'border-tertiary');
            s.classList.add('bg-surface-container/40', 'border-transparent');
          }
        });

        return {
          phase: isPhaseStart ? 'hold' : 'gentle',
          text,
          prompt,
          scaleCore: '1.05',
          scaleOuter: '1.18',
          scaleMiddle: '1.1',
          isPhaseStart
        };
      }
    },

    'coherencia': {
      id: 'coherencia',
      title: 'Respiración de Resonancia Coherente (VFC)',
      category: 'Variabilidad Cardíaca',
      effort: '10 min · Calmo · Cualquier postura',
      desc: 'Pauta respiratoria de 5.5 respiraciones por minuto para inducir máxima sincronía entre el sistema cardiovascular y cerebral.',
      totalSeconds: 600,
      icon: 'monitor_heart',
      renderLeft: () => `
        <div class="flex flex-col gap-space-sm">
          <span class="font-headline-sm text-headline-sm text-on-surface">Biofeedback de Resonancia a 5.5 rpm</span>
          <p class="font-body-md text-body-md text-on-surface-variant">Al respirar a una frecuencia constante de 5.5 a 6 respiraciones por minuto (0.1 Hz), la variabilidad cardíaca entra en coherencia con el sistema nervioso central:</p>
          <div class="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2 mt-1">
            <div class="flex items-center justify-between font-label-md text-label-md">
              <span class="text-on-surface-variant">Frecuencia Óptima:</span>
              <span class="text-primary font-bold">5.5 rpm (0.1 Hz)</span>
            </div>
            <div class="flex items-center justify-between font-label-md text-label-md">
              <span class="text-on-surface-variant">Patrón:</span>
              <span class="text-on-surface font-semibold">5s Inhalar · 5s Exhalar</span>
            </div>
            <div class="flex items-center justify-between font-label-md text-label-md">
              <span class="text-on-surface-variant">Sincronía Autonómica:</span>
              <span class="text-primary font-bold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Máxima (Vagal)</span>
            </div>
          </div>
        </div>
      `,
      onTick: (elapsed) => {
        const sec = (elapsed - 1) % 10;
        const isInhale = sec < 5;
        const text = isInhale ? `Inhala (${5 - sec}s)` : `Exhala (${10 - sec}s)`;
        const isPhaseStart = (sec === 0 || sec === 5);
        const phase = isInhale ? 'inhale' : 'exhale';
        let prompt = null;

        if (sec === 0) {
          prompt = 'Inhala suavemente... expandiendo tu pecho.';
        } else if (sec === 5) {
          prompt = 'Exhala despacio... soltando el aire en calma.';
        }

        const scaleVal = isInhale ? (1.0 + (sec / 5) * 0.25).toFixed(2) : (1.25 - ((sec - 5) / 5) * 0.25).toFixed(2);
        const outerVal = isInhale ? (1.1 + (sec / 5) * 0.3).toFixed(2) : (1.4 - ((sec - 5) / 5) * 0.3).toFixed(2);
        const midVal = isInhale ? (1.05 + (sec / 5) * 0.2).toFixed(2) : (1.25 - ((sec - 5) / 5) * 0.2).toFixed(2);

        return {
          phase,
          text,
          prompt,
          scaleCore: scaleVal,
          scaleOuter: outerVal,
          scaleMiddle: midVal,
          isPhaseStart
        };
      }
    },

    'grounding': {
      id: 'grounding',
      title: 'Técnica Grounding 5-4-3-2-1',
      category: 'Anclaje Sensorial',
      effort: '5 min · Reorientación Sensorial',
      desc: 'Reubica tu foco cognitivo en el aquí y el ahora conectando secuencialmente con tus 5 sentidos.',
      totalSeconds: 300,
      icon: 'nature_people',
      renderLeft: () => `
        <div class="flex flex-col gap-space-sm">
          <span class="font-headline-sm text-headline-sm text-on-surface">Exploración Sensorial Secuencial</span>
          <p class="font-body-md text-body-md text-on-surface-variant">Conéctate paso a paso con el entorno real para desactivar el desborde cognitivo:</p>
          <div class="flex flex-col gap-space-xs mt-1" id="grounding-live-steps">
            <div class="grounding-step-item p-space-sm rounded-lg bg-surface-container-low border-l-4 border-primary transition-all duration-300" data-ground-step="5">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">5</span> 5 cosas que puedes ver</span>
              <p class="text-xs text-on-surface-variant">Detalles físicos: la textura del suelo, sombras, un cuadro, tus manos.</p>
            </div>
            <div class="grounding-step-item p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-ground-step="4">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs">4</span> 4 cosas que puedes tocar</span>
              <p class="text-xs text-on-surface-variant">El peso de tu cuerpo en la silla, la tela de tu ropa, la madera de la mesa.</p>
            </div>
            <div class="grounding-step-item p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-ground-step="3">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs">3</span> 3 sonidos que puedes oír</span>
              <p class="text-xs text-on-surface-variant">El reloj, el tráfico lejano, la ventilación o tu respiración.</p>
            </div>
            <div class="grounding-step-item p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-ground-step="2">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs">2</span> 2 aromas a tu alrededor</span>
              <p class="text-xs text-on-surface-variant">El aroma del café, el papel de un libro o la frescura del ambiente.</p>
            </div>
            <div class="grounding-step-item p-space-sm rounded-lg bg-surface-container/40 border-l-4 border-transparent transition-all duration-300" data-ground-step="1">
              <span class="font-label-md text-on-surface font-semibold flex items-center gap-1.5"><span class="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs">1</span> 1 sabor en tu boca</span>
              <p class="text-xs text-on-surface-variant">Toma un sorbo de agua fresca o nota la saliva en tu lengua.</p>
            </div>
          </div>
        </div>
      `,
      onTick: (elapsed) => {
        let stepNum = 5;
        let text = 'Paso 5: Observa 5 cosas';
        let prompt = null;
        let isPhaseStart = false;

        if (elapsed <= 60) {
          stepNum = 5;
          text = `Paso 5 (${60 - elapsed}s)`;
          isPhaseStart = (elapsed === 1);
          if (isPhaseStart) prompt = 'Paso 5: Observa con calma 5 cosas que puedes ver a tu alrededor.';
        } else if (elapsed <= 120) {
          stepNum = 4;
          text = `Paso 4 (${120 - elapsed}s)`;
          isPhaseStart = (elapsed === 61);
          if (isPhaseStart) prompt = 'Paso 4: Toca y siente cuatro texturas o sensaciones con tus manos o pies.';
        } else if (elapsed <= 180) {
          stepNum = 3;
          text = `Paso 3 (${180 - elapsed}s)`;
          isPhaseStart = (elapsed === 121);
          if (isPhaseStart) prompt = 'Paso 3: Identifica tres sonidos que puedas percibir en este momento.';
        } else if (elapsed <= 240) {
          stepNum = 2;
          text = `Paso 2 (${240 - elapsed}s)`;
          isPhaseStart = (elapsed === 181);
          if (isPhaseStart) prompt = 'Paso 2: Percibe dos aromas u olores en tu entorno.';
        } else {
          stepNum = 1;
          text = `Paso 1 (${300 - elapsed}s)`;
          isPhaseStart = (elapsed === 241);
          if (isPhaseStart) prompt = 'Paso 1: Saborea una sensación en tu boca o toma un sorbo de agua fresca.';
        }

        const items = document.querySelectorAll('#grounding-live-steps .grounding-step-item');
        items.forEach((item) => {
          const s = parseInt(item.getAttribute('data-ground-step'), 10);
          if (s === stepNum) {
            item.classList.add('bg-surface-container-low', 'border-primary');
            item.classList.remove('bg-surface-container/40', 'border-transparent');
          } else {
            item.classList.remove('bg-surface-container-low', 'border-primary');
            item.classList.add('bg-surface-container/40', 'border-transparent');
          }
        });

        return {
          phase: isPhaseStart ? 'hold' : 'inhale',
          text,
          prompt,
          scaleCore: '1.1',
          scaleOuter: '1.2',
          scaleMiddle: '1.15',
          isPhaseStart
        };
      }
    }
  };

  // Variables de control de ejecución
  let currentProtocolKey = '4-7-8';
  let isPlaying = false;
  let elapsedSeconds = 0;
  let totalDurationSeconds = 240;
  let timerInterval = null;

  // Elementos DOM de ejecución
  const catalogView = document.getElementById('regulation-catalog-view');
  const executionView = document.getElementById('regulation-execution-view');

  const execTitle = document.getElementById('exec-title');
  const execDesc = document.getElementById('exec-desc');
  const execBadgeCategory = document.getElementById('exec-badge-category');
  const execBadgeEffort = document.getElementById('exec-badge-effort');
  const execInteractiveLeft = document.getElementById('exec-interactive-left');

  const execOrbOuter = document.getElementById('exec-orbOuter');
  const execOrbMiddle = document.getElementById('exec-orbMiddle');
  const execOrbCore = document.getElementById('exec-orbCore');
  const execOrbIcon = document.getElementById('exec-orbIcon');
  const execOrbPhaseText = document.getElementById('exec-orbPhaseText');

  const soundVoiceBtn = document.getElementById('exec-soundVoiceBtn');
  const soundBellsBtn = document.getElementById('exec-soundBellsBtn');
  const soundMuteBtn = document.getElementById('exec-soundMuteBtn');
  const soundMuteIcon = document.getElementById('exec-soundMuteIcon');
  const soundMuteLabel = document.getElementById('exec-soundMuteLabel');

  const progressBar = document.getElementById('exec-progressBar');
  const timeElapsed = document.getElementById('exec-timeElapsed');
  const timeTotal = document.getElementById('exec-timeTotal');
  const playerStatus = document.getElementById('exec-playerStatus');

  const playBtn = document.getElementById('exec-playPauseBtn');
  const playIcon = document.getElementById('exec-playIcon');
  const prevBtn = document.getElementById('exec-prevBtn');
  const nextBtn = document.getElementById('exec-nextBtn');

  const backBtn = document.getElementById('exec-back-btn');
  const finishBottomBtn = document.getElementById('exec-finish-bottom-btn');

  // Funciones de actualización de UI de audio
  function updateSoundModeUI() {
    if (!soundVoiceBtn || !soundBellsBtn || !soundMuteBtn) return;

    soundVoiceBtn.className = 'flex-1 py-1.5 px-space-sm rounded-md font-label-sm text-label-sm font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ' +
      (soundMode === 'voice' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface');

    soundBellsBtn.className = 'flex-1 py-1.5 px-space-sm rounded-md font-label-sm text-label-sm font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ' +
      (soundMode === 'bells' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface');

    soundMuteBtn.className = 'py-1.5 px-space-sm rounded-md font-label-sm text-label-sm font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ' +
      (soundMode === 'mute' ? 'bg-error/15 text-error font-semibold' : 'text-on-surface-variant hover:text-on-surface');

    if (soundMuteIcon) soundMuteIcon.textContent = (soundMode === 'mute') ? 'volume_off' : 'volume_up';
    if (soundMuteLabel) soundMuteLabel.textContent = (soundMode === 'mute') ? 'Silencio' : 'Sonido';
  }

  if (soundVoiceBtn) {
    soundVoiceBtn.addEventListener('click', () => {
      soundMode = 'voice';
      updateSoundModeUI();
    });
  }

  if (soundBellsBtn) {
    soundBellsBtn.addEventListener('click', () => {
      soundMode = 'bells';
      tibetanBowl.init();
      tibetanBowl.playChime('inhale');
      updateSoundModeUI();
    });
  }

  if (soundMuteBtn) {
    soundMuteBtn.addEventListener('click', () => {
      if (soundMode !== 'mute') {
        soundMode = 'mute';
        voiceGuide.stop();
      } else {
        soundMode = 'voice';
      }
      updateSoundModeUI();
    });
  }

  // Reproducir audio de fase
  function triggerAudio(phase, prompt) {
    if (soundMode === 'mute') return;

    if (soundMode === 'bells') {
      tibetanBowl.init();
      tibetanBowl.playChime(phase);
    } else if (soundMode === 'voice' && prompt) {
      voiceGuide.speak(prompt);
    }
  }

  // Bucle por segundo
  function tick() {
    elapsedSeconds++;

    if (elapsedSeconds >= totalDurationSeconds) {
      stopExercise(true);
      return;
    }

    const cfg = PROTOCOLS_CONFIG[currentProtocolKey] || PROTOCOLS_CONFIG['4-7-8'];
    const tickResult = cfg.onTick(elapsedSeconds);

    if (tickResult.isPhaseStart) {
      triggerAudio(tickResult.phase, tickResult.prompt);
    }

    if (execOrbCore && tickResult.scaleCore) execOrbCore.style.transform = `scale(${tickResult.scaleCore})`;
    if (execOrbOuter && tickResult.scaleOuter) execOrbOuter.style.transform = `scale(${tickResult.scaleOuter})`;
    if (execOrbMiddle && tickResult.scaleMiddle) execOrbMiddle.style.transform = `scale(${tickResult.scaleMiddle})`;

    if (execOrbPhaseText && tickResult.text) execOrbPhaseText.textContent = tickResult.text;
    if (timeElapsed) timeElapsed.textContent = formatMmSs(elapsedSeconds);

    if (progressBar) {
      const pct = Math.min(100, (elapsedSeconds / totalDurationSeconds) * 100);
      progressBar.style.width = `${pct}%`;
    }

    if (playerStatus) {
      playerStatus.textContent = `${cfg.title} · ${tickResult.text}`;
    }
  }

  function startExercise() {
    tibetanBowl.init();
    isPlaying = true;
    if (playIcon) playIcon.textContent = 'pause';

    if (elapsedSeconds === 0) {
      const cfg = PROTOCOLS_CONFIG[currentProtocolKey] || PROTOCOLS_CONFIG['4-7-8'];
      const initialTick = cfg.onTick(1);
      triggerAudio(initialTick.phase, initialTick.prompt);

      if (execOrbCore && initialTick.scaleCore) execOrbCore.style.transform = `scale(${initialTick.scaleCore})`;
      if (execOrbOuter && initialTick.scaleOuter) execOrbOuter.style.transform = `scale(${initialTick.scaleOuter})`;
      if (execOrbMiddle && initialTick.scaleMiddle) execOrbMiddle.style.transform = `scale(${initialTick.scaleMiddle})`;

      if (execOrbPhaseText && initialTick.text) execOrbPhaseText.textContent = initialTick.text;
      if (timeElapsed) timeElapsed.textContent = formatMmSs(0);
      if (playerStatus) playerStatus.textContent = `${cfg.title} activa · ${initialTick.text}`;
    }

    clearInterval(timerInterval);
    timerInterval = setInterval(tick, 1000);
  }

  function pauseExercise() {
    isPlaying = false;
    if (playIcon) playIcon.textContent = 'play_arrow';
    clearInterval(timerInterval);
    timerInterval = null;
    voiceGuide.stop();

    if (playerStatus) {
      playerStatus.textContent = 'Pausa en curso · Pulsa reproducir para reanudar';
    }
  }

  function stopExercise(isCompleted = false) {
    pauseExercise();
    if (isCompleted) {
      const cfg = PROTOCOLS_CONFIG[currentProtocolKey] || PROTOCOLS_CONFIG['4-7-8'];
      if (execOrbPhaseText) execOrbPhaseText.textContent = 'Completado';
      if (playerStatus) playerStatus.textContent = `¡${cfg.title} completada con éxito!`;
      if (soundMode === 'bells') tibetanBowl.playChime('hold');
      if (soundMode === 'voice') voiceGuide.speak('Pausa de regulación completada. Gracias por cuidar de ti.');
      setTimeout(() => {
        elapsedSeconds = 0;
        if (timeElapsed) timeElapsed.textContent = '00:00';
        if (progressBar) progressBar.style.width = '0%';
        if (execOrbPhaseText) execOrbPhaseText.textContent = 'Listo';
      }, 4000);
    }
  }

  // Abrir interfaz de ejecución para un ejercicio específico
  function openProtocolExecution(protocolKey) {
    const cfg = PROTOCOLS_CONFIG[protocolKey] || PROTOCOLS_CONFIG['4-7-8'];
    currentProtocolKey = cfg.id;
    totalDurationSeconds = cfg.totalSeconds;
    elapsedSeconds = 0;

    pauseExercise();

    if (execTitle) execTitle.textContent = cfg.title;
    if (execDesc) execDesc.textContent = cfg.desc;
    if (execBadgeCategory) execBadgeCategory.textContent = cfg.category;
    if (execBadgeEffort) execBadgeEffort.textContent = cfg.effort;
    if (execOrbIcon) execOrbIcon.textContent = cfg.icon;
    if (execOrbPhaseText) execOrbPhaseText.textContent = 'Comenzar';
    if (timeElapsed) timeElapsed.textContent = '00:00';
    if (timeTotal) timeTotal.textContent = formatMmSs(cfg.totalSeconds);
    if (progressBar) progressBar.style.width = '0%';
    if (playerStatus) playerStatus.textContent = 'Pulsa reproducir para iniciar la guía';

    if (execInteractiveLeft) {
      execInteractiveLeft.innerHTML = cfg.renderLeft();
    }

    if (catalogView) catalogView.classList.add('hidden');
    if (executionView) {
      executionView.classList.remove('hidden');
      executionView.classList.add('flex');
    }

    updateSoundModeUI();

    // Desplazarse suavemente arriba
    const viewReg = document.getElementById('view-regulacion');
    if (viewReg) viewReg.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Iniciar automáticamente
    startExercise();
  }

  // Volver al Catálogo de Protocolos
  function closeProtocolExecution() {
    stopExercise(false);

    if (executionView) {
      executionView.classList.add('hidden');
      executionView.classList.remove('flex');
    }
    if (catalogView) {
      catalogView.classList.remove('hidden');
    }

    const viewReg = document.getElementById('view-regulacion');
    if (viewReg) viewReg.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Botones Volver y Finalizar
  if (backBtn) backBtn.addEventListener('click', closeProtocolExecution);
  if (finishBottomBtn) finishBottomBtn.addEventListener('click', closeProtocolExecution);

  // Controles de Reproducción
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        pauseExercise();
      } else {
        startExercise();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      elapsedSeconds = 0;
      if (timeElapsed) timeElapsed.textContent = '00:00';
      if (progressBar) progressBar.style.width = '0%';
      if (isPlaying) {
        startExercise();
      } else {
        if (execOrbPhaseText) execOrbPhaseText.textContent = 'Listo';
        if (playerStatus) playerStatus.textContent = 'Ejercicio reiniciado · Pulsa reproducir para comenzar';
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const cfg = PROTOCOLS_CONFIG[currentProtocolKey] || PROTOCOLS_CONFIG['4-7-8'];
      if (currentProtocolKey === '4-7-8') {
        const cur = (elapsedSeconds - 1) % 19;
        if (cur < 4) elapsedSeconds += (4 - cur);
        else if (cur < 11) elapsedSeconds += (11 - cur);
        else elapsedSeconds += (19 - cur);
      } else if (currentProtocolKey === 'sacudida') {
        if (elapsedSeconds < 120) elapsedSeconds = 120;
        else if (elapsedSeconds < 240) elapsedSeconds = 240;
        else elapsedSeconds = 359;
      } else if (currentProtocolKey === 'ritual') {
        if (elapsedSeconds < 150) elapsedSeconds = 150;
        else if (elapsedSeconds < 330) elapsedSeconds = 330;
        else elapsedSeconds = 479;
      } else if (currentProtocolKey === 'coherencia') {
        const cur = (elapsedSeconds - 1) % 10;
        if (cur < 5) elapsedSeconds += (5 - cur);
        else elapsedSeconds += (10 - cur);
      } else if (currentProtocolKey === 'grounding') {
        elapsedSeconds = Math.min(299, Math.floor(elapsedSeconds / 60 + 1) * 60);
      }

      if (isPlaying) {
        voiceGuide.stop();
        tick();
      }
    });
  }

  // Conexión de todos los botones "Comenzar" (.exercise-launch-btn)
  const launchBtns = document.querySelectorAll('.exercise-launch-btn');
  launchBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exKey = btn.getAttribute('data-exercise') || '4-7-8';
      openProtocolExecution(exKey);
    });
  });

  // Conexión del filtro superior
  const filterBtns = document.querySelectorAll('#regulation-filters-nav .filter-btn');
  const cards = document.querySelectorAll('#protocols-grid .exercise-card');
  const counterText = document.getElementById('catalog-counter-text');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-category') || 'todos';

      // Estilo activo para el botón pulsado
      filterBtns.forEach((b) => {
        b.classList.remove('active-filter', 'bg-primary', 'text-on-primary', 'shadow-sm');
        b.classList.add('bg-surface-container', 'hover:bg-surface-container-high', 'text-on-surface-variant');
      });
      btn.classList.add('active-filter', 'bg-primary', 'text-on-primary', 'shadow-sm');
      btn.classList.remove('bg-surface-container', 'hover:bg-surface-container-high', 'text-on-surface-variant');

      // Filtrar tarjetas
      let visibleCount = 0;
      cards.forEach((card) => {
        const categories = (card.getAttribute('data-categories') || '').split(' ');
        if (selectedCategory === 'todos' || categories.includes(selectedCategory)) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      if (counterText) {
        counterText.textContent = `Mostrando ${visibleCount} de ${cards.length} ejercicios`;
      }
    });
  });

  // Registro de hidratación al pie
  const hydrateBtn = document.getElementById('hydrateLogBtn');
  if (hydrateBtn) {
    hydrateBtn.addEventListener('click', () => {
      hydrateBtn.classList.add('bg-secondary', 'text-on-secondary');
      hydrateBtn.innerHTML = '<span class="material-symbols-outlined text-base">check</span><span>¡Pausa registrada!</span>';
      setTimeout(() => {
        hydrateBtn.classList.remove('bg-secondary', 'text-on-secondary');
        hydrateBtn.innerHTML = '<span class="material-symbols-outlined text-base text-secondary">water_drop</span><span>Tomé agua</span>';
      }, 2500);
    });
  }

  updateSoundModeUI();
}

/* ==========================================================================
   5. DASHBOARD Y CHECK-IN EMOCIONAL
   ========================================================================== */
function initDashboard() {
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

  const emotionChips = document.querySelectorAll('#emotions-cloud .emotion-chip');
  const selectedEmotions = new Set(['Calma']);

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
   6. ENTRENAMIENTO EN LÍMITES PROFESIONALES
   ========================================================================== */
window.selectOption = function(option) {
  const cards = document.querySelectorAll('.option-card');
  cards.forEach((c) => {
    c.classList.remove('bg-primary-fixed', 'text-on-primary-fixed', 'ring-2', 'ring-primary');
    c.classList.add('bg-surface-container-low');
  });

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
  const optionCards = document.querySelectorAll('#decision-options .option-card');
  optionCards.forEach((card, idx) => {
    const letters = ['A', 'B', 'C'];
    card.addEventListener('click', (e) => {
      window.selectOption(letters[idx]);
    });
  });
}

/* ==========================================================================
   7. DIARIO PRIVADO DE REFLEXIÓN
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
   8. CENTRO DE AYUDA EN CRISIS
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
          if (breathText) breathText.textContent = 'Inhala';
          if (breathSub) breathSub.textContent = 'Inhala lentamente por tu nariz sintiendo tu abdomen expandirse... (4s)';
          if (circlePulse) {
            circlePulse.style.transform = 'scale(1.4)';
            circlePulse.className = 'w-24 h-24 rounded-full bg-primary/40 flex items-center justify-center transition-all duration-1000';
          }
          phase = 1;
          timerId = setTimeout(step, 4000);
        } else if (phase === 1) {
          if (breathText) breathText.textContent = 'Sostén';
          if (breathSub) breathSub.textContent = 'Mantén el aire con calma, sin tensión en tus hombros... (4s)';
          if (circlePulse) {
            circlePulse.style.transform = 'scale(1.4)';
            circlePulse.className = 'w-24 h-24 rounded-full bg-tertiary-fixed flex items-center justify-center transition-all duration-1000';
          }
          phase = 2;
          timerId = setTimeout(step, 4000);
        } else {
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
   9. FECHAS Y HORARIOS DINÁMICOS
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
