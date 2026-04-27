# ALUMOGAME — FisherGame con Eye & Hand Tracking

Juego de pesca web con controles totalmente por **visión por computador**: eye tracking (Eyedid SDK) + hand tracking + reconocimiento facial (MediaPipe).

## Estructura del repositorio

```
ALUMOGAME/
├── fisherGame/     ← juego principal (Next.js 14)
└── eyetracker/     ← app standalone de eye tracking (referencia / demo)
```

---

## 🎮 FisherGame — Inicio rápido

### ⚠️ Paso 1: Pon tu licencia de Eyedid

Abre el archivo:

```
fisherGame/config/eyedid.ts
```

Verás esto:

```ts
export const EYEDID_LICENSE_KEY = "dev_xxxxxxxxxxxxxxxxxxxxxx";
```

Reemplaza el valor con tu clave:

1. Ve a **[manage.seeso.io](https://manage.seeso.io)**
2. Crea una cuenta gratuita
3. Copia tu *License Key* (empieza por `dev_`)
4. Pégala en `fisherGame/config/eyedid.ts`

> Sin una clave válida el calibrador de ojos no arrancará.

---

### Paso 2: Instala dependencias

```bash
cd fisherGame
npm install
```

### Paso 3: Arranca el servidor de desarrollo

```bash
npm run dev
```

Abre **[http://localhost:3000](http://localhost:3000)** en Chrome o Edge.

---

## Cómo se juega

1. **Intro** — pantalla de bienvenida, click para empezar
2. **Calibración ocular** — mira 5 monedas doradas una a una hasta que desaparezcan
3. **Pesca** — un punto blanco sigue tu mirada; cuando el pez pica, completa uno de estos retos:
   - 🙌 **Abre la mano** — mantén la mano abierta 2 segundos; cuanto más abierta, más rápido avanza
   - 👌 **Pellizca 4 veces** — junta pulgar e índice repetidamente
   - 😄 **Sonríe** — mantén la sonrisa 0,5 segundos

---

## Requisitos

| Requisito | Detalle |
|-----------|---------|
| Node.js   | 18+ recomendado |
| Navegador | Chrome o Edge (necesario SharedArrayBuffer para Eyedid WASM) |
| Cámara    | Webcam integrada o USB |
| Licencia  | Eyedid gratuita en [manage.seeso.io](https://manage.seeso.io) |

> **Firefox**: el eye tracking puede no funcionar por restricciones de SharedArrayBuffer.

---

## Eyetracker standalone

La carpeta `eyetracker/` contiene la demo original del eye tracker (vanilla JS, sin el juego). Tiene su propio `README.md` con instrucciones de uso.

---

## Tecnologías

- **Next.js 14** (App Router, `"use client"`)
- **Eyedid / SeeSo SDK** — eye tracking por cámara
- **MediaPipe Hands** — detección de mano abierta y pellizcos
- **MediaPipe FaceMesh** — detección de sonrisa
- Pixel-art inspirado en Super Mario Bros 1
