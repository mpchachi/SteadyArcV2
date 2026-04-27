// Ported from eyetracker/marioCoin.js — pixel-art Mario coin used as calibration fixation point.

const COIN = {
  goldLight: "#FCE0A0",
  gold:      "#FCBC3C",
  goldDark:  "#AC7C00",
  outline:   "#000000",
  shine:     "#FFFFFF",
};

function coinFrameFront(): string {
  const { outline: o, gold: g, goldLight: gl, goldDark: gd, shine: sh } = COIN;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'>
    <rect x='5' y='1' width='6' height='1' fill='${o}'/>
    <rect x='3' y='2' width='2' height='1' fill='${o}'/>
    <rect x='11' y='2' width='2' height='1' fill='${o}'/>
    <rect x='2' y='3' width='1' height='2' fill='${o}'/>
    <rect x='13' y='3' width='1' height='2' fill='${o}'/>
    <rect x='1' y='5' width='1' height='6' fill='${o}'/>
    <rect x='14' y='5' width='1' height='6' fill='${o}'/>
    <rect x='2' y='11' width='1' height='2' fill='${o}'/>
    <rect x='13' y='11' width='1' height='2' fill='${o}'/>
    <rect x='3' y='13' width='2' height='1' fill='${o}'/>
    <rect x='11' y='13' width='2' height='1' fill='${o}'/>
    <rect x='5' y='14' width='6' height='1' fill='${o}'/>
    <rect x='5' y='2' width='6' height='1' fill='${g}'/>
    <rect x='3' y='3' width='10' height='2' fill='${g}'/>
    <rect x='2' y='5' width='12' height='6' fill='${g}'/>
    <rect x='3' y='11' width='10' height='2' fill='${g}'/>
    <rect x='5' y='13' width='6' height='1' fill='${g}'/>
    <rect x='4' y='4' width='1' height='8' fill='${gl}'/>
    <rect x='3' y='5' width='1' height='6' fill='${gl}'/>
    <rect x='5' y='3' width='1' height='1' fill='${gl}'/>
    <rect x='5' y='12' width='1' height='1' fill='${gl}'/>
    <rect x='4' y='5' width='1' height='2' fill='${sh}'/>
    <rect x='10' y='4' width='1' height='8' fill='${gd}'/>
    <rect x='11' y='5' width='1' height='6' fill='${gd}'/>
    <rect x='10' y='3' width='1' height='1' fill='${gd}'/>
    <rect x='10' y='12' width='1' height='1' fill='${gd}'/>
    <rect x='7' y='4' width='2' height='8' fill='${gd}'/>
    <rect x='7' y='3' width='2' height='1' fill='${gd}'/>
    <rect x='7' y='12' width='2' height='1' fill='${gd}'/>
  </svg>`;
}

function coinFrame3q(flip = false): string {
  const { outline: o, gold: g, goldLight: gl, goldDark: gd } = COIN;
  const t = flip ? "transform='scale(-1,1) translate(-16,0)'" : "";
  return `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'>
    <g ${t}>
      <rect x='6' y='1' width='4' height='1' fill='${o}'/>
      <rect x='5' y='2' width='1' height='1' fill='${o}'/>
      <rect x='10' y='2' width='1' height='1' fill='${o}'/>
      <rect x='4' y='3' width='1' height='10' fill='${o}'/>
      <rect x='11' y='3' width='1' height='10' fill='${o}'/>
      <rect x='5' y='13' width='1' height='1' fill='${o}'/>
      <rect x='10' y='13' width='1' height='1' fill='${o}'/>
      <rect x='6' y='14' width='4' height='1' fill='${o}'/>
      <rect x='6' y='2' width='1' height='12' fill='${gl}'/>
      <rect x='5' y='3' width='1' height='10' fill='${gl}'/>
      <rect x='7' y='2' width='3' height='12' fill='${g}'/>
      <rect x='6' y='3' width='5' height='10' fill='${g}'/>
      <rect x='10' y='3' width='1' height='10' fill='${gd}'/>
      <rect x='8' y='3' width='1' height='10' fill='${gd}'/>
    </g>
  </svg>`;
}

function coinFrameSide(): string {
  const { outline: o, goldDark: gd } = COIN;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'>
    <rect x='7' y='1' width='2' height='14' fill='${o}'/>
    <rect x='8' y='2' width='1' height='12' fill='${gd}'/>
  </svg>`;
}

export interface CoinElement {
  show:        (x: number, y: number) => void;
  hide:        () => void;
  setProgress: (p: number) => void;
  remove:      () => void;
}

export function createCoinElement(size = 64): CoinElement {
  if (!document.getElementById('mario-coin-style')) {
    const style = document.createElement('style');
    style.id = 'mario-coin-style';
    style.textContent = `
      @keyframes marioCoinFrame0 { 0%, 24.99% { opacity:1; } 25%, 100%   { opacity:0; } }
      @keyframes marioCoinFrame1 { 0%, 24.99% { opacity:0; } 25%, 49.99% { opacity:1; } 50%, 100% { opacity:0; } }
      @keyframes marioCoinFrame2 { 0%, 49.99% { opacity:0; } 50%, 74.99% { opacity:1; } 75%, 100% { opacity:0; } }
      @keyframes marioCoinFrame3 { 0%, 74.99% { opacity:0; } 75%, 100%   { opacity:1; } }
    `;
    document.head.appendChild(style);
  }

  const frames = [coinFrameFront(), coinFrame3q(), coinFrameSide(), coinFrame3q(true)];

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position:        'fixed',
    width:           `${size}px`,
    height:          `${size}px`,
    imageRendering:  'pixelated',
    transform:       'translate(-50%, -50%) scale(1)',
    filter:          'drop-shadow(0 0 8px rgba(252,224,160,0.9)) drop-shadow(0 0 16px rgba(252,188,60,0.6))',
    display:         'none',
    zIndex:          '300',
    pointerEvents:   'none',
  });

  frames.forEach((svg, i) => {
    const img = document.createElement('img');
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    img.alt = '';
    Object.assign(img.style, {
      position:       'absolute',
      inset:          '0',
      width:          '100%',
      height:         '100%',
      imageRendering: 'pixelated',
      opacity:        '0',
      animation:      `marioCoinFrame${i} 0.6s steps(1) infinite`,
    });
    img.draggable = false;
    wrapper.appendChild(img);
  });

  const dot = document.createElement('span');
  const dotSize = Math.max(2, Math.round(size * 0.06));
  Object.assign(dot.style, {
    position:     'absolute',
    top:          '50%',
    left:         '50%',
    width:        `${dotSize}px`,
    height:       `${dotSize}px`,
    background:   '#E40058',
    transform:    'translate(-50%, -50%)',
    borderRadius: '1px',
    boxShadow:    '0 0 4px rgba(228,0,88,0.9)',
    pointerEvents:'none',
  });
  wrapper.appendChild(dot);
  document.body.appendChild(wrapper);

  return {
    show(x, y) {
      wrapper.style.left      = `${x}px`;
      wrapper.style.top       = `${y}px`;
      wrapper.style.transform = 'translate(-50%, -50%) scale(1)';
      wrapper.style.display   = 'block';
    },
    hide()     { wrapper.style.display = 'none'; },
    setProgress(p) {
      wrapper.style.transform = `translate(-50%, -50%) scale(${1 + p * 0.35})`;
    },
    remove()   { wrapper.remove(); },
  };
}
