# Quiz Musical

Aplicación local para un concurso musical con una pantalla pública y una controladora de backstage.

## Requisitos

- Bun instalado: https://bun.sh
- Navegador actualizado.

## Ejecutar en Windows

1. Descomprime la carpeta.
2. Ejecuta `start.bat`.
3. Abre la pantalla del público en `http://localhost:3000`.
4. Abre la controladora en `http://localhost:3000/controller.html`.

Si no se abre automáticamente, ejecuta `bun run server.js` en una terminal dentro de esta carpeta.

## Flujo del juego

- Pulsa **Iniciar primera ronda**.
- Se muestra el título de la película y se intenta reproducir el audio.
- Después de los segundos configurados aparece la pregunta.
- La pregunta permanece en pantalla hasta que pulses **Siguiente pregunta**.
- Puedes seleccionar cualquier pregunta de la lista para saltar directamente a ella.

## Añadir canciones

Guarda archivos de audio propios o que tengas permiso de reproducir en `media/`:

- `media/song-01.mp3`
- `media/song-02.mp3`
- ...
- `media/song-25.mp3`

Edita `questions.js` para cambiar las rutas, preguntas, respuestas, películas o emojis. Los audios no se incluyen en el proyecto.

## Publicar en GitHub

Crea el repositorio `quiz-musical`, coloca todos estos archivos en la raíz y haz commit. Este proyecto es independiente de `La-Mezcla-Perfecta`.

## Nota técnica

La sincronización se hace con Server-Sent Events. El navegador de la pantalla pública y la controladora deben acceder al mismo servidor. Para usarlo en dos dispositivos, ambos deben estar en la misma red y el puerto 3000 debe ser accesible.
