import 'regenerator-runtime/runtime';
import EasySeeSo from 'seeso/easy-seeso';
import { createPixelSea } from './pixelSea';
import { createCoinElement } from './marioCoin';

// ─────────────────────────────────────────────────────────────────
// PASO 1: Consigue tu licencia gratuita en https://manage.seeso.io
//         y pega la clave aquí antes de arrancar.
// ─────────────────────────────────────────────────────────────────
const LICENSE_KEY = 'dev_tndb27gx8r2u0ymvur504a2qr4sfrziip91b97x3';

let eyeTracker = null;
let inCalibration = false;

const sea = createPixelSea();
const coin = createCoinElement(64);

const gazeDot = document.getElementById('gaze-dot');
const ui = document.getElementById('ui');
const uiSub = document.getElementById('ui-sub');
const recalibrateBtn = document.getElementById('recalibrate-btn');
const focusMsg = document.getElementById('focus-msg');
const statusEl = document.getElementById('status');

function setStatus(msg) {
  statusEl.textContent = msg;
}

function onGaze(gazeInfo) {
  if (inCalibration) return;
  gazeDot.style.left = gazeInfo.x + 'px';
  gazeDot.style.top = gazeInfo.y + 'px';
}

function onDebug(fps) {
  if (!inCalibration) setStatus(Math.round(fps) + ' fps');
}

// --- Calibración ---

function onCalibrationNextPoint(x, y) {
  coin.show(x, y);
  eyeTracker.startCollectSamples();
}

function onCalibrationProgress(progress) {
  coin.setProgress(progress);
}

function onCalibrationFinished() {
  inCalibration = false;
  coin.hide();
  sea.hide();
  focusMsg.style.display = 'none';
  gazeDot.style.display = 'block';
  recalibrateBtn.style.display = 'block';
  eyeTracker.showImage();
  setStatus('');
}

function startCalibration() {
  inCalibration = true;
  gazeDot.style.display = 'none';
  recalibrateBtn.style.display = 'none';
  eyeTracker.hideImage();
  sea.show();

  focusMsg.style.display = 'flex';
  setTimeout(() => {
    focusMsg.style.display = 'none';
    eyeTracker.startCalibration(
      onCalibrationNextPoint,
      onCalibrationProgress,
      onCalibrationFinished
    );
  }, 2000);
}

// --- Init ---

async function main() {
  eyeTracker = new EasySeeSo();

  await eyeTracker.init(
    LICENSE_KEY,
    async () => {
      eyeTracker.setMonitorSize(15.6);
      eyeTracker.setFaceDistance(50);
      eyeTracker.setCameraPosition(window.outerWidth / 2, true);
      await eyeTracker.startTracking(onGaze, onDebug);
      eyeTracker.showImage();
      ui.style.display = 'none';
      startCalibration();
    },
    () => {
      uiSub.textContent = 'Error al inicializar — comprueba la licencia o la cámara';
    }
  );

  recalibrateBtn.addEventListener('click', startCalibration);
}

main();
