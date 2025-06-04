"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("cards-container");
  const urlJson = "data/file.json";
  let compañerosData = [];

  function renderCards(lista) {
    container.innerHTML = "";
    lista.forEach((compañero) => {
      const rawUsername = compañero.usernameGithub || "";
      const username = rawUsername.trim();
      if (username === "") return;
      const avatarUrl = `https://github.com/${username}.png`;
      const githubUrl = `https://github.com/${username}`;
      const nombre = compañero.student || "Sin nombre";
      const codigo = compañero.code || "—";
      const intensidad = compañero.intensity || "N/A";
      const promedioFinalEn5 = compañero.promedioFinalEn5.toFixed(2);

      const proyectosHtml = compañero.projects
        .map((proy) => {
          const scores = Array.isArray(proy.score) ? proy.score : [];
          const arregloScores = scores.length > 0 ? scores.join(", ") : "N/A";
          let puntajeEn5 = 0;
          if (proy.name === "bit-website") {
            const notaCruda = scores.length > 0 ? Number(scores[0]) : 0;
            puntajeEn5 = notaCruda;
          } else if (proy.name === "bit-1") {
            if (scores.length === 1) {
              const notaSobre10 = Number(scores[0]);
              puntajeEn5 = notaSobre10 / 2;
            } else if (scores.length > 1) {
              const sumatoria = scores.reduce((acc, s) => acc + Number(s), 0);
              const cantidadDeCriterios = scores.length;
              puntajeEn5 = (sumatoria / cantidadDeCriterios) * 5;
            } else {
              puntajeEn5 = 0;
            }
          }
          return `<li><strong>${proy.name}</strong>: ${arregloScores}</li>`;
        })
        .join("");

      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.innerHTML = `
        <img
          src="${avatarUrl}"
          alt="Avatar de ${nombre}"
          class="card__imagen"
        >
        <div class="card__contenido">
          <h3 class="card__titulo">${nombre}</h3>
          <p class="card__codigo">Código: ${codigo}</p>
          <p class="card__intensidad">Intensidad: ${intensidad}</p>
          <p class="card__subtitulo">Proyectos y notas:</p>
          <ul class="card__lista-proyectos">
            ${proyectosHtml}
            <li class="card__promedio"><strong>Promedio final (0–5):</strong> ${promedioFinalEn5}</li>
          </ul>
          <a
            href="${githubUrl}"
            target="_blank"
            class="btn btn--primario"
          >
            Ver GitHub
          </a>
        </div>
      `;
      container.appendChild(cardDiv);
    });
  }

  function crearFiltros() {
    const filtrosContainer = document.createElement("div");
    filtrosContainer.id = "filtros-container";
    filtrosContainer.innerHTML = `
      <input type="text" id="search-input" placeholder="Buscar por nombre" class="input--busqueda">
      <div id="botones-filtro">
        <button id="mostrar-todas" class="btn btn--filtro">Mostrar Todas</button>
        <button id="filtro-300" class="btn btn--filtro">Intensidad 300</button>
        <button id="filtro-400" class="btn btn--filtro">Intensidad 400</button>
        <button id="ranking-promedio" class="btn btn--filtro">Ranking Promedio ↓</button>
      </div>
    `;
    const introElem = document.querySelector(".intro");
    introElem.insertAdjacentElement("afterend", filtrosContainer);

    document.getElementById("search-input").addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtradosPorNombre = compañerosData.filter(c =>
        c.student.toLowerCase().includes(query)
      );
      renderCards(filtradosPorNombre);
    });

    document.getElementById("mostrar-todas").addEventListener("click", () => {
      document.getElementById("search-input").value = "";
      renderCards(compañerosData);
    });

    document.getElementById("filtro-300").addEventListener("click", () => {
      document.getElementById("search-input").value = "";
      const filtrados = compañerosData.filter(c => parseInt(c.intensity) === 300);
      renderCards(filtrados);
    });

    document.getElementById("filtro-400").addEventListener("click", () => {
      document.getElementById("search-input").value = "";
      const filtrados = compañerosData.filter(c => parseInt(c.intensity) === 400);
      renderCards(filtrados);
    });

    document.getElementById("ranking-promedio").addEventListener("click", () => {
      document.getElementById("search-input").value = "";
      const ordenados = [...compañerosData].sort((a, b) => b.promedioFinalEn5 - a.promedioFinalEn5);
      renderCards(ordenados);
    });
  }

  fetch(urlJson)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error al cargar JSON: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      compañerosData = data.map((compañero) => {
        let sumaProyectosEn5 = 0;
        let countProyectosValidos = 0;
        compañero.projects.forEach((proy) => {
          const scores = Array.isArray(proy.score) ? proy.score : [];
          let puntajeEn5 = 0;
          if (proy.name === "bit-website") {
            const notaCruda = scores.length > 0 ? Number(scores[0]) : 0;
            puntajeEn5 = notaCruda;
          } else if (proy.name === "bit-1") {
            if (scores.length === 1) {
              const notaSobre10 = Number(scores[0]);
              puntajeEn5 = notaSobre10 / 2;
            } else if (scores.length > 1) {
              const sumatoria = scores.reduce((acc, s) => acc + Number(s), 0);
              const cantidadDeCriterios = scores.length;
              puntajeEn5 = (sumatoria / cantidadDeCriterios) * 5;
            } else {
              puntajeEn5 = 0;
            }
          }
          sumaProyectosEn5 += puntajeEn5;
          countProyectosValidos++;
        });
        const promedioFinalEn5 = countProyectosValidos > 0
          ? sumaProyectosEn5 / countProyectosValidos
          : 0;
        return {
          ...compañero,
          promedioFinalEn5
        };
      });
      crearFiltros();
      renderCards(compañerosData);
    })
    .catch((error) => {
      console.error("Hubo un problema al cargar la lista:", error);
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: red;">
          <p>No se pudo cargar la lista de compañeros.</p>
        </div>
      `;
    });
});







