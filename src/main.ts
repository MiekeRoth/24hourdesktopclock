import { getCurrentWindow } from '@tauri-apps/api/window';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { translations } from './translations';
import { LogicalSize } from '@tauri-apps/api/dpi';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';

// --- TAAL EN VERTALINGEN ---
type Language = 'nl' | 'en';
let currentLang: Language = (localStorage.getItem('klok24_lang') as Language) || 'nl';

function t(key: keyof typeof translations['nl'], params?: Record<string, string>): string {
  let text = translations[currentLang][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n') as keyof typeof translations['nl'];
    if (key && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder') as keyof typeof translations['nl'];
    if (key && translations[currentLang][key]) {
      (el as HTMLInputElement).placeholder = translations[currentLang][key];
    }
  });
  // Vertaal ook de titel van de app indien nodig (alleen de html tag)
  document.documentElement.lang = currentLang;
}

// Taal selectie afhandelen
const langSelect = document.getElementById('language-select') as HTMLSelectElement;
langSelect.value = currentLang;
langSelect.addEventListener('change', (e) => {
  currentLang = (e.target as HTMLSelectElement).value as Language;
  localStorage.setItem('klok24_lang', currentLang);
  applyTranslations();
  renderMoments(); // Her-render tooltips indien nodig
});

// --- WAARSCHUWINGSTIJD ---
let warningMinutes = parseInt(localStorage.getItem('klok24_warning_time') || '15', 10);
const warningInput = document.getElementById('warning-time-input') as HTMLInputElement;
warningInput.value = warningMinutes.toString();

warningInput.addEventListener('change', (e) => {
  let val = parseInt((e.target as HTMLInputElement).value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 120) val = 120;
  warningMinutes = val;
  warningInput.value = val.toString();
  localStorage.setItem('klok24_warning_time', val.toString());
  updateClock(); // Forceer een update om de afteller direct aan te passen
});

// --- AUTOMATISCH OPSTARTEN ---
const autostartCheckbox = document.getElementById('autostart-checkbox') as HTMLInputElement;

async function initAutostart() {
  try {
    autostartCheckbox.checked = await isEnabled();
  } catch (err) {
    console.error('Autostart status ophalen mislukt:', err);
  }
}

autostartCheckbox?.addEventListener('change', async () => {
  try {
    if (autostartCheckbox.checked) {
      await enable();
    } else {
      await disable();
    }
  } catch (err) {
    console.error('Autostart aanpassen mislukt:', err);
    autostartCheckbox.checked = !autostartCheckbox.checked;
  }
});

initAutostart();


applyTranslations();

// --- UI ACTIES (SLEPEN, SLUITEN, INSTELLINGEN) ---
const closeBtn = document.getElementById('close-btn');
closeBtn?.addEventListener('click', () => getCurrentWindow().close());

// --- Minimaliseer knop ---
const minimizeBtn = document.getElementById('minimize-btn');
minimizeBtn?.addEventListener('click', () => getCurrentWindow().minimize());

const dragBar = document.querySelector('.drag-bar');
dragBar?.addEventListener('mousedown', (e) => {
  const mouseEvent = e as MouseEvent;
  const target = e.target as HTMLElement;
  if (mouseEvent.button === 0 && !target.closest('.icon-btn')) {
    getCurrentWindow().startDragging();
  }
});

document.getElementById('settings-btn')?.addEventListener('click', () => {
  document.getElementById('settings-panel')?.classList.toggle('hidden');
});

let isRoundView = true;
document.getElementById('toggle-view')?.addEventListener('click', () => {
  isRoundView = !isRoundView;
  document.getElementById('round-view')?.classList.toggle('active', isRoundView);
  document.getElementById('bar-view')?.classList.toggle('active', !isRoundView);
});

// --- TOOLTIP & BEVESTIGINGSVENSTER ---
const tooltipEl = document.getElementById('marker-tooltip');
const confirmModal = document.getElementById('confirm-modal');
const confirmText = document.getElementById('confirm-text');
let pendingDeleteId: number | null = null;

function showTooltip(e: MouseEvent, text: string) {
  if (!tooltipEl) return;
  tooltipEl.textContent = text;
  tooltipEl.classList.remove('hidden');

  const padding = 8;
  const rect = tooltipEl.getBoundingClientRect();
  let left = e.clientX + 10;
  let top = e.clientY - rect.height - 8;

  if (left + rect.width > window.innerWidth - padding) {
    left = window.innerWidth - rect.width - padding;
  }
  if (left < padding) left = padding;
  if (top < padding) top = e.clientY + 14;

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

function hideTooltip() { tooltipEl?.classList.add('hidden'); }

function askRemoveMoment(moment: Moment) {
  hideTooltip();
  pendingDeleteId = moment.id;
  if (confirmText) {
    confirmText.textContent = t('confirmDelete', { time: moment.time, label: moment.label });
  }
  confirmModal?.classList.remove('hidden');
}

function closeConfirmModal() {
  pendingDeleteId = null;
  confirmModal?.classList.add('hidden');
}

document.getElementById('confirm-yes')?.addEventListener('click', () => {
  if (pendingDeleteId !== null) {
    moments = moments.filter((m) => m.id !== pendingDeleteId);
    saveAndRender();
  }
  closeConfirmModal();
});

document.getElementById('confirm-no')?.addEventListener('click', closeConfirmModal);
confirmModal?.addEventListener('click', (e) => { if (e.target === confirmModal) closeConfirmModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !confirmModal?.classList.contains('hidden')) closeConfirmModal(); });

// --- EIGEN MOMENTEN LOGICA ---
interface Moment { id: number; time: string; label: string; }
let moments: Moment[] = JSON.parse(localStorage.getItem('klok24_moments') || '[]');

function saveAndRender() {
  localStorage.setItem('klok24_moments', JSON.stringify(moments));
  renderMoments();
}

function renderMoments() {
  const roundContainer = document.getElementById('round-markers');
  const barContainer = document.getElementById('bar-markers');
  if (!roundContainer || !barContainer) return;

  roundContainer.innerHTML = '';
  barContainer.innerHTML = '';

  moments.forEach((m) => {
    const [hours, minutes] = m.time.split(':').map(Number);
    const dayPercentage = (hours * 3600 + minutes * 60) / (24 * 60 * 60);
    const hoverLabel = `${m.time} • ${m.label}`;

    // Ronde klok
    const degrees = dayPercentage * 360;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'round-marker-group');
    group.setAttribute('transform', `rotate(${degrees}, 100, 100)`);

    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitArea.setAttribute('x1', '100'); hitArea.setAttribute('y1', '6');
    hitArea.setAttribute('x2', '100'); hitArea.setAttribute('y2', '28');
    hitArea.setAttribute('stroke', 'transparent'); hitArea.setAttribute('stroke-width', '14');

    const visibleLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    visibleLine.setAttribute('class', 'round-marker-visible');
    visibleLine.setAttribute('x1', '100'); visibleLine.setAttribute('y1', '10');
    visibleLine.setAttribute('x2', '100'); visibleLine.setAttribute('y2', '24');
    visibleLine.setAttribute('stroke', '#4caf50'); visibleLine.setAttribute('stroke-width', '4');

    group.appendChild(hitArea); group.appendChild(visibleLine);
    group.addEventListener('mouseenter', (e) => showTooltip(e as MouseEvent, hoverLabel));
    group.addEventListener('mousemove', (e) => showTooltip(e as MouseEvent, hoverLabel));
    group.addEventListener('mouseleave', hideTooltip);
    group.addEventListener('click', () => askRemoveMoment(m));
    roundContainer.appendChild(group);

    // Tijdbalk
    const div = document.createElement('div');
    div.className = 'bar-marker';
    div.style.left = `${dayPercentage * 100}%`;
    div.addEventListener('mouseenter', (e) => showTooltip(e, hoverLabel));
    div.addEventListener('mousemove', (e) => showTooltip(e, hoverLabel));
    div.addEventListener('mouseleave', hideTooltip);
    div.addEventListener('click', () => askRemoveMoment(m));
    barContainer.appendChild(div);
  });
}

document.getElementById('add-moment-btn')?.addEventListener('click', () => {
  const timeInput = document.getElementById('moment-time') as HTMLInputElement;
  const labelInput = document.getElementById('moment-label') as HTMLInputElement;

  if (timeInput.value) {
    moments.push({
      id: Date.now(),
      time: timeInput.value,
      label: labelInput.value.trim() || t('defaultMoment'),
    });
    timeInput.value = '';
    labelInput.value = '';
    saveAndRender();
  }
});

// --- SIGNAAL, NOTIFICATIE & AFTEL LOGICA ---
let lastSignaledMinute = -1;

function playChime() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 2.5);
}

async function checkAlarmsAndCountdown(hours: number, minutes: number) {
  const currentMinuteTotal = hours * 60 + minutes;
  
  // 1. Controleer of er NU een moment is
  if (currentMinuteTotal !== lastSignaledMinute) {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const triggeredMoments = moments.filter(m => m.time === timeString);
    
    if (triggeredMoments.length > 0) {
      lastSignaledMinute = currentMinuteTotal;
      playChime();
      
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      
      if (permissionGranted) {
        triggeredMoments.forEach(m => {
          sendNotification({ title: '24-uurs Klok', body: `${t('timeFor')} ${m.label}` });
        });
      }
    }
  }

 // 2. Aftellen voor komende momenten
      let upcomingMoment: Moment | null = null;
      let minDiff = warningMinutes + 1; // dynamische grenswaarde

      moments.forEach(m => {
        const [mHours, mMinutes] = m.time.split(':').map(Number);
        const momentTotal = mHours * 60 + mMinutes;
        
        let diff = momentTotal - currentMinuteTotal;
        // Als het moment na middernacht is en we zitten voor middernacht
        if (diff < 0) diff += 24 * 60;

        if (diff >= 0 && diff <= warningMinutes) {
          // Vind het moment dat het snelst aankomt
          if (diff < minDiff) {
            minDiff = diff;
            upcomingMoment = m;
          }
        }
      });

  const countdownDisplay = document.getElementById('countdown-display');
  if (countdownDisplay) {
    if (upcomingMoment) {
      if (minDiff === 0) {
        countdownDisplay.textContent = t('countdownNow', { label: (upcomingMoment as Moment).label });
      } else {
        countdownDisplay.textContent = t('countdown', { minutes: minDiff.toString(), label: (upcomingMoment as Moment).label });
      }
    } else {
      countdownDisplay.textContent = ''; // Geen komende momenten binnen een kwartier
    }
  }
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const dtRound = document.getElementById('digital-time-round');
  const dtBar = document.getElementById('digital-time-bar');
  if (dtRound) dtRound.textContent = timeString;
  if (dtBar) dtBar.textContent = timeString;

  const dayPercentage = (hours * 3600 + minutes * 60 + seconds) / (24 * 60 * 60);
  const roundHand = document.getElementById('round-hand');
  if (roundHand) roundHand.setAttribute('transform', `rotate(${dayPercentage * 360}, 100, 100)`);
  const barIndicator = document.getElementById('bar-indicator');
  if (barIndicator) barIndicator.style.left = `${dayPercentage * 100}%`;

  checkAlarmsAndCountdown(hours, minutes);
}

renderMoments();
updateClock();
setInterval(updateClock, 1000);

// --- DYNAMISCHE VENSTERHOOGTE ---
const windowWidth = window.innerWidth;
let lastHeight = 0;

async function syncWindowHeight() {
  const newHeight = Math.ceil(document.body.getBoundingClientRect().height);
  if (newHeight > 0 && newHeight !== lastHeight) {
    lastHeight = newHeight;
    await getCurrentWindow().setSize(new LogicalSize(windowWidth, newHeight));
  }
}

const resizeObserver = new ResizeObserver(() => {
  syncWindowHeight();
});
resizeObserver.observe(document.body);