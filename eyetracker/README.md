# Eye Tracker — Eyedid SDK + Mario Bros

Eye tracker web que calibra tu mirada directamente en la pestaña del navegador, con fondo de mar pixel-art estilo Super Mario Bros durante la calibración y monedas giratorias como puntos de fijación.

## Demo

| Calibración | Tracking |
|---|---|
| Fondo marino SMB1 + monedas doradas giratorias | Punto blanco siguiendo tu mirada sobre fondo negro |

## Requisitos

- Node.js 16+
- Cámara web
- Chrome, Edge o Firefox reciente

## ⚠️ Paso 1: Consigue tu licencia (gratis)

1. Ve a **[manage.seeso.io](https://manage.seeso.io)**
2. Crea una cuenta gratuita
3. Genera una *License Key*
4. Abre el archivo **`index.js`** y reemplaza la línea:

```js
// ANTES
const LICENSE_KEY = 'TU_LICENSE_KEY_AQUI';

// DESPUÉS (ejemplo)
const LICENSE_KEY = 'dev_abc123tu_clave_real_aqui';
```

> La clave empieza por `dev_` en el plan gratuito.

## Paso 2: Instala dependencias

```bash
npm install
```

## Paso 3: Arranca

```bash
npm start
```

Se abrirá automáticamente `http://localhost:8082` en tu navegador.

## Cómo funciona

1. La cámara se activa y aparece **"mira el punto"**
2. Se muestran **5 monedas doradas** una a una — mira cada una fijamente hasta que desaparece
3. Al terminar, un **punto blanco** sigue tu mirada sobre fondo negro
4. Botón **Recalibrar** en la esquina inferior derecha para repetir el proceso

## Estructura

```
index.html      # HTML principal (fondo negro, UI mínima)
index.js        # Lógica principal — AQUÍ VA LA LICENSE KEY
marioCoin.js    # Moneda pixel-art SMB1 animada (4 frames)
pixelSea.js     # Fondo marino pixel-art SMB1
server.js       # Servidor Express + Parcel con headers WASM
package.json    # Dependencias
```

## Tecnologías

- [Eyedid SDK](https://sdk.eyedid.ai) (antes SeeSo) — eye tracking sin hardware adicional
- Vanilla JS + ES modules
- Parcel v1 (bundler)
- Pixel-art inspirado en Super Mario Bros 1 (NES underwater level)
