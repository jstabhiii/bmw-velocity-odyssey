/**
 * BMW Velocity Odyssey - Dynamic Vector Car Visual Generator
 * Produces precision SVG silhouettes with continuous rotating alloy rims,
 * pulsing Angel Eye headlights, carbon splitters, and dynamic aero glow.
 */

export function generateCarSVG(model, primaryColor = null) {
  const color = primaryColor || (model.colors && model.colors[0]?.hex) || '#0066B1';
  const isHighPerformance = model.topSpeedKm >= 280;
  const isConcept = model.category === 'Concept';
  const isVintage = model.year < 1970;

  // Wheel rim color
  const caliperColor = isHighPerformance ? '#E7222E' : '#d4af37'; // Gold or Red M Calipers

  return `
    <div class="car-stage-wrapper">
      <!-- Ground shadow with road reflection -->
      <div class="car-road-reflection"></div>
      
      <!-- Headlight Beam (Continuous glowing projection forward) -->
      <div class="headlight-beam" style="--beam-color: ${isConcept ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 255, 255, 0.35)'}"></div>

      <!-- Aerodynamic Wind Wake (Continuous flowing particles behind) -->
      <div class="aero-streamers">
        <span class="streamer s1" style="--s-color: ${color}"></span>
        <span class="streamer s2" style="--s-color: #0066B1"></span>
        <span class="streamer s3" style="--s-color: #E7222E"></span>
      </div>

      <!-- Main Vector Car Chassis -->
      <svg class="car-vector" viewBox="0 0 680 230" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyGrad-${model.id}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${adjustBrightness(color, -25)}" />
            <stop offset="45%" stop-color="${color}" />
            <stop offset="75%" stop-color="${adjustBrightness(color, 20)}" />
            <stop offset="100%" stop-color="${adjustBrightness(color, -30)}" />
          </linearGradient>

          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(30, 40, 60, 0.85)" />
            <stop offset="100%" stop-color="rgba(10, 15, 25, 0.95)" />
          </linearGradient>

          <linearGradient id="carbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#181a1f" />
            <stop offset="50%" stop-color="#0c0d10" />
            <stop offset="100%" stop-color="#1c1e24" />
          </linearGradient>

          <filter id="laserGlow-${model.id}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Underbody Shadow -->
        <ellipse cx="340" cy="195" rx="310" ry="12" fill="#030406" opacity="0.9" />

        ${getCarBodyGeometry(model, color)}

        <!-- Continuous Rotating Front Wheel Assembly -->
        <g class="wheel-assembly front-wheel" transform="translate(515, 172)">
          <!-- Brake Disc (Drilled Carbon Ceramic) -->
          <circle cx="0" cy="0" r="34" fill="#2b2d35" stroke="#484c59" stroke-width="1.5" />
          <circle cx="0" cy="0" r="30" fill="none" stroke="#606678" stroke-width="1" stroke-dasharray="2 3" />
          
          <!-- M Performance Caliper (Fixed) -->
          <path d="M-18 -26 Q-30 -12 -28 6 L-20 6 Q-22 -10 -12 -22 Z" fill="${caliperColor}" />
          <text x="-25" y="-6" fill="#fff" font-size="5" font-family="'Orbitron', sans-serif" font-weight="900">M</text>

          <!-- Rotating Rim Group (Continuous CSS spin) -->
          <g class="spinning-rim">
            <!-- Outer Rim Lip -->
            <circle cx="0" cy="0" r="41" fill="none" stroke="#22252c" stroke-width="6" />
            <circle cx="0" cy="0" r="38" fill="none" stroke="#7a8291" stroke-width="1.5" />
            
            <!-- BMW M Double-Spokes (10 Spokes) -->
            ${generateSpokes()}
            
            <!-- BMW Center Roundel -->
            <circle cx="0" cy="0" r="8" fill="#111" stroke="#888" stroke-width="1" />
            <path d="M-6 0 A6 6 0 0 1 0 -6 L0 0 Z" fill="#0066B1" />
            <path d="M0 6 A6 6 0 0 1 6 0 L0 0 Z" fill="#0066B1" />
            <path d="M0 -6 A6 6 0 0 1 6 0 L0 0 Z" fill="#ffffff" />
            <path d="M-6 0 A6 6 0 0 1 0 6 L0 0 Z" fill="#ffffff" />
          </g>
          <!-- Tire Rubber -->
          <circle cx="0" cy="0" r="44" fill="none" stroke="#121316" stroke-width="6" />
        </g>

        <!-- Continuous Rotating Rear Wheel Assembly -->
        <g class="wheel-assembly rear-wheel" transform="translate(160, 172)">
          <!-- Brake Disc -->
          <circle cx="0" cy="0" r="34" fill="#2b2d35" stroke="#484c59" stroke-width="1.5" />
          <circle cx="0" cy="0" r="30" fill="none" stroke="#606678" stroke-width="1" stroke-dasharray="2 3" />
          
          <!-- Caliper -->
          <path d="M18 -26 Q30 -12 28 6 L20 6 Q22 -10 12 -22 Z" fill="${caliperColor}" />
          <text x="18" y="-6" fill="#fff" font-size="5" font-family="'Orbitron', sans-serif" font-weight="900">M</text>

          <!-- Rotating Rim -->
          <g class="spinning-rim">
            <circle cx="0" cy="0" r="41" fill="none" stroke="#22252c" stroke-width="6" />
            <circle cx="0" cy="0" r="38" fill="none" stroke="#7a8291" stroke-width="1.5" />
            ${generateSpokes()}
            
            <circle cx="0" cy="0" r="8" fill="#111" stroke="#888" stroke-width="1" />
            <path d="M-6 0 A6 6 0 0 1 0 -6 L0 0 Z" fill="#0066B1" />
            <path d="M0 6 A6 6 0 0 1 6 0 L0 0 Z" fill="#0066B1" />
            <path d="M0 -6 A6 6 0 0 1 6 0 L0 0 Z" fill="#ffffff" />
            <path d="M-6 0 A6 6 0 0 1 0 6 L0 0 Z" fill="#ffffff" />
          </g>
          <circle cx="0" cy="0" r="44" fill="none" stroke="#121316" stroke-width="6" />
        </g>

      </svg>
    </div>
  `;
}

function generateSpokes() {
  let spokes = '';
  for (let angle = 0; angle < 360; angle += 36) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * 36;
    const y = Math.sin(rad) * 36;
    spokes += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#b0b8c6" stroke-width="2.2" stroke-linecap="round" />`;
  }
  return spokes;
}

function getCarBodyGeometry(model, color) {
  const isSupercar = model.id.includes('m1') || model.id.includes('next') || model.id.includes('hybrid');
  const isVintage = model.year < 1965;
  const isBoxy = model.id.includes('e30') || model.id.includes('2002');

  if (isSupercar) {
    // Low-slung wedge supercar silhouette (M1 / Vision M NEXT / Le Mans Hypercar)
    return `
      <!-- Low Aerodynamic Chassis -->
      <path d="M50 175 L80 168 L140 168 Q210 168 280 148 L410 120 Q480 135 550 152 L610 162 Q635 170 645 178 L630 185 L590 188 Q565 150 515 150 Q465 150 440 188 L235 188 Q210 150 160 150 Q110 150 85 188 L45 186 Z" fill="url(#bodyGrad-${model.id})" stroke="#00f0ff" stroke-width="0.8" />
      
      <!-- Aerodynamic Canopy / Cockpit -->
      <path d="M250 150 L340 98 Q420 96 460 122 L490 148 Z" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.2)" stroke-width="1.2" />
      
      <!-- Laser Light Headlamp (Sharp glowing slit) -->
      <path d="M605 163 L638 169 L625 173 Z" fill="#00f0ff" filter="url(#laserGlow-${model.id})" />
      
      <!-- Rear Carbon Diffuser & Wing -->
      <path d="M55 150 L110 142 L105 147 L60 154 Z" fill="#15171c" stroke="#E7222E" stroke-width="1" />
      <!-- M Tricolor Side Stripe -->
      <path d="M120 166 L380 144" stroke="#0066B1" stroke-width="3" />
      <path d="M120 169 L380 147" stroke="#002B49" stroke-width="3" />
      <path d="M120 172 L380 150" stroke="#E7222E" stroke-width="3" />
    `;
  } else if (isVintage) {
    // Curvaceous vintage roadster silhouette (Dixi / 328 / 507)
    return `
      <!-- Classic Curving Body -->
      <path d="M50 178 Q75 145 130 155 Q190 165 260 152 Q330 140 430 145 Q510 150 590 158 Q630 168 640 182 L610 188 Q575 152 515 152 Q455 152 430 188 L235 188 Q210 152 160 152 Q110 152 85 188 Z" fill="url(#bodyGrad-${model.id})" stroke="#ffffff" stroke-width="0.7" />
      <!-- Vintage Windscreen Frame -->
      <path d="M330 142 L360 110 L410 144 Z" fill="url(#glassGrad)" stroke="#c4cbd3" stroke-width="1.8" />
      <!-- Classic Round Headlight -->
      <circle cx="612" cy="162" r="9" fill="#fffae6" stroke="#c4cbd3" stroke-width="1.5" />
      <!-- Chrome Bumper -->
      <path d="M620 178 Q638 180 642 188" stroke="#cfd3d8" stroke-width="3.5" stroke-linecap="round" />
    `;
  } else if (isBoxy) {
    // Iconic Box-Flares (E30 M3 / 2002 Turbo)
    return `
      <!-- Boxy Silhouette with Pronounced M Box-Flares -->
      <path d="M55 162 L105 160 L140 138 L250 138 L300 95 L460 95 L520 138 L605 142 L635 175 L620 186 Q575 148 515 148 Q455 148 430 186 L235 186 Q210 148 160 148 Q110 148 85 186 Z" fill="url(#bodyGrad-${model.id})" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
      
      <!-- Greenhouse Windows with Hofmeister Kink -->
      <path d="M305 99 L455 99 L505 136 L310 136 Z" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
      
      <!-- Dual Round Angel Eye Headlights -->
      <circle cx="618" cy="156" r="6.5" fill="#fff" stroke="#ffb400" stroke-width="2" filter="url(#laserGlow-${model.id})" />
      <circle cx="604" cy="156" r="6.5" fill="#fff" stroke="#ffb400" stroke-width="2" filter="url(#laserGlow-${model.id})" />
      
      <!-- Iconic Box Fender Flare Outlines -->
      <path d="M125 150 Q160 140 195 150" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
      <path d="M480 150 Q515 140 550 150" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
      
      <!-- Rear Bootlid Lip Spoiler -->
      <rect x="52" y="157" width="22" height="6" rx="2" fill="#121316" />
      
      <!-- M Motorsport Racing Decal -->
      <path d="M260 148 L420 148" stroke="#0066B1" stroke-width="2.5" />
      <path d="M260 151 L420 151" stroke="#002B49" stroke-width="2.5" />
      <path d="M260 154 L420 154" stroke="#E7222E" stroke-width="2.5" />
    `;
  } else {
    // Modern High-Performance M Sports Coupe / Sedan (M4 CSL / M5 CS / M8 / M2 CS)
    return `
      <!-- Aggressive Modern M Coupe Body -->
      <path d="M55 160 L120 156 L200 135 L300 96 L475 96 L545 135 L625 148 L642 178 L625 186 Q575 148 515 148 Q455 148 430 186 L235 186 Q210 148 160 148 Q110 148 85 186 Z" fill="url(#bodyGrad-${model.id})" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
      
      <!-- Roof Carbon Fiber Weave Indicator -->
      <path d="M305 96 L470 96" stroke="#d4af37" stroke-width="2" stroke-dasharray="3 3" />
      
      <!-- Aerodynamic Hofmeister Kink Greenhouse -->
      <path d="M305 101 L470 101 L535 134 L295 134 Z" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" />
      
      <!-- Dual L-Shaped Laserlight Daytime Running Lights -->
      <path d="M610 152 L632 155 L622 161" fill="none" stroke="${model.id.includes('m5-cs') ? '#ffd000' : '#00f0ff'}" stroke-width="3.2" stroke-linecap="round" filter="url(#laserGlow-${model.id})" />
      
      <!-- Carbon Front Splitter -->
      <path d="M605 182 L646 182 L640 186 L600 186 Z" fill="#14161a" stroke="#E7222E" stroke-width="0.8" />
      
      <!-- Carbon Rear CSL Ducktail Spoiler -->
      <path d="M52 154 Q65 146 72 156" fill="none" stroke="#14161a" stroke-width="4.5" stroke-linecap="round" />
      
      <!-- Muscular Shoulder Line Crease -->
      <path d="M125 154 L580 147" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" />
    `;
  }
}

function adjustBrightness(hex, percent) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let num = parseInt(c, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
