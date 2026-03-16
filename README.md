# ⚔️ SurvivalGame

> Simulación de persecución y huida · Modo Arcade incluido

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Sin dependencias](https://img.shields.io/badge/dependencias-ninguna-22c55e?style=flat)

---

## 📖 Descripción

SurvivalGame nació como práctica de programación orientada a objetos en Java y evolucionó hasta convertirse en una aplicación web completa que funciona directamente en el navegador.

El núcleo del juego modela el **comportamiento emergente de agentes autónomos**: entidades *buenas* que huyen y entidades *malas* que persiguen, usando estrategias de movimiento intercambiables (patrón Strategy). El resultado es una simulación viva donde el caos surge de reglas simples.

---

## 🎮 Modos de juego

### 🔬 Simulación
Configura libremente el número de buenos, malos y obstáculos y observa cómo los agentes interactúan en tiempo real sobre el tablero. Ideal para estudiar el comportamiento emergente del sistema.

### ⚔️ Arcade
Tú eres el jugador. Sobrevive oleadas de enemigos cada vez más difíciles, gana experiencia, sube de nivel y elige mejoras de poder. Compatible con teclado + ratón y con pantalla táctil.

---

## ✨ Características

- 🏗️ **Arquitectura orientada a objetos** — clases `Posicion`, `Elementos`, `Buenos`, `Malos`, `Obstaculos` y `Mapa`, fiel traducción del diseño Java original
- 🧠 **Patrón Strategy** — `Huir` y `Perseguir` son intercambiables en tiempo de ejecución sin modificar las entidades
- 🌊 **Sistema de oleadas escalable** — 6 tipos de enemigos: normal, runner, shooter, miniboss, boss y superboss, cada uno con comportamiento único
- ⭐ **Progresión del jugador** — experiencia, niveles y 9 power-ups seleccionables (daño, velocidad, cadencia, multidisparo, perforación, vampirismo…)
- 📱 **Soporte móvil completo** — joystick táctil virtual con movimiento analógico y auto-apuntado automático
- 🎨 **Interfaz moderna** — dark mode, partículas animadas, transiciones suaves y HUD en tiempo real

---

## 🕹️ Controles

| Acción | Teclado / Ratón | Móvil |
|--------|----------------|-------|
| Mover | `WASD` o flechas | Joystick táctil |
| Disparar | Click izquierdo | Auto-apuntado automático |

---

## 🚀 Despliegue con Vercel

El proyecto no tiene dependencias ni proceso de build, lo que lo hace ideal para Vercel.

1. Sube el proyecto a un repositorio de GitHub
2. Entra en [vercel.com](https://vercel.com) e importa el repositorio
3. En la configuración del proyecto, establece el **directorio raíz** como `js/`
4. Haz click en **Deploy** — Vercel detecta automáticamente que es un sitio estático

Cada push a `main` desplegará una nueva versión automáticamente.

### Ejecución local

También puedes ejecutarlo localmente sin ninguna instalación:

```bash
# Simplemente abre el archivo en tu navegador:
js/index.html
```

---

## 🗂️ Estructura

```
SurvivalGame/
└── js/
    └── index.html      # Todo el proyecto: HTML + CSS + JS en un único archivo
```

El código está organizado en secciones claramente comentadas:

1. Reset CSS y variables de diseño global
2. Sistema de pantallas (menú, configuración, simulación, arcade)
3. Lógica de simulación — clases del dominio + canvas game loop
4. Mini-juego arcade — oleadas, power-ups y controles táctiles

---

## 🛣️ Roadmap

- [ ] Tabla de récords local con `localStorage`
- [ ] Efectos de sonido con Web Audio API
- [ ] Pantalla de victoria en la simulación
- [ ] Dash del jugador (Shift / doble tap)

---

## 👤 Autor

Desarrollado por **CurroPG** — [github.com/CurroPG/SurvivalGameJava](https://github.com/CurroPG/SurvivalGameJava)