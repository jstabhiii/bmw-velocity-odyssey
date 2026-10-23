/**
 * BMW Velocity Odyssey - Continuous Moving Highway & Cyber Tunnel Canvas Engine
 * Generates an ultra-smooth, continuous 60-120 FPS infinite night road experience
 * with parallax speed lines, perspective lane markings, and CFD aerodynamic ribbons.
 */

export class HighwayEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Dynamic Speed State
    this.baseSpeed = 1.2; // Continuous idle cruise speed (always moving!)
    this.scrollVelocity = 0;
    this.effectiveSpeed = this.baseSpeed;
    this.targetSpeed = this.baseSpeed;
    this.distanceTraveled = 0;
    this.zoneColor = '#0066B1';

    // Particles & Streaks
    this.speedParticles = [];
    this.catEyes = [];
    this.aeroRibbons = [];
    this.tunnelRings = [];

    this.maxSpeedParticles = 75;
    this.maxCatEyes = 40;
    this.maxRings = 8;

    this.initCanvas();
    this.initEntities();
    this.bindEvents();
  }

  initCanvas() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.vanishX = this.width / 2;
    this.vanishY = this.height * 0.38; // 38% down for high-speed perspective
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
  }

  initEntities() {
    // 1. High-speed light streaks & embers
    this.speedParticles = [];
    for (let i = 0; i < this.maxSpeedParticles; i++) {
      this.speedParticles.push(this.createSpeedParticle(true));
    }

    // 2. Roadside Cat-Eye Reflectors along highway curbs
    this.catEyes = [];
    for (let i = 0; i < this.maxCatEyes; i++) {
      this.catEyes.push({
        z: (i / this.maxCatEyes) * 1000,
        side: i % 2 === 0 ? -1 : 1
      });
    }

    // 3. Cyber Tunnel Rings
    this.tunnelRings = [];
    for (let i = 0; i < this.maxRings; i++) {
      this.tunnelRings.push({
        z: (i / this.maxRings) * 1200
      });
    }

    // 4. Aerodynamic CFD ribbons (wind tunnel streaming lines)
    this.aeroRibbons = [];
    for (let i = 0; i < 6; i++) {
      this.aeroRibbons.push({
        xOffset: (i - 2.5) * 120,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
        color: i % 3 === 0 ? '#0066B1' : i % 3 === 1 ? '#002B49' : '#E7222E'
      });
    }
  }

  createSpeedParticle(randomZ = false) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * (this.width * 0.65);
    return {
      x: this.vanishX + Math.cos(angle) * distance,
      y: this.vanishY + Math.sin(angle) * (distance * 0.6),
      originAngle: angle,
      originDist: distance,
      z: randomZ ? Math.random() * 1000 : 1000,
      length: 15 + Math.random() * 45,
      speedScale: 0.8 + Math.random() * 0.8,
      color: Math.random() > 0.4 ? (Math.random() > 0.5 ? '#0066B1' : '#00f0ff') : '#E7222E',
      width: 1 + Math.random() * 2
    };
  }

  setScrollVelocity(vel) {
    this.scrollVelocity = vel;
  }

  setZoneTheme(zone) {
    if (zone && zone.accentColor) {
      this.zoneColor = zone.accentColor;
    }
  }

  update(currentSpeedKmH = 0) {
    // Effective animation speed is idle speed + speed derived from scroll / telemetry
    const dynamicBoost = (this.scrollVelocity * 0.4) + (currentSpeedKmH * 0.04);
    this.targetSpeed = this.baseSpeed + Math.abs(dynamicBoost);
    
    // Smooth dampening
    this.effectiveSpeed += (this.targetSpeed - this.effectiveSpeed) * 0.15;
    this.distanceTraveled += this.effectiveSpeed;

    // Decay scroll velocity
    this.scrollVelocity *= 0.88;

    // 1. Update Speed Particles
    const pSpeed = this.effectiveSpeed * 14;
    for (let i = 0; i < this.speedParticles.length; i++) {
      const p = this.speedParticles[i];
      p.z -= pSpeed * p.speedScale;
      if (p.z <= 10) {
        Object.assign(p, this.createSpeedParticle(false));
        p.z = 1000;
      }
    }

    // 2. Update Cat Eyes
    const cSpeed = this.effectiveSpeed * 10;
    for (let i = 0; i < this.catEyes.length; i++) {
      const c = this.catEyes[i];
      c.z -= cSpeed;
      if (c.z <= 20) {
        c.z += 1000;
      }
    }

    // 3. Update Tunnel Rings
    const rSpeed = this.effectiveSpeed * 12;
    for (let i = 0; i < this.tunnelRings.length; i++) {
      const r = this.tunnelRings[i];
      r.z -= rSpeed;
      if (r.z <= 30) {
        r.z += 1200;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const vx = this.vanishX;
    const vy = this.vanishY;

    // 1. Dark Atmospheric Background
    const bgGrad = ctx.createRadialGradient(vx, vy, 10, vx, vy, Math.max(w, h));
    bgGrad.addColorStop(0, '#0f121d');
    bgGrad.addColorStop(0.4, '#090a0f');
    bgGrad.addColorStop(1, '#050507');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Road Horizon Glow (Laser Light Aura)
    ctx.save();
    const horizonGlow = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.45);
    horizonGlow.addColorStop(0, this.hexToRgba(this.zoneColor, 0.28));
    horizonGlow.addColorStop(0.5, this.hexToRgba(this.zoneColor, 0.08));
    horizonGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 3. Draw Highway Road Surface (Perspective Trapezoid)
    ctx.save();
    const roadTopWidth = 60;
    const roadBottomWidth = w * 0.92;
    const roadBottomY = h;

    // Road Bed Gradient (Wet asphalt sheen)
    const roadGrad = ctx.createLinearGradient(0, vy, 0, roadBottomY);
    roadGrad.addColorStop(0, '#101319');
    roadGrad.addColorStop(0.6, '#0b0c10');
    roadGrad.addColorStop(1, '#07080a');

    ctx.beginPath();
    ctx.moveTo(vx - roadTopWidth / 2, vy);
    ctx.lineTo(vx + roadTopWidth / 2, vy);
    ctx.lineTo(vx + roadBottomWidth / 2, roadBottomY);
    ctx.lineTo(vx - roadBottomWidth / 2, roadBottomY);
    ctx.closePath();
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // Road Edge Curbs (Neon Guide Rails)
    ctx.strokeStyle = this.hexToRgba(this.zoneColor, 0.6);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Left edge
    ctx.moveTo(vx - roadTopWidth / 2, vy);
    ctx.lineTo(vx - roadBottomWidth / 2, roadBottomY);
    // Right edge
    ctx.moveTo(vx + roadTopWidth / 2, vy);
    ctx.lineTo(vx + roadBottomWidth / 2, roadBottomY);
    ctx.stroke();

    // Secondary Outer Glow Rails
    ctx.strokeStyle = 'rgba(231, 34, 46, 0.35)'; // BMW M Red subtle outer pulse
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vx - roadTopWidth / 2 - 15, vy);
    ctx.lineTo(vx - roadBottomWidth / 2 - 40, roadBottomY);
    ctx.moveTo(vx + roadTopWidth / 2 + 15, vy);
    ctx.lineTo(vx + roadBottomWidth / 2 + 40, roadBottomY);
    ctx.stroke();

    // 4. Continuous Moving Dashed Lane Markers (Autobahn 3-Lane Track)
    this.renderLaneDividers(ctx, vx, vy, roadTopWidth, roadBottomWidth, roadBottomY);

    // 5. Roadside Cat-Eye Reflectors
    this.renderCatEyes(ctx, vx, vy, roadTopWidth, roadBottomWidth, roadBottomY);

    // 6. Cyber Tunnel Neon Rings (Deep perspective arches)
    this.renderTunnelRings(ctx, vx, vy);

    // 7. Continuous Moving Speed Particles / Light Streaks
    this.renderSpeedParticles(ctx, vx, vy);

    // 8. Aerodynamic CFD Ribbons (Waving wind-tunnel lines)
    this.renderAeroRibbons(ctx, vx, vy);

    ctx.restore();
  }

  renderLaneDividers(ctx, vx, vy, roadTopWidth, roadBottomWidth, roadBottomY) {
    const lanes = [-0.32, 0, 0.32]; // 3 lane dividers
    const numDashes = 18;
    const offset = (this.distanceTraveled * 0.08) % 1;

    for (const laneRatio of lanes) {
      for (let i = 0; i < numDashes; i++) {
        // Perspective distribution from 0 (horizon) to 1 (bottom)
        const t1 = Math.pow((i + offset) / numDashes, 2.2);
        const t2 = Math.pow((i + offset + 0.45) / numDashes, 2.2);

        if (t1 > 1 || t2 > 1 || t1 < 0.02) continue;

        const y1 = vy + (roadBottomY - vy) * t1;
        const y2 = vy + (roadBottomY - vy) * t2;

        const w1 = roadTopWidth + (roadBottomWidth - roadTopWidth) * t1;
        const w2 = roadTopWidth + (roadBottomWidth - roadTopWidth) * t2;

        const x1 = vx + (w1 * 0.5) * laneRatio;
        const x2 = vx + (w2 * 0.5) * laneRatio;

        const alpha = Math.min(1, Math.max(0.1, t1 * 1.3));
        const lineWidth = Math.max(1.2, t1 * 6.5);

        ctx.strokeStyle = `rgba(240, 246, 255, ${alpha * 0.75})`;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }

  renderCatEyes(ctx, vx, vy, roadTopWidth, roadBottomWidth, roadBottomY) {
    for (let i = 0; i < this.catEyes.length; i++) {
      const c = this.catEyes[i];
      const t = 1 - (c.z / 1000);
      if (t <= 0.03 || t >= 0.98) continue;

      const pT = Math.pow(t, 2.4); // perspective warp
      const y = vy + (roadBottomY - vy) * pT;
      const roadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * pT;
      const x = vx + (roadW * 0.52) * c.side;

      const radius = Math.max(1, pT * 4.5);
      const alpha = Math.min(1, pT * 1.5);

      ctx.fillStyle = c.side > 0 ? `rgba(255, 180, 0, ${alpha})` : this.hexToRgba(this.zoneColor, alpha);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Bloom glow
      ctx.fillStyle = this.hexToRgba(this.zoneColor, alpha * 0.25);
      ctx.beginPath();
      ctx.arc(x, y, radius * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderTunnelRings(ctx, vx, vy) {
    for (let i = 0; i < this.tunnelRings.length; i++) {
      const r = this.tunnelRings[i];
      const t = 1 - (r.z / 1200);
      if (t <= 0.05 || t >= 0.95) continue;

      const pT = Math.pow(t, 2.2);
      const ringW = 120 + pT * (this.width * 1.05);
      const ringH = 70 + pT * (this.height * 0.95);
      const ringY = vy + (this.height * 0.48 - vy) * pT;

      const alpha = Math.min(0.35, pT * 0.4);

      ctx.save();
      ctx.strokeStyle = this.hexToRgba(this.zoneColor, alpha);
      ctx.lineWidth = Math.max(1, pT * 3);
      ctx.setLineDash([40 * pT, 30 * pT]);

      ctx.beginPath();
      ctx.ellipse(vx, ringY, ringW * 0.5, ringH * 0.5, 0, Math.PI, 0); // Upper arch
      ctx.stroke();
      ctx.restore();
    }
  }

  renderSpeedParticles(ctx, vx, vy) {
    for (let i = 0; i < this.speedParticles.length; i++) {
      const p = this.speedParticles[i];
      const t = 1 - (p.z / 1000);
      if (t <= 0.02 || t >= 1) continue;

      const pT = Math.pow(t, 2.0);
      const dist = p.originDist * pT;
      const x = vx + Math.cos(p.originAngle) * dist;
      const y = vy + Math.sin(p.originAngle) * (dist * 0.65);

      // Tail trailing back toward center
      const tailLength = p.length * pT * (1 + this.effectiveSpeed * 0.6);
      const tailX = x - Math.cos(p.originAngle) * tailLength;
      const tailY = y - Math.sin(p.originAngle) * (tailLength * 0.65);

      const alpha = Math.min(0.9, pT * 1.2);

      const grad = ctx.createLinearGradient(tailX, tailY, x, y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, this.hexToRgba(p.color, alpha));

      ctx.strokeStyle = grad;
      ctx.lineWidth = p.width * Math.max(0.8, pT * 2.2);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  renderAeroRibbons(ctx, vx, vy) {
    const time = Date.now() * 0.002;
    for (let i = 0; i < this.aeroRibbons.length; i++) {
      const rib = this.aeroRibbons[i];
      ctx.save();
      ctx.strokeStyle = this.hexToRgba(rib.color, 0.22);
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      for (let step = 0; step < 24; step++) {
        const t = step / 24;
        const pT = Math.pow(t, 1.8);
        const y = vy + (this.height - vy) * pT;
        const spread = rib.xOffset * pT * 2.8;
        const wave = Math.sin(time * 3 + t * 8 + rib.phase) * (14 * pT);
        const x = vx + spread + wave;

        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 102;
    const b = parseInt(c.substring(4, 6), 16) || 177;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
