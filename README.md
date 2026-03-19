# ⚔️ SurvivalGame

> Simulación de persecución y huida · Modo Arcade con Metaprogresión

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Sin dependencias](https://img.shields.io/badge/dependencias-ninguna-22c55e?style=flat)

---

## 📖 Descripción

SurvivalGame nació como práctica de programación orientada a objetos en Java y ha evolucionado a una aplicación web completa con un sistema profundo de **metaprogresión**.

El núcleo del juego modela el **comportamiento emergente de agentes autónomos**: entidades *buenas* que huyen y entidades *malas* que persiguen, usando estrategias de movimiento intercambiables (patrón Strategy).

---

## 🎮 Modos de juego

### 🔬 Simulación
Configura libremente el número de buenos, malos y obstáculos para observar cómo interactúan en tiempo real. Ideal para estudiar comportamientos emergentes.

### ⚔️ Arcade (RPG Lite)
Tú eres el jugador. Sobrevive a oleadas de enemigos, gana experiencia, sube de nivel y elige power-ups temporales. Ahora incluye un **sistema de moneda** para comprar mejoras permanentes.

---

## ✨ Características Principales

- 🧬 **Metaprogresión Permanente** — Gana monedas en el modo arcade y gástalas en la **Tienda** para mejorar para siempre tu Vitalidad, Fuerza, Rapidez y Rango de imán.
- 💾 **Persistencia con LocalStorage** — Tus mejoras y monedas se guardan automáticamente en el navegador.
- 🌊 **Oleadas de Jefes** — Enfrenta a 6 tipos de enemigos (Normal, Runner, Shooter, Miniboss, Boss y **Superboss**) con patrones de ataque únicos.
- 🗺️ **Mapa Expandido** — A partir de la ronda 10 el mapa se expande y desde la 15 se convierte en un **mapa infinito con cámara dinámica**.
- 🧠 **Arquitectura Sólida** — Basado en patrones de diseño (Strategy) y OOP, manteniendo la esencia del diseño Java original.
- 📱 **Soporte Móvil Pro** — Joystick táctil con movimiento analógico y auto-apuntado inteligente.
- 🎨 **Estética Premium** — Dark mode, efectos de partículas, animaciones fluidas y Web Audio API para efectos de sonido.

---

## 🕹️ Controles

| Acción | Teclado / Ratón | Móvil |
|--------|----------------|-------|
| Mover | `WASD` o flechas | Joystick táctil |
| Disparar | Click izquierdo (Apuntar con ratón) | Auto-apuntado automático |

---

## 🚀 Instalación y Despliegue

### Ejecución local
Simplemente abre el archivo `index.html` en cualquier navegador moderno. No requiere servidor ni instalación de dependencias.

### Despliegue en Vercel / Netlify
1. Sube el repositorio.
2. Configura el **directorio raíz** como el de este repositorio.
3. El despliegue es automático (sitio estático).

---

## 🗂️ Estructura del Proyecto

```
SurvivalGame/
├── index.html      # Estructura y contenedores de pantallas
├── style.css       # Diseño visual, animaciones y sistema de temas
├── js/
│   └── main.js     # Lógica completa: OOP, Motor del juego, Arcade y Tienda
└── README.md
```

---

## 🧪 Próximos Pasos (Roadmap)

- [ ] Efectos visuales de "Shake" en la cámara al recibir daño.
- [ ] Nuevos biomas visuales que cambien cada 10 oleadas.
- [ ] Sistema de Logros (Achievements) vinculados a la metaprogresión.
- [ ] Tabla de récords global (requiere backend).

---

## 👤 Autor

Desarrollado por **CurroPG** — [github.com/CurroPG/SurvivalGameJava](https://github.com/CurroPG/SurvivalGameJava)