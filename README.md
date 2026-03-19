<h1 id="title" align="center">Precio gasolina</h1>

<p align="center"><img src="https://socialify.git.ci/soker90/precio-gasolina/image?description=1&amp;descriptionEditable=Notifica%20cambios%20de%20precios%20de%20una%20gasolinera&amp;font=KoHo&amp;language=1&amp;owner=1&amp;pattern=Brick%20Wall&amp;theme=Light" alt="project-image"></p>

<p id="description">Este bot notifica a través de Telegram cuando varía el precio de la gasolina 95 y del gasóleo A de dos gasolineras en Alcázar de San Juan. Los precios se muestran también en una web pública con gráficos históricos.</p>

<p align="center"><img src="https://img.shields.io/github/license/soker90/precio-gasolina" alt="shields"><img src="https://img.shields.io/github/last-commit/soker90/precio-gasolina?label=%C3%9Altima%20actualizaci%C3%B3n" alt="shields"></p>

<h2>Características</h2>

<ul>
  <li>Descarga diaria automática de precios desde <a href="https://geoportalgasolineras.es">geoportalgasolineras.es</a></li>
  <li>Soporte para dos gasolineras simultáneamente</li>
  <li>Notificaciones por Telegram con el precio actual, la variación y un gráfico combinado de ambas gasolineras</li>
  <li>Web pública con gráficos históricos de gasolina y diesel por gasolinera, publicada en GitHub Pages</li>
  <li>Los datos se guardan en JSON y se commitean automáticamente al repositorio</li>
</ul>

<h2>Project Screenshots:</h2>

<img src="https://raw.githubusercontent.com/soker90/precio-gasolina/master/screenshot.png" alt="project-screenshot" width="400" height="400/">

<h2>🛠️ Installation Steps:</h2>

<p>1. Crea un fork de este repositorio.</p>

<p>2. Ve a <a href="https://geoportalgasolineras.es">geoportalgasolineras.es</a> y localiza tu gasolinera.</p>

<p>3. Inspecciona la web y busca en las peticiones de red una con el formato:</p>

```
https://geoportalgasolineras.es/rest/FUEL_STATION_ID/busquedaEstacionPrecio
```

<p>4. Anota el <code>FUEL_STATION_ID</code> de cada gasolinera y actualiza los valores en <code>.github/workflows/download-today.yml</code>:</p>

```yaml
- name: Descarga gasolinera Barataria
  env:
    FUEL_STATION_ID: TU_ID_1

- name: Descarga gasolinera Plaza de Toros
  env:
    FUEL_STATION_ID: TU_ID_2
    DATA_FILE: ./data-5143.json
```

<p>También puedes cambiar los nombres de las gasolineras en el step de envío a Telegram:</p>

```yaml
- name: Send to telegram
  env:
    STATION_NAME_1: Nombre gasolinera 1
    STATION_NAME_2: Nombre gasolinera 2
```

<p>5. Crea un bot de Telegram hablando con <a href="https://t.me/BotFather">@BotFather</a> y guarda el token que te proporciona.</p>

<p>6. Crea un secret de GitHub llamado <code>TOKEN_TELEGRAM</code> con ese token.</p>

<p>7. Crea uno o dos canales de Telegram (gasolina y gasoil) y consigue sus chat ID:</p>

```
Puedes conseguirlo reenviando un mensaje escrito en ese canal al bot @getidsbot.
También puedes abrir un chat directamente con el bot creado en el paso anterior.
```

<p>8. Crea los secrets <code>GASOLINA_CHAT_ID</code> y <code>DIESEL_CHAT_ID</code> con los chat IDs del paso anterior.</p>

<p>9. Activa GitHub Pages en la configuración del repositorio apuntando a la rama <code>master</code> para publicar la web con los gráficos.</p>

<h2>📁 Estructura de ficheros</h2>

| Fichero | Descripción |
|---|---|
| `download.mjs` | Descarga el precio actual de una gasolinera y lo guarda en el JSON |
| `sendToTelegram.js` | Envía notificaciones a Telegram con el precio y el gráfico |
| `generateChart.js` | Genera la URL del gráfico combinado de dos gasolineras via QuickChart |
| `fileUtils.js` | Utilidades de lectura/escritura de ficheros JSON |
| `data.json` | Histórico de precios de la gasolinera 1 |
| `data-5143.json` | Histórico de precios de la gasolinera 2 |
| `index.html` | Web pública con gráficos históricos |
| `.github/workflows/download-today.yml` | Action que ejecuta la descarga y el envío diariamente |

<h2>💻 Built with</h2>

Technologies used in the project:

* Node.js >= 18
* GitHub Actions
* GitHub Pages
* Chart.js
* QuickChart
* node-telegram-bot-api

<h2>🛡️ License:</h2>

This project is licensed under the GPLv3 or later
