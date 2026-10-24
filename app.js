/**
 * BMW Velocity Odyssey - Main Application Orchestrator
 * Seamlessly pairs continuous highway canvas animation, procedural acoustics,
 * real-time cockpit telemetry, auto-drive cruise control, and interactive car inspection.
 */

import { BMW_MODELS, SPEED_ZONES } from './data.js';
import { HighwayEngine } from './highway.js';
import { audioEngine } from './audio.js';
import { generateCarSVG } from './car-graphics.js';

class VelocityOdysseyApp {
  constructor() {
    this.models = BMW_MODELS;
    this.zones = SPEED_ZONES;
    this.unit = 'kmh'; // 'kmh' or 'mph'
    this.activeCategory = 'all';

    // Telemetry State
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.currentRPM = 950;
    this.currentGear = 1;
    this.totalDistanceMeters = 0;
    this.activeZone = this.zones[0];
    this.activeModalModel = null;
    this.activeModalColor = null;

    // Scroll & Velocity Tracking
    this.lastScrollY = window.scrollY;
    this.lastScrollTime = performance.now();
    this.scrollVelocity = 0;

    // Auto-Drive Cruise State
    this.cruiseMode = 'off'; // 'off', 'cruise', 'sport', 'autobahn'
    this.cruiseSpeeds = {
      cruise: 2.2,    // ~60 km/h
      sport: 5.8,     // ~180 km/h
      autobahn: 11.5  // ~320 km/h
    };

    // DOM Elements
    this.canvas = document.getElementById('highwayCanvas');
    this.highwayEngine = new HighwayEngine(this.canvas);
    this.trackContainer = document.getElementById('highwayTrack');
    this.elevatorStops = document.getElementById('elevatorStops');
    this.elevatorFill = document.getElementById('elevatorFill');
    this.elevatorCarIndicator = document.getElementById('elevatorCarIndicator');
    this.elevatorSpeedTooltip = document.getElementById('elevatorSpeedTooltip');

    // HUD Elements
    this.hudSpeedDisplay = document.getElementById('hudSpeedDisplay');
    this.unitLabel = document.getElementById('unitLabel');
    this.unitToggleBtn = document.getElementById('unitToggleBtn');
    this.hudOdometerDisplay = document.getElementById('hudOdometerDisplay');
    this.hudGearDisplay = document.getElementById('hudGearDisplay');
    this.hudRpmDisplay = document.getElementById('hudRpmDisplay');
    this.shiftLeds = document.querySelectorAll('#shiftLights .led');
    this.currentZoneBadge = document.getElementById('currentZoneBadge');
    this.zoneTitleText = document.getElementById('zoneTitleText');
    this.zoneEraText = document.getElementById('zoneEraText');
    this.audioToggleBtn = document.getElementById('audioToggleBtn');
    this.audioStatusText = document.getElementById('audioStatusText');
    this.hudRevBtn = document.getElementById('hudRevBtn');
    this.categoryFilter = document.getElementById('categoryFilter');

    // Modal Elements
    this.modal = document.getElementById('inspectionModal');
    this.modalBackdrop = document.getElementById('modalBackdrop');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
    this.modalCategoryTag = document.getElementById('modalCategoryTag');
    this.modalCarName = document.getElementById('modalCarName');
    this.modalTagline = document.getElementById('modalTagline');
    this.modalSpeedNum = document.getElementById('modalSpeedNum');
    this.modalSpeedUnit = document.getElementById('modalSpeedUnit');
    this.modalVectorStage = document.getElementById('modalVectorStage');
    this.modalColorChips = document.getElementById('modalColorChips');
    this.specHp = document.getElementById('specHp');
    this.specTorque = document.getElementById('specTorque');
    this.specAccel = document.getElementById('specAccel');
    this.specWeight = document.getElementById('specWeight');
    this.specEngine = document.getElementById('specEngine');
    this.modalDescription = document.getElementById('modalDescription');
    this.modalTrivia = document.getElementById('modalTrivia');
    this.modalRevEngineBtn = document.getElementById('modalRevEngineBtn');
    this.modalRevCarName = document.getElementById('modalRevCarName');
    this.modalPrevBtn = document.getElementById('modalPrevBtn');
    this.modalNextBtn = document.getElementById('modalNextBtn');
    this.modalRealImg = document.getElementById('modalRealImg');
    this.modalPhotoYear = document.getElementById('modalPhotoYear');

    // Cruise Buttons
    this.cruiseStatusDot = document.getElementById('cruiseStatusDot');
    this.cruiseButtons = document.querySelectorAll('.cruise-btn');

    this.init();
  }

  init() {
    this.renderHighwayStations();
    this.renderElevatorStops();
    this.bindEvents();
    this.startMainAnimationLoop();
  }

  /* -------------------------------------------------------------------------
     RENDERING: HIGHWAY TRACK & VEHICLE STATIONS
     ------------------------------------------------------------------------- */
  renderHighwayStations() {
    this.trackContainer.innerHTML = '';
    
    // Sort models ascending by top speed (like deep sea depth)
    const sortedModels = [...this.models].sort((a, b) => a.topSpeedKm - b.topSpeedKm);

    let lastMilestone = -1;

    sortedModels.forEach((model, index) => {
      // Add speed milestone markers (every 50-100 km/h)
      const milestone = Math.floor(model.topSpeedKm / 50) * 50;
      if (milestone > lastMilestone && milestone > 0) {
        lastMilestone = milestone;
        const milestoneEl = document.createElement('div');
        milestoneEl.className = 'speed-milestone-marker';
        const displayMilestone = this.unit === 'kmh' ? milestone : Math.round(milestone * 0.621371);
        const unitText = this.unit === 'kmh' ? 'KM/H APEX' : 'MPH APEX';
        milestoneEl.innerHTML = `
          <div class="milestone-ribbon">
            <span class="milestone-num">${displayMilestone}</span>
            <span class="milestone-unit">${unitText}</span>
          </div>
          <div class="milestone-line"></div>
        `;
        this.trackContainer.appendChild(milestoneEl);
      }

      // Vehicle station card
      const station = document.createElement('article');
      station.className = `vehicle-station ${index % 2 === 1 ? 'alt-layout' : ''}`;
      station.id = `vehicle-${model.id}`;
      station.setAttribute('data-id', model.id);
      station.setAttribute('data-category', model.category);
      station.setAttribute('data-speed-km', model.topSpeedKm);

      const displaySpeed = this.unit === 'kmh' ? model.topSpeedKm : model.topSpeedMph;
      const unitText = this.unit === 'kmh' ? 'KM/H' : 'MPH';

      const isCutout = model.image.endsWith('.png');
      station.innerHTML = `
        <div class="station-visual">
          <!-- 3D Curved Floating Stage -->
          <div class="car-floating-stage" style="--zone-color: ${this.getZoneColorForSpeed(model.topSpeedKm)}">
            <div class="floating-aura"></div>
            <div class="floating-car-wrapper" data-tilt-wrapper>
              <div class="car-3d-card ${isCutout ? 'is-cutout' : 'is-photo'}">
                <img src="${model.image}" alt="${model.name}" class="floating-car-img" loading="lazy" />
                <div class="car-3d-glare"></div>
                <div class="car-3d-reflection"></div>
              </div>
            </div>
            <!-- Dynamic Floating Ground Shadow in 3D -->
            <div class="floating-road-shadow"></div>
          </div>
        </div>
        <div class="station-info">
          <div class="station-meta-top">
            <span class="vehicle-year-badge">${model.year} • ${model.category.toUpperCase()}</span>
            <div class="vehicle-speed-badge">
              <span>${displaySpeed}</span>
              <span class="unit">${unitText}</span>
            </div>
          </div>
          <h2 class="vehicle-name">${model.name}</h2>
          <div class="vehicle-tagline">${model.tagline}</div>
          <p class="vehicle-desc">${model.description}</p>
          
          <div class="telemetry-pills">
            <div class="pill-item">
              <span class="pill-label">OUTPUT</span>
              <span class="pill-val">${model.powerHp} HP</span>
            </div>
            <div class="pill-item">
              <span class="pill-label">TORQUE</span>
              <span class="pill-val">${model.torqueNm} Nm</span>
            </div>
            <div class="pill-item">
              <span class="pill-label">0-100 ACCEL</span>
              <span class="pill-val">${model.acceleration}s</span>
            </div>
            <div class="pill-item">
              <span class="pill-label">ENGINE</span>
              <span class="pill-val">${model.engine.split(' ')[0]} ${model.engine.split(' ')[1] || ''}</span>
            </div>
          </div>

          <div class="station-actions">
            <button class="inspect-btn" data-action="inspect" data-id="${model.id}">
              <span>INSPECT BLUEPRINT & SPECS</span>
              <span>⚡</span>
            </button>
            <button class="rev-single-btn" data-action="rev" data-id="${model.id}">
              <span>REV</span>
              <span>▲</span>
            </button>
          </div>
        </div>
      `;

      this.trackContainer.appendChild(station);
    });
  }

  /* -------------------------------------------------------------------------
     RENDERING: DEEP SEA STYLE RIGHT-SIDE ELEVATOR
     ------------------------------------------------------------------------- */
  renderElevatorStops() {
    this.elevatorStops.innerHTML = '';
    const sorted = [...this.models].sort((a, b) => a.topSpeedKm - b.topSpeedKm);
    const maxSpeed = 380;

    sorted.forEach(model => {
      const percent = (model.topSpeedKm / maxSpeed) * 100;
      const node = document.createElement('div');
      node.className = 'elevator-node';
      node.style.top = `${percent}%`;
      node.setAttribute('data-id', model.id);
      node.innerHTML = `
        <div class="node-tooltip">
          <strong>${model.name}</strong> • ${this.unit === 'kmh' ? model.topSpeedKm + ' km/h' : model.topSpeedMph + ' mph'}
        </div>
      `;
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.scrollToVehicle(model.id);
      });
      this.elevatorStops.appendChild(node);
    });
  }

  /* -------------------------------------------------------------------------
     EVENT LISTENERS & USER CONTROLS
     ------------------------------------------------------------------------- */
  bindEvents() {
    // Window Scroll Tracker
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

    // Unit Switcher (KM/H <-> MPH)
    this.unitToggleBtn.addEventListener('click', () => this.toggleUnits());

    // Audio Engine Toggle
    this.audioToggleBtn.addEventListener('click', () => {
      const active = audioEngine.toggleMute();
      this.updateAudioButtonState(active);
    });

    // Rev Engine Button in HUD
    this.hudRevBtn.addEventListener('click', () => {
      audioEngine.revEngine();
      this.flashShiftLights();
    });

    // Start Journey Buttons
    document.getElementById('startJourneyBtn')?.addEventListener('click', () => {
      const firstVehicle = document.querySelector('.vehicle-station');
      if (firstVehicle) {
        firstVehicle.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.getElementById('heroAutoCruiseBtn')?.addEventListener('click', () => {
      this.setCruiseMode('sport');
    });

    document.getElementById('rewindToStartBtn')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.setCruiseMode('off');
    });

    // Cruise Control Buttons in Dock
    this.cruiseButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setCruiseMode(mode);
      });
    });

    // 3D Interactive Mouse Parallax Tracking
    this.trackContainer.addEventListener('mousemove', (e) => {
      const visual = e.target.closest('.station-visual');
      if (!visual) return;
      const card = visual.querySelector('[data-tilt-wrapper]');
      if (!card) return;
      const rect = visual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const isAlt = visual.closest('.vehicle-station')?.classList.contains('alt-layout');
      const baseRotY = isAlt ? 8 : -8;
      const rotY = baseRotY + x * 22;
      const rotX = -y * 18;
      card.style.transform = `perspective(1200px) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) translateZ(35px) scale(1.025)`;
      card.style.animationPlayState = 'paused';
    });

    this.trackContainer.addEventListener('mouseleave', (e) => {
      const visual = e.target.closest('.station-visual');
      if (!visual) return;
      const card = visual.querySelector('[data-tilt-wrapper]');
      if (card) {
        card.style.transform = '';
        card.style.animationPlayState = 'running';
      }
    }, true);

    // Vehicle Station Action Clicks (Delegation)
    this.trackContainer.addEventListener('click', (e) => {
      const inspectBtn = e.target.closest('[data-action="inspect"]');
      const revBtn = e.target.closest('[data-action="rev"]');
      const station = e.target.closest('.vehicle-station');

      if (revBtn) {
        e.stopPropagation();
        const id = revBtn.getAttribute('data-id');
        const model = this.models.find(m => m.id === id);
        audioEngine.revEngine(model);
        this.flashShiftLights();
      } else if (inspectBtn || station) {
        const id = inspectBtn ? inspectBtn.getAttribute('data-id') : station.getAttribute('data-id');
        const model = this.models.find(m => m.id === id);
        if (model) this.openInspectionModal(model);
      }
    });

    // Category Filter
    this.categoryFilter.addEventListener('change', (e) => {
      this.activeCategory = e.target.value;
      this.filterStationsByCategory(this.activeCategory);
    });

    // Modal Close
    this.modalCloseBtn.addEventListener('click', () => this.closeInspectionModal());
    this.modalBackdrop.addEventListener('click', () => this.closeInspectionModal());

    // Modal Rev Button
    this.modalRevEngineBtn.addEventListener('click', () => {
      if (this.activeModalModel) {
        audioEngine.revEngine(this.activeModalModel);
        this.flashShiftLights();
      }
    });

    // Modal Prev / Next Navigation
    this.modalPrevBtn.addEventListener('click', () => this.navigateModal(-1));
    this.modalNextBtn.addEventListener('click', () => this.navigateModal(1));

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        audioEngine.revEngine(this.activeModalModel);
        this.flashShiftLights();
      } else if (e.key === 'c' || e.key === 'C') {
        const modes = ['off', 'cruise', 'sport', 'autobahn'];
        const nextIdx = (modes.indexOf(this.cruiseMode) + 1) % modes.length;
        this.setCruiseMode(modes[nextIdx]);
      } else if (e.key === 'm' || e.key === 'M') {
        const active = audioEngine.toggleMute();
        this.updateAudioButtonState(active);
      } else if (e.key === 'Escape') {
        this.closeInspectionModal();
      }
    });
  }

  /* -------------------------------------------------------------------------
     SCROLL & TELEMETRY HANDLING
     ------------------------------------------------------------------------- */
  handleScroll() {
    const now = performance.now();
    const currentY = window.scrollY;
    const dt = Math.max(1, now - this.lastScrollTime);
    const dy = currentY - this.lastScrollY;

    // Instantaneous scroll speed
    this.scrollVelocity = Math.abs(dy) / dt * 10;
    this.highwayEngine.setScrollVelocity(this.scrollVelocity);

    this.lastScrollY = currentY;
    this.lastScrollTime = now;

    // Trigger exhaust pop on rapid deceleration
    if (this.scrollVelocity > 15 && dy < 0) {
      audioEngine.triggerExhaustPop();
    }
  }

  setCruiseMode(mode) {
    this.cruiseMode = mode;

    this.cruiseButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    if (mode === 'off') {
      this.cruiseStatusDot.classList.remove('active');
    } else {
      this.cruiseStatusDot.classList.add('active');
      // If audio is muted, encourage unmuting for the cruise sound
      if (audioEngine.isMuted) {
        const active = audioEngine.toggleMute();
        this.updateAudioButtonState(active);
      }
    }
  }

  toggleUnits() {
    this.unit = this.unit === 'kmh' ? 'mph' : 'kmh';
    this.unitLabel.textContent = this.unit.toUpperCase();
    this.renderHighwayStations();
    this.renderElevatorStops();
    if (this.activeModalModel) {
      this.updateModalTelemetry(this.activeModalModel);
    }
  }

  updateAudioButtonState(isActive) {
    this.audioToggleBtn.classList.toggle('active', isActive);
    this.audioStatusText.textContent = isActive ? 'M SOUND: ON' : 'M SOUND: OFF';
  }

  flashShiftLights() {
    this.shiftLeds.forEach((led, idx) => {
      setTimeout(() => {
        led.classList.add('active');
        setTimeout(() => led.classList.remove('active'), 500);
      }, idx * 50);
    });
  }

  scrollToVehicle(id) {
    const el = document.getElementById(`vehicle-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  filterStationsByCategory(category) {
    const stations = document.querySelectorAll('.vehicle-station');
    stations.forEach(station => {
      const match = category === 'all' || station.getAttribute('data-category') === category;
      station.style.display = match ? 'grid' : 'none';
    });
  }

  /* -------------------------------------------------------------------------
     INSPECTION MODAL
     ------------------------------------------------------------------------- */
  openInspectionModal(model) {
    this.activeModalModel = model;
    this.activeModalColor = model.colors[0]?.hex || '#0066B1';

    this.modalCategoryTag.textContent = model.category.toUpperCase();
    this.modalCarName.textContent = model.name;
    this.modalTagline.textContent = model.tagline;
    this.modalRevCarName.textContent = model.name;

    this.modalDescription.textContent = model.description;
    this.modalTrivia.textContent = model.trivia;

    if (this.modalRealImg) {
      this.modalRealImg.src = model.image;
      this.modalRealImg.alt = model.name;
    }
    if (this.modalPhotoYear) {
      this.modalPhotoYear.textContent = `${model.year} • ${model.category.toUpperCase()}`;
    }

    this.updateModalTelemetry(model);
    this.renderModalColorChips(model);
    this.updateModalVectorStage();

    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  getZoneColorForSpeed(speedKmH) {
    const zone = this.zones.find(z => speedKmH >= z.speedRange[0] && speedKmH <= z.speedRange[1]);
    return zone ? zone.accentColor : '#0066B1';
  }

  closeInspectionModal() {
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  updateModalTelemetry(model) {
    const speed = this.unit === 'kmh' ? model.topSpeedKm : model.topSpeedMph;
    const unitText = this.unit === 'kmh' ? 'KM/H TOP SPEED' : 'MPH TOP SPEED';
    this.modalSpeedNum.textContent = speed;
    this.modalSpeedUnit.textContent = unitText;

    this.specHp.textContent = `${model.powerHp} HP`;
    this.specTorque.textContent = `${model.torqueNm} Nm`;
    this.specAccel.textContent = `${model.acceleration} sec`;
    this.specWeight.textContent = `${model.weightKg} kg`;
    this.specEngine.textContent = model.engine;
  }

  renderModalColorChips(model) {
    this.modalColorChips.innerHTML = '';
    model.colors.forEach((col, idx) => {
      const chip = document.createElement('button');
      chip.className = `color-chip ${idx === 0 ? 'active' : ''}`;
      chip.style.backgroundColor = col.hex;
      chip.title = col.name;
      chip.addEventListener('click', () => {
        this.modalColorChips.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeModalColor = col.hex;
        this.updateModalVectorStage();
      });
      this.modalColorChips.appendChild(chip);
    });
  }

  updateModalVectorStage() {
    if (!this.activeModalModel) return;
    this.modalVectorStage.innerHTML = generateCarSVG(this.activeModalModel, this.activeModalColor);
  }

  navigateModal(direction) {
    if (!this.activeModalModel) return;
    const currentIndex = this.models.findIndex(m => m.id === this.activeModalModel.id);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = this.models.length - 1;
    if (nextIndex >= this.models.length) nextIndex = 0;
    this.openInspectionModal(this.models[nextIndex]);
  }

  /* -------------------------------------------------------------------------
     CONTINUOUS MAIN ANIMATION LOOP (60 - 120 FPS)
     ------------------------------------------------------------------------- */
  startMainAnimationLoop() {
    const loop = () => {
      this.updateAutoDrive();
      this.updateTelemetryAndHUD();
      this.highwayEngine.update(this.currentSpeed);
      this.highwayEngine.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateAutoDrive() {
    if (this.cruiseMode !== 'off') {
      const scrollStep = this.cruiseSpeeds[this.cruiseMode] || 3;
      window.scrollBy({ top: scrollStep, left: 0, behavior: 'auto' });
    }
  }

  updateTelemetryAndHUD() {
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const scrollY = window.scrollY;
    const progress = Math.min(1, Math.max(0, scrollY / (scrollMax || 1)));

    // Calculate Speed mapped along the highway (from 0 to 360 km/h)
    const baseTargetSpeed = Math.round(progress * 360);
    // Add dynamic scroll boost when user scrolls actively
    const dynamicBoost = this.scrollVelocity * 4;
    this.targetSpeed = Math.min(420, baseTargetSpeed + dynamicBoost);

    // Smooth speed gauge needle dampening
    this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.14;

    // Display Speed
    const displaySpeed = this.unit === 'kmh' 
      ? Math.round(this.currentSpeed) 
      : Math.round(this.currentSpeed * 0.621371);
    this.hudSpeedDisplay.textContent = displaySpeed;

    // Odometer
    this.totalDistanceMeters += (this.currentSpeed / 3.6) * (1 / 60);
    const distKm = (this.totalDistanceMeters / 1000).toFixed(1);
    this.hudOdometerDisplay.textContent = `${distKm} KM`;

    // Dynamic Gear & RPM
    let gear = '1';
    let gearRatio = 0;
    if (this.currentSpeed < 45) { gear = '1'; gearRatio = this.currentSpeed / 45; }
    else if (this.currentSpeed < 90) { gear = '2'; gearRatio = (this.currentSpeed - 45) / 45; }
    else if (this.currentSpeed < 145) { gear = '3'; gearRatio = (this.currentSpeed - 90) / 55; }
    else if (this.currentSpeed < 205) { gear = '4'; gearRatio = (this.currentSpeed - 145) / 60; }
    else if (this.currentSpeed < 265) { gear = '5'; gearRatio = (this.currentSpeed - 205) / 60; }
    else if (this.currentSpeed < 325) { gear = '6'; gearRatio = (this.currentSpeed - 265) / 60; }
    else { gear = '7'; gearRatio = Math.min(1, (this.currentSpeed - 325) / 75); }

    this.hudGearDisplay.textContent = gear;

    const targetRPM = Math.round(1100 + gearRatio * 5900 + (this.scrollVelocity > 5 ? 1200 : 0));
    this.currentRPM += (targetRPM - this.currentRPM) * 0.15;
    this.hudRpmDisplay.textContent = `${Math.round(this.currentRPM)} RPM`;

    // Shift Light LEDs
    const rpmNorm = (this.currentRPM - 1100) / 6500;
    this.shiftLeds.forEach((led, idx) => {
      const threshold = (idx + 1) / this.shiftLeds.length;
      led.classList.toggle('active', rpmNorm >= threshold);
    });

    // Update Zone
    const currentZone = this.zones.find(z => this.currentSpeed >= z.speedRange[0] && this.currentSpeed <= z.speedRange[1]) || this.zones[this.zones.length - 1];
    if (currentZone && currentZone.id !== this.activeZone.id) {
      this.activeZone = currentZone;
      this.zoneTitleText.textContent = currentZone.name;
      this.zoneEraText.textContent = currentZone.era;
      this.highwayEngine.setZoneTheme(currentZone);
    }

    // Update Elevator Scrubber
    this.elevatorFill.style.height = `${progress * 100}%`;
    this.elevatorCarIndicator.style.top = `${progress * 100}%`;
    this.elevatorSpeedTooltip.textContent = `${displaySpeed} ${this.unit.toUpperCase()}`;

    // Mark elevator nodes as passed
    const nodes = this.elevatorStops.querySelectorAll('.elevator-node');
    nodes.forEach(node => {
      const nodeTop = parseFloat(node.style.top);
      node.classList.toggle('passed', progress * 100 >= nodeTop);
    });

    // Send telemetry to Web Audio Engine
    audioEngine.updateTelemetry(this.currentSpeed, this.scrollVelocity > 2);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new VelocityOdysseyApp();
});
