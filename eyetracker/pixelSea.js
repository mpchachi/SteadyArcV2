const SMB = {
  deepBlue:  "#0058F8",
  midBlue:   "#3CBCFC",
  darkBlue:  "#0000A8",
  sand:      "#FCBC3C",
  sandDark:  "#AC7C00",
  coralRed:  "#E40058",
  coralPink: "#F878F8",
  algaeGreen:"#00A800",
  algaeDark: "#006800",
  white:     "#FCFCFC",
  black:     "#000000",
};

function waterTileSvg() {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'>
    <rect width='16' height='16' fill='${SMB.deepBlue}'/>
    <rect x='2' y='3' width='2' height='2' fill='${SMB.midBlue}'/>
    <rect x='10' y='1' width='2' height='2' fill='${SMB.midBlue}'/>
    <rect x='6' y='8' width='2' height='2' fill='${SMB.midBlue}'/>
    <rect x='13' y='11' width='2' height='2' fill='${SMB.midBlue}'/>
    <rect x='1' y='13' width='2' height='2' fill='${SMB.midBlue}'/>
    <rect x='8' y='14' width='2' height='2' fill='${SMB.midBlue}'/>
  </svg>`;
}

function seabedSvg() {
  const { sand, sandDark, algaeGreen: algae, algaeDark, coralRed: coralR, coralPink: coralP, black } = SMB;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='45' shape-rendering='crispEdges'>
    <rect x='4' y='18' width='3' height='3' fill='${algae}'/>
    <rect x='4' y='21' width='3' height='3' fill='${algae}'/>
    <rect x='1' y='24' width='3' height='3' fill='${algae}'/>
    <rect x='4' y='24' width='3' height='3' fill='${algaeDark}'/>
    <rect x='4' y='27' width='3' height='3' fill='${algae}'/>
    <rect x='7' y='27' width='3' height='3' fill='${algaeDark}'/>
    <rect x='4' y='30' width='3' height='3' fill='${algae}'/>
    <rect x='26' y='22' width='3' height='3' fill='${coralR}'/>
    <rect x='29' y='19' width='3' height='3' fill='${coralR}'/>
    <rect x='32' y='22' width='3' height='3' fill='${coralR}'/>
    <rect x='29' y='25' width='3' height='3' fill='${coralR}'/>
    <rect x='26' y='28' width='3' height='3' fill='${coralR}'/>
    <rect x='32' y='28' width='3' height='3' fill='${coralR}'/>
    <rect x='29' y='31' width='3' height='3' fill='${coralR}'/>
    <rect x='48' y='26' width='3' height='3' fill='${coralP}'/>
    <rect x='51' y='23' width='3' height='3' fill='${coralP}'/>
    <rect x='54' y='26' width='3' height='3' fill='${coralP}'/>
    <rect x='51' y='29' width='3' height='3' fill='${coralP}'/>
    <rect x='48' y='32' width='3' height='3' fill='${coralP}'/>
    <rect x='54' y='32' width='3' height='3' fill='${coralP}'/>
    <rect x='0' y='36' width='64' height='9' fill='${sand}'/>
    <rect x='0' y='34' width='4' height='2' fill='${sand}'/>
    <rect x='8' y='34' width='6' height='2' fill='${sand}'/>
    <rect x='18' y='34' width='4' height='2' fill='${sand}'/>
    <rect x='26' y='34' width='8' height='2' fill='${sand}'/>
    <rect x='38' y='34' width='4' height='2' fill='${sand}'/>
    <rect x='46' y='34' width='6' height='2' fill='${sand}'/>
    <rect x='56' y='34' width='4' height='2' fill='${sand}'/>
    <rect x='6'  y='40' width='2' height='2' fill='${sandDark}'/>
    <rect x='20' y='42' width='2' height='2' fill='${sandDark}'/>
    <rect x='34' y='40' width='2' height='2' fill='${sandDark}'/>
    <rect x='44' y='43' width='2' height='2' fill='${sandDark}'/>
    <rect x='58' y='41' width='2' height='2' fill='${sandDark}'/>
    <rect x='14' y='44' width='1' height='1' fill='${black}'/>
    <rect x='40' y='44' width='1' height='1' fill='${black}'/>
  </svg>`;
}

export function createPixelSea() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes smbBubbleRise {
      0%   { transform: translateY(0) translateX(0); opacity: 0; }
      10%  { opacity: 0.85; }
      50%  { transform: translateY(-50vh) translateX(6px); }
      90%  { opacity: 0.85; }
      100% { transform: translateY(-110vh) translateX(-6px); opacity: 0; }
    }
    @keyframes smbSeaShift {
      0%   { background-position: 0px 0px; }
      100% { background-position: 64px 0px; }
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    overflow: 'hidden',
    background: `linear-gradient(180deg, ${SMB.darkBlue} 0%, ${SMB.deepBlue} 35%, ${SMB.deepBlue} 100%)`,
    imageRendering: 'pixelated',
    zIndex: '1',
    display: 'none',
  });

  // Water texture
  const water = document.createElement('div');
  Object.assign(water.style, {
    position: 'absolute', inset: '0', opacity: '0.4',
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(waterTileSvg())}")`,
    backgroundRepeat: 'repeat', backgroundSize: '64px 64px',
    imageRendering: 'pixelated',
    animation: 'smbSeaShift 12s steps(4) infinite',
  });
  root.appendChild(water);

  // Light rays
  const rays = document.createElement('div');
  Object.assign(rays.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none',
    background: 'linear-gradient(180deg, rgba(252,252,252,0.18) 0%, rgba(252,252,252,0.04) 25%, transparent 45%)',
  });
  root.appendChild(rays);

  // Seabed
  const seabed = document.createElement('div');
  Object.assign(seabed.style, {
    position: 'absolute', bottom: '0', left: '0', right: '0', height: '180px',
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(seabedSvg())}")`,
    backgroundRepeat: 'repeat-x', backgroundSize: '256px 180px',
    backgroundPosition: 'bottom left', imageRendering: 'pixelated',
  });
  root.appendChild(seabed);

  // Bubbles
  const bubblesEl = document.createElement('div');
  Object.assign(bubblesEl.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  Array.from({ length: 18 }, (_, i) => {
    const size = 6 + ((i * 7) % 4) * 2;
    const bubble = document.createElement('span');
    Object.assign(bubble.style, {
      position: 'absolute',
      left: `${(i * 53) % 100}%`,
      bottom: '-20px',
      width: `${size}px`,
      height: `${size}px`,
      background: SMB.white,
      boxShadow: `inset -2px -2px 0 0 ${SMB.midBlue}`,
      borderRadius: '2px',
      opacity: '0.85',
      animation: `smbBubbleRise ${7 + ((i * 3) % 6)}s linear ${(i * 0.7) % 8}s infinite`,
      imageRendering: 'pixelated',
    });
    bubblesEl.appendChild(bubble);
  });
  root.appendChild(bubblesEl);

  // Vignette
  const vignette = document.createElement('div');
  Object.assign(vignette.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.25) 100%)',
  });
  root.appendChild(vignette);

  document.body.insertBefore(root, document.body.firstChild);

  return {
    show: () => { root.style.display = 'block'; },
    hide: () => { root.style.display = 'none'; },
  };
}
