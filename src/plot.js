import * as d3 from 'd3';
import { getGamesByGenre } from './services/longevityService';

export async function loadChartBar(data, callBack) {
    //Se tem callback é o caso de ser agrupado por genero
    if(callBack) {
      const treatedData = data.map(d => ({ x: d.genre, yBar: Number(d.avg_estimated_owners), yLine: Number(d.peak_ccu) }));
      plotBarChartWithLine(treatedData, { left: 90, right: 90, top: 50, bottom: 150 }, { x: 'Gênero', yLeft: 'Média da quantidade de vendas', yRight: "Pico de usuários simultâneos" }, 'steelblue',"orange", callBack);
    } else {
      const treatedData = data.map(d => ({ x: d.name, yBar: Number(d.avg_estimated_owners), yLine: Number(d.peak_ccu) }));
      plotBarChartWithLine(treatedData, { left: 90, right: 90, top: 50, bottom: 150 }, { x: 'Nome', yLeft: 'Média da quantidade de vendas', yRight: "Pico de usuários simultâneos" }, 'teal', 'mediumpurple', callBack);
    }
}

export async function loadChartScatter(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
    const treatedData = data.map(d => ({ x: Number(d.metacritic_score), y: Number(d.average_playtime_forever), name: d.name }));
    plotScatterPlot(treatedData, margens, {x: ' Avaliação da crítica especializada', y: 'Horas totais jogadas', name: "Nome"});
}

export async function loadChartBubble(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
    const treatedData = data.map(d => ({ x: treatOwners(d.estimated_owners), y: Number(d.price), r: Number(d.average_playtime_forever), name: d.name }));
    console.log(treatedData);
    plotBubbleChart(treatedData, margens, {x: 'Média de quantidade de vendas', y: 'Média do preço ($)', r: "Horas totais jogadas"});
}

export async function loadGenreRentationChart(data, games, margens = { left: 90, right: 90, top: 50, bottom: 150 }) {
    const treatedData = data.map(d => ({ x: d.genre, yBar: Number(d.tempo_medio_jogado_horas), yLine: Number(d.tempo_medio_jogado_horas) }))
        .sort((a, b) => a.x.localeCompare(b.x)); // Ordenar alfabeticamente por gênero
    plotBarChartWithLine(treatedData, margens, { x: 'Gênero', yLeft: 'Tempo médio jogado (horas)', yRight: 'Tempo médio jogado (horas)'}, 'steelblue', 'orange', async (genre) => {
        // Ao clicar na barra, buscar os jogos do gênero e mostrar o gráfico horizontal
        const gamesData = await getGamesByGenre(games, genre);
        plotGamesDetailChart(gamesData, genre);
    });
}

export async function loadPriceTimePieChart(data, getGamesByPriceRange, margens = { left: 120, right: 50, top: 50, bottom: 50 }) {
    const treatedData = data.map(d => ({ 
        label: d.faixa_preco, 
        value: Number(d.media_horas_jogadas),
        quantidade_jogos: Number(d.quantidade_jogos)
    }));
    plotHorizontalBarChart(treatedData, margens, getGamesByPriceRange);
}

export async function loadCriticRentationLineChart(data, margens = { left: 90, right: 90, top: 50, bottom: 150 }) {
  // Mapeamento de nomes das faixas
    const nomeMapping = {
        'Excelente (90-100)': 'Excelente',
        'Muito Bom (80-89)': 'Muito Bom', 
        'Bom (70-79)': 'Bom',
        'Regular (60-69)': 'Regular',
        'Ruim (< 60)': 'Ruim'
    };    
  
  const treatedData = data.map(d => ({ 
        x: nomeMapping[d.faixa_avaliacao], 
        y: Number(d.media_horas_jogadas),
        metacritic: Number(d.media_metacritic)
    }));
    plotLineChartWithDualAxis(treatedData, margens, {x: 'Faixa de Avaliação', y: 'Média de Horas Jogadas' });
}

export async function loadChartPlaytimeByMode(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
    const treatedData = data.map(d => ({
        x: d.mode,
        y: Number(d.avg_playtime_hours)
    }));

    plotBarChart(treatedData, margens, {
        x: '',
        y: 'Tempo médio de jogo (h)'
    }, 'seagreen');
}

export async function loadChartPriceRangeByMode(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
  console.log("Dados tratados para faixa de preço:", data);

  const treatedData = data.map(d => {
  const group = d.price_range;
  const category = d.mode;
  const value = Number(d.quantidade);

  if (isNaN(value)) {
    console.warn(`Valor inválido para ${group} - ${category}:`, d.quantidade);
  }

  value: isNaN(Number(d.quantidade)) ? 0 : Number(d.quantidade)

  return { group, category, value };
}).filter(d => !isNaN(d.value));

  plotGroupedBarChart(treatedData, margens, {
    x: 'Faixa de preço',
    y: 'Quantidade de jogos'
  }, { 'Single Player': 'steelblue', 'Multiplayer': 'seagreen' });
}

export async function loadChartRatingByMode(data, margens = { left: 50, right: 50, top: 50, bottom: 50 }) {
  console.log("Dados tratados para feedback por modo:", data);

  const treatedData = [];

  data.forEach(d => {
    const mode = d.mode;
    const positives = Number(d.total_positives);
    const negatives = Number(d.total_negatives);

    if (isNaN(positives + negatives) || positives + negatives === 0) {
      console.warn(`Modo ${mode} ignorado por falta de avaliações ou valores inválidos.`);
      return;
    }

    treatedData.push({ mode, type: "Positive", value: positives });
    treatedData.push({ mode, type: "Negative", value: negatives });
  });

  plotPieChart(treatedData, margens);
}


const treatOwners = (owners) => {
    const inferior = owners.split('-')[0];
    const superior = owners.split('-')[1];
    return (Number(superior) - Number(inferior))/2;
}

const plotBarChart = (data, margens = { left: 75, right: 50, top: 50, bottom: 75 }, labels, barColor) => {
    const svg = d3.select('svg');

    if (!svg) {
        return;
    }

    const svgWidth = +svg.style("width").split("px")[0] - margens.left - margens.right
    const svgHeight = +svg.style("height").split("px")[0] - margens.top - margens.bottom;

    // ---- Escalas
    const mapX = d3.scaleBand()
        .domain(data.map(d => d.x))
        .range([0, svgWidth])
        .padding(0.1);

    const tipExtent = d3.extent(data, d => d.y);
    const maxTip = tipExtent[1];
    const mapY = d3.scaleLinear()
        .domain([0, maxTip]) 
        .range([svgHeight, 0]); // O eixo é invertido

    // ---- Eixos
    const xAxis = d3.axisBottom(mapX);
    const groupX = svg.selectAll('#axisX').data([0]);

    groupX.join('g')
        .attr('id', 'axisX')
        .attr('class', 'x axis')
        .attr('transform', `translate(${margens.left}, ${+svg.style('height').split('px')[0] - margens.bottom})`)
        .call(xAxis)
        .append("text") // Label
        .attr("x", svgWidth / 2)
        .attr("y", 50)
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "1.5em")
        .text(labels.x);

    // Rotacionar texto do eixo X
    svg.select('#axisX')
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "1.2em")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em");

    const yAxis = d3.axisLeft(mapY);
    const groupY = svg.selectAll('#axisY').data([0]);

    groupY.join('g')
        .attr('id', 'axisY')
        .attr('class', 'y axis')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(svgHeight / 2))
        .attr("y", -70)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "1.5em")
        .style("fill", "black")
        .text(labels.y);

    const selection = svg.selectAll('#group').data([0]);
    const cGroup = selection.join('g')
            .attr('id', 'group');

    const bars = cGroup.selectAll('rect')
        .data(data);

    bars.enter()
        .append('rect')
        .attr('x', d => mapX(d.x))
        .attr('y', d => mapY(d.y))
        .attr('width', mapX.bandwidth()) 
        .attr('height', d => svgHeight - mapY(d.y))
        .attr('fill', barColor)
        .attr('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this).attr('stroke', barColor).attr('stroke-width', 2);
            d3.select('#tooltip')
                .style('display', 'block')
                .html(`
                    ${labels.x}: ${d.x}<br>
                    ${labels.y}: ${d.y.toFixed(2)}
                `);
        })
        .on('mousemove', function (event) {
            d3.select('#tooltip')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('stroke', null);
            d3.select('#tooltip').style('display', 'none');
        });

    bars.exit()
        .remove();

    bars
        .attr('x', d => mapX(d.x))
        .attr('y', d => mapY(d.y))
        .attr('width', mapX.bandwidth())
        .attr('height', d => svgHeight - mapY(d.y))
        .attr('fill', barColor)
        .attr('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this).attr('stroke', barColor).attr('stroke-width', 2);
            d3.select('#tooltip')
                .style('display', 'block')
                .html(`
                    ${labels.x}: ${d.x}<br>
                    ${labels.y}: ${d.y.toFixed(2)}
                `);
        })
        .on('mousemove', function (event) {
            d3.select('#tooltip')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('stroke', null);
            d3.select('#tooltip').style('display', 'none');
        });

    d3.select('#group')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);
}


const plotBarChartWithLine = (
  data,
  margens = { left: 75, right: 75, top: 50, bottom: 75 },
  labels = { x: 'Eixo X', yLeft: 'Valor de barras', yRight: 'Valor de linha' },
  barColor = 'steelblue',
  lineColor = 'orange',
  onClickBar

) => {
  const svg = d3.select('svg');
  if (!svg.node()) return;

  const svgWidth = +svg.style("width").replace("px", "") - margens.left - margens.right;
  const svgHeight = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

  const mapX = d3.scaleBand()
    .domain(data.map(d => d.x))
    .range([0, svgWidth])
    .padding(0.1);

  const maxYBar = d3.max(data, d => d.yBar);
  const maxYLine = d3.max(data, d => d.yLine);

  const scaleYBar = d3.scaleLinear()
    .domain([0, maxYBar])
    .range([svgHeight, 0]);

  const scaleYLine = d3.scaleLinear()
    .domain([0, maxYLine])
    .range([svgHeight, 0]);

  // Eixo X
  svg.selectAll('#axisX').data([0])
    .join('g')
    .attr('id', 'axisX')
    .attr('transform', `translate(${margens.left}, ${svgHeight + margens.top})`)
    .call(d3.axisBottom(mapX))
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 50)
    .style("text-anchor", "middle")
    .text(labels.x);

    svg.select('#axisX')
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "1.4em")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")

  // Eixo Y da esquerda (barras)
svg.selectAll('#axisYLeft').data([0])
  .join('g')
  .attr('id', 'axisYLeft')
  .attr('transform', `translate(${margens.left}, ${margens.top})`)
  .call(d3.axisLeft(scaleYBar))
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -svgHeight / 2)
  .attr("y", -75)
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .style("font-size", "1.4em")
  .style("fill", "black")
  .text(labels.yLeft || 'Eixo Y (esquerda)');

// Eixo Y da direita (linha)
svg.selectAll('#axisYRight').data([0])
  .join('g')
  .attr('id', 'axisYRight')
  .attr('transform', `translate(${svgWidth + margens.left}, ${margens.top})`)
  .call(d3.axisRight(scaleYLine))
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -svgHeight / 2)
  .attr("y", 50) // afasta do eixo
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .style("font-size", "1.4em")
  .style("fill", "black")
  .text(labels.yRight || 'Eixo Y (direita)');

  // Grupo geral
  const group = svg.selectAll('#groupCombined').data([0])
    .join('g')
    .attr('id', 'groupCombined')
    .attr('transform', `translate(${margens.left}, ${margens.top})`);

  // Barras
  const bars = group.selectAll('rect').data(data);

  bars.enter()
    .append('rect')
    .merge(bars)
    .attr('x', d => mapX(d.x))
    .attr('y', d => scaleYBar(d.yBar))
    .attr('width', mapX.bandwidth())
    .attr('height', d => svgHeight - scaleYBar(d.yBar))
    .attr('fill', barColor)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => {
      if (typeof onClickBar === 'function') {
        onClickBar(d.x);
      }
    })
      .on('mouseover', function (event, d) {
      d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
      d3.select('#tooltip')
        .style('display', 'block')
        .html(`
          ${labels.x}: ${d.x}<br>
          ${labels.yLeft}: ${d.yBar.toFixed(2)}
        `);
    })
    .on('mousemove', function (event) {
      d3.select('#tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function () {
      d3.select(this).attr('stroke', null);
      d3.select('#tooltip').style('display', 'none');
    });
    

  // Linha
  const line = d3.line()
    .x(d => mapX(d.x) + mapX.bandwidth() / 2)
    .y(d => scaleYLine(d.yLine));

  const path = group.selectAll('.line-path').data([data]);

  path.enter()
    .append('path')
    .attr('class', 'line-path')
    .merge(path)
    .attr('fill', 'none')
    .attr('stroke', lineColor)
    .attr('stroke-width', 2)
    .attr('d', line);

  // path.exit().remove();
};


const plotScatterPlot = (data, margens, labels, pointColor = "steelblue") => {
    const svg = d3.select('svg');
    if (!svg) return;

    const svgWidth = +svg.style("width").split("px")[0] - margens.left - margens.right;
    const svgHeight = +svg.style("height").split("px")[0] - margens.top - margens.bottom;

    // ---- Escalas
    const extentX = d3.extent(data, d => d.x);
    const extentY = d3.extent(data, d => d.y);

    const mapX = d3.scaleLinear()
        .domain([extentX[0], extentX[1]])
        .range([0, svgWidth]);

    const mapY = d3.scaleLinear()
        .domain([extentY[0], extentY[1]])
        .range([svgHeight, 0]); // eixo invertido

    // ---- Eixos
    const xAxis = d3.axisBottom(mapX);
    const yAxis = d3.axisLeft(mapY);

    svg.selectAll('#axisX').data([0])
        .join('g')
        .attr('id', 'axisX')
        .attr('class', 'x axis')
        .attr('transform', `translate(${margens.left}, ${svgHeight + margens.top})`)
        .call(xAxis)
        .append("text")
        .attr("x", svgWidth / 2)
        .attr("y", 60)
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "1.5em")
        .text(labels.x);

    svg.selectAll('#axisY').data([0])
        .join('g')
        .attr('id', 'axisY')
        .attr('class', 'y axis')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(svgHeight / 2))
        .attr("y", -70)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "1.5em")
        .style("fill", "black")
        .text(labels.y);

    // ---- Círculos (scatter plot)
    const group = svg.selectAll('#groupScatter').data([0])
        .join('g')
        .attr('id', 'groupScatter')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);

    const points = group.selectAll('circle').data(data);

const tooltip = d3.select("#tooltip");

points.enter()
    .append('circle')
    .attr('cx', d => mapX(d.x))
    .attr('cy', d => mapY(d.y))
    .attr('r', 5)
    .attr('fill', pointColor)
    .on('mouseover', function (event, d) {
        tooltip.style('display', 'block')
               .html(`${labels.name}: ${d.name}<br>${labels.x}: ${d.x}<br>${labels.y}: ${d.y}`);
        d3.select(this).attr('r', 8); // aumenta o ponto no hover
    })
    .on('mousemove', function (event) {
        tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function () {
        tooltip.style('display', 'none');
        d3.select(this).attr('r', 5);
    });

    points
        .attr('cx', d => mapX(d.x))
        .attr('cy', d => mapY(d.y))
        .attr('r', 5)
        .attr('fill', pointColor);

    points.exit().remove();
};

const plotHorizontalBarChart = (data, margens = { left: 120, right: 50, top: 50, bottom: 50 }, getGamesByPriceRange) => {
  const svg = d3.select('svg');
  if (!svg.node()) return;

  const svgWidth = +svg.style("width").replace("px", "") - margens.left - margens.right;
  const svgHeight = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

  // Limpar gráfico anterior
  svg.selectAll('#horizontalBarGroup').remove();

  // Escala de cores
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.label))
    .range(d3.schemeCategory10);

  // Escalas
  const yScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, svgHeight])
    .padding(0.1);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([0, svgWidth]);

  // Eixos
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // Eixo X
  svg.selectAll('#axisX').data([0])
    .join('g')
    .attr('id', 'axisX')
    .attr('transform', `translate(${margens.left}, ${svgHeight + margens.top})`)
    .call(xAxis)
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 40)
    .style("text-anchor", "middle")
    .style("fill", "black")
    .style("font-size", "1.2em")
    .text("Média de Horas Jogadas");

  // Eixo Y
  svg.selectAll('#axisY').data([0])
    .join('g')
    .attr('id', 'axisY')
    .attr('transform', `translate(${margens.left}, ${margens.top})`)
    .call(yAxis);

  // Tooltip
  const tooltip = d3.select('#tooltip');
  if (tooltip.empty()) {
    d3.select('body').append('div')
      .attr('id', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0,0,0,0.75)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '0.85em')
      .style('pointer-events', 'none')
      .style('display', 'none');
  }

  // Grupo das barras
  const group = svg.selectAll('#horizontalBarGroup').data([0])
    .join('g')
    .attr('id', 'horizontalBarGroup')
    .attr('transform', `translate(${margens.left}, ${margens.top})`);

  // Barras
  const bars = group.selectAll('rect').data(data);

  bars.enter()
    .append('rect')
    .attr('y', d => yScale(d.label))
    .attr('x', 0)
    .attr('width', d => xScale(d.value))
    .attr('height', yScale.bandwidth())
    .attr('fill', d => color(d.label))
    .attr('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
      
      d3.select('#tooltip')
        .style('display', 'block')
        .html(`
          <strong>${d.label}</strong><br>
          Quantidade: ${d.quantidade_jogos} jogos<br>
          Média de horas: ${d.value.toFixed(2)} horas
        `);
    })
    .on('mousemove', function(event) {
      d3.select('#tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke', null);
      d3.select('#tooltip').style('display', 'none');
    });

  bars
    .attr('y', d => yScale(d.label))
    .attr('width', d => xScale(d.value))
    .attr('height', yScale.bandwidth());

  // bars.exit().remove();

  // Labels nas barras
  const labels = group.selectAll('text').data(data);

  labels.enter()
    .append('text')
    .attr('x', d => xScale(d.value) + 5)
    .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '0.9em')
    .style('font-weight', 'bold')
    .style('fill', 'white')
    .text(d => `${d.value.toFixed(1)}h`);

  labels
    .attr('x', d => xScale(d.value) + 5)
    .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
    .text(d => `${d.value.toFixed(1)}h`);

  // labels.exit().remove();
};

const plotGamesDetailChart = (data, faixaPreco, margens = { left: 150, right: 50, top: 80, bottom: 50 }) => {
  const svg = d3.select('svg');
  if (!svg.node()) return;

  // Limpar tudo antes de desenhar o novo gráfico
  clearChart();

  const svgWidth = +svg.style("width").replace("px", "") - margens.left - margens.right;
  const svgHeight = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

  // // Limpar gráfico anterior completamente
  svg.selectAll('#horizontalBarGroup').remove();
  svg.selectAll('#gamesDetailGroup').remove();
  svg.selectAll('#detailTitle').remove();
  
  // Limpar eixos anteriores
  svg.selectAll('#axisX').selectAll('*').remove();
  svg.selectAll('#axisY').selectAll('*').remove();

  // Escalas
  const yScale = d3.scaleBand()
    .domain(data.map(d => d.nome))
    .range([0, svgHeight])
    .padding(0.2);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.tempo_medio_horas)])
    .range([0, svgWidth]);

  // Eixos
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // Eixo X
  svg.selectAll('#axisX').data([0])
    .join('g')
    .attr('id', 'axisX')
    .attr('transform', `translate(${margens.left}, ${svgHeight + margens.top})`)
    .call(xAxis)
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 40)
    .style("text-anchor", "middle")
    .style("fill", "black")
    .style("font-size", "1.2em")
    .text("Tempo Médio (horas)");

  // Eixo Y
  svg.selectAll('#axisY').data([0])
    .join('g')
    .attr('id', 'axisY')
    .attr('transform', `translate(${margens.left}, ${margens.top})`)
    .call(yAxis);

  // Título
  svg.selectAll('#detailTitle').data([0])
    .join('text')
    .attr('id', 'detailTitle')
    .attr('x', margens.left + svgWidth / 2)
    .attr('y', margens.top - 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.4em')
    .style('font-weight', 'bold')
    .style('fill', '#2C3E50')
    .text(`Top 5 Jogos - ${faixaPreco}`);

  // Grupo das barras
  const group = svg.selectAll('#gamesDetailGroup').data([0])
    .join('g')
    .attr('id', 'gamesDetailGroup')
    .attr('transform', `translate(${margens.left}, ${margens.top})`);

  // Barras
  const bars = group.selectAll('rect').data(data);

  bars.enter()
    .append('rect')
    .attr('y', d => yScale(d.nome))
    .attr('x', 0)
    .attr('width', d => xScale(d.tempo_medio_horas))
    .attr('height', yScale.bandwidth())
    .attr('fill', '#3498DB')
    .attr('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
      
      d3.select('#tooltip')
        .style('display', 'block')
        .html(`
          <strong>${d.nome}</strong><br>
          Tempo médio: ${d.tempo_medio_horas.toFixed(2)} horas
        `);
    })
    .on('mousemove', function(event) {
      d3.select('#tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke', null);
      d3.select('#tooltip').style('display', 'none');
    });

  bars
    .attr('y', d => yScale(d.nome))
    .attr('width', d => xScale(d.tempo_medio_horas))
    .attr('height', yScale.bandwidth());

  // bars.exit().remove();

  // Labels nas barras
  const labels = group.selectAll('text').data(data);

  labels.enter()
    .append('text')
    .attr('x', d => xScale(d.tempo_medio_horas) + 5)
    .attr('y', d => yScale(d.nome) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '0.9em')
    .style('font-weight', 'bold')
    .style('fill', 'white')
    .text(d => `${d.tempo_medio_horas.toFixed(1)}h`);

  labels
    .attr('x', d => xScale(d.tempo_medio_horas) + 5)
    .attr('y', d => yScale(d.nome) + yScale.bandwidth() / 2)
    .text(d => `${d.tempo_medio_horas.toFixed(1)}h`);

  // labels.exit().remove();
};

const plotLineChartWithDualAxis = (data, margens = { left: 75, right: 75, top: 50, bottom: 75 }, labels, lineColor = "steelblue") => {
    const svg = d3.select('svg');
    if (!svg.node()) return;

    const svgWidth = +svg.style("width").replace("px", "") - margens.left - margens.right;
    const svgHeight = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

    // Escalas
    const mapX = d3.scaleBand()
        .domain(data.map(d => d.x))
        .range([0, svgWidth])
        .padding(0.1);

    const yExtent = d3.extent(data, d => d.y);
    
    const mapY = d3.scaleLinear()
        .domain([0, yExtent[1]])
        .range([svgHeight, 0]);

    // Eixo X
    const xAxis = d3.axisBottom(mapX);
    const groupX = svg.selectAll('#axisX').data([0]);

    groupX.join('g')
        .attr('id', 'axisX')
        .attr('class', 'x axis')
        .attr('transform', `translate(${margens.left}, ${svgHeight + margens.top})`)
        .call(xAxis)

    // Rotacionar texto do eixo X
    svg.select('#axisX')
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "1.2em")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em");

    svg.append('text')
        .attr("id", "xAxisLabel")
        .attr("x", margens.left + svgWidth / 2)
        .attr("y", svgHeight + margens.top + 115)
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "1.2em")
        .text("Avaliação da Crítica");

    // Eixo Y da esquerda (horas jogadas)
    const yAxis = d3.axisLeft(mapY);
    const groupY = svg.selectAll('#axisY').data([0]);

    groupY.join('g')
        .attr('id', 'axisY')
        .attr('class', 'y axis')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(svgHeight / 2))
        .attr("y", -70)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "1.5em")
        .style("fill", "black")
        .text(labels.y);

    // Tooltip
    const tooltip = d3.select('#tooltip');
    if (tooltip.empty()) {
        d3.select('body').append('div')
            .attr('id', 'tooltip')
            .style('position', 'absolute')
            .style('padding', '8px')
            .style('background', 'rgba(0,0,0,0.75)')
            .style('color', 'white')
            .style('border-radius', '4px')
            .style('font-size', '0.85em')
            .style('pointer-events', 'none')
            .style('display', 'none');
    }

    // Grupo da linha
    const group = svg.selectAll('#groupLine').data([0])
        .join('g')
        .attr('id', 'groupLine')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);

    // Função para gerar a linha (horas jogadas)
    const line = d3.line()
        .x(d => mapX(d.x) + mapX.bandwidth() / 2)
        .y(d => mapY(d.y))
        .curve(d3.curveMonotoneX);

    // Desenhar a linha
    group.selectAll('#line').data([data])
        .join('path')
        .attr('id', 'line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 3);

    // Adicionar pontos na linha
    const points = group.selectAll('circle').data(data);

    points.enter()
        .append('circle')
        .attr('cx', d => mapX(d.x) + mapX.bandwidth() / 2)
        .attr('cy', d => mapY(d.y))
        .attr('r', 6)
        .attr('fill', lineColor)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this).attr('r', 8);
            d3.select('#tooltip')
                .style('display', 'block')
                .html(`
                    ${labels.x}: ${d.x}<br>
                    ${labels.y}: ${d.y.toFixed(2)}h<br>
                    Média Metacritic: ${d.metacritic.toFixed(1)}
                `);
        })
        .on('mousemove', function (event) {
            d3.select('#tooltip')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('r', 6);
            d3.select('#tooltip').style('display', 'none');
        });

    points
        .attr('cx', d => mapX(d.x) + mapX.bandwidth() / 2)
        .attr('cy', d => mapY(d.y));
}

const plotBubbleChart = (
  data,
  margins = { left: 75, right: 50, top: 50, bottom: 75 },
  labels = { x: 'Eixo X', y: 'Eixo Y' },
  colors = { fill: 'steelblue', stroke: 'black' }
) => {
  const svg = d3.select('svg');
  if (!svg.node()) return;

  const svgWidth = +svg.style("width").replace("px", "") - margins.left - margins.right;
  const svgHeight = +svg.style("height").replace("px", "") - margins.top - margins.bottom;

  // Escalas
  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);
  const rExtent = d3.extent(data, d => d.r);

  const scaleX = d3.scaleLinear().domain(xExtent).range([0, svgWidth]).nice();
  const scaleY = d3.scaleLinear().domain(yExtent).range([svgHeight, 0]).nice();
  const scaleR = d3.scaleSqrt().domain(rExtent).range([4, 40]);

  // Eixos
  svg.selectAll('#axisX').data([0]).join('g')
    .attr('id', 'axisX')
    .attr('transform', `translate(${margins.left}, ${svgHeight + margins.top})`)
    .call(d3.axisBottom(scaleX))
    .append('text')
    .attr('x', svgWidth / 2)
    .attr('y', 50)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .style('font-size', '1.2em')
    .text(labels.x);

  svg.selectAll('#axisY').data([0]).join('g')
    .attr('id', 'axisY')
    .attr('transform', `translate(${margins.left}, ${margins.top})`)
    .call(d3.axisLeft(scaleY))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -svgHeight / 2)
    .attr('y', -50)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .style('font-size', '1.2em')
    .text(labels.y);

  // Tooltip
  const tooltip = d3.select('#tooltip');
  if (tooltip.empty()) {
    d3.select('body').append('div')
      .attr('id', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0,0,0,0.75)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '0.85em')
      .style('pointer-events', 'none')
      .style('display', 'none');
  }

  // Grupo de círculos
  const group = svg.selectAll('#groupBubble').data([0])
    .join('g')
    .attr('id', 'groupBubble')
    .attr('transform', `translate(${margins.left}, ${margins.top})`);

  const bubbles = group.selectAll('circle').data(data);

  bubbles.enter()
    .append('circle')
    .attr('cx', d => scaleX(d.x))
    .attr('cy', d => scaleY(d.y))
    .attr('r', d => scaleR(d.r))
    .attr('fill', colors.fill)
    .attr('opacity', 0.7)
    .on('mouseover', function (event, d) {
      d3.select(this).attr('stroke', colors.stroke).attr('stroke-width', 1.5);
      d3.select('#tooltip')
        .style('display', 'block')
        .html(`
          ${labels.x}: ${d.x.toFixed(2)}<br>
          ${labels.y}: ${d.y.toFixed(2)}<br>
          ${labels.r}: ${d.r.toFixed(2)}
        `);
    })
    .on('mousemove', function (event) {
      d3.select('#tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function () {
      d3.select(this).attr('stroke', null);
      d3.select('#tooltip').style('display', 'none');
    });

  bubbles
    .attr('cx', d => scaleX(d.x))
    .attr('cy', d => scaleY(d.y))
    .attr('r', d => scaleR(d.r));

  bubbles.exit().remove();
};

const plotGroupedBarChart = (
  data, 
  margens = { left: 75, right: 50, top: 50, bottom: 75 },
  labels = { x: 'Faixa de preço', y: 'Quantidade de jogos' },
  colors = { 'Single Player': 'steelblue', 'Multiplayer': 'seagreen' }
) => {
  const svg = d3.select('svg');
  if (!svg.node()) return;

  const svgWidth = +svg.style("width").replace("px", "") - margens.left - margens.right;
  const svgHeight = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

  const groups = Array.from(new Set(data.map(d => d.group)));
  const categories = Array.from(new Set(data.map(d => d.category)));
  console.log("Groups:", groups);
  console.log("Categories:", categories);

  const mapX0 = d3.scaleBand()
    .domain(groups)
    .range([0, svgWidth])
    .padding(0.2);

  const mapX1 = d3.scaleBand()
    .domain(categories)
    .range([0, mapX0.bandwidth()])
    .padding(0.05);

  const maxValue = d3.max(data, d => d.value);
  const mapY = d3.scaleLinear()
    .domain([0, maxValue])
    .range([svgHeight, 0]);

  svg.selectAll('#axisX').data([0]).join('g')
    .attr('id', 'axisX')
    .attr('transform', `translate(${margens.left}, ${svgHeight + margens.top})`)
    .call(d3.axisBottom(mapX0))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end")
    .style("font-size", "1.3em");

  svg.selectAll('#axisY').data([0]).join('g')
    .attr('id', 'axisY')
    .attr('transform', `translate(${margens.left}, ${margens.top})`)
    .call(d3.axisLeft(mapY))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -svgHeight / 2)
    .attr("y", -70)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "1.5em")
    .style("fill", "black")
    .text(labels.y);

  const group = svg.selectAll('#groupGroupedBars').data([0]).join('g')
    .attr('id', 'groupGroupedBars')
    .attr('transform', `translate(${margens.left}, ${margens.top})`);

  const grouped = group.selectAll('g').data(groups).join('g')
    .attr('transform', d => `translate(${mapX0(d)}, 0)`);

  grouped.selectAll('rect').data(d =>
    categories.map(cat => {
      const entry = data.find(e => e.group === d && e.category === cat);
      return { category: cat, value: entry ? entry.value : 0 };
    })
  ).join('rect')
    .attr('x', d => mapX1(d.category))
    .attr('y', d => mapY(d.value))
    .attr('width', mapX1.bandwidth())
    .attr('height', d => svgHeight - mapY(d.value))
    .attr('fill', d => colors[d.category] || 'gray')
    .on('mouseover', function (event, d) {
      d3.select('#tooltip')
        .style('display', 'block')
        .html(`${d.category}<br>Quantidade: ${d.value}`);
    })
    .on('mousemove', function (event) {
      d3.select('#tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function () {
      d3.select('#tooltip').style('display', 'none');
    });

    // ---- Legenda
const legendData = [
  { label: 'Single Player', color: 'steelblue' },
  { label: 'Multiplayer', color: 'seagreen' }
];

const legend = svg.selectAll('#legendGroupedBars').data([0]).join('g')
  .attr('id', 'legendGroupedBars')
  .attr('transform', `translate(${svgWidth + margens.left - 300}, ${margens.top - 30})`);

legend.selectAll('rect')
  .data(legendData)
  .join('rect')
  .attr('x', (d, i) => i * 180)
  .attr('width', 18)
  .attr('height', 18)
  .attr('fill', d => d.color);

legend.selectAll('text')
  .data(legendData)
  .join('text')
  .attr('x', (d, i) => i * 180 + 24)
  .attr('y', 14)
  .style('font-size', '1.2em')
  .text(d => d.label);
};

const plotPieChart = (data, margens = { left: 50, right: 50, top: 50, bottom: 50 }) => {
  const svg = d3.select('svg');
  if (!svg.node()) return;

  svg.selectAll('*').remove(); // limpa qualquer gráfico anterior

  const width = +svg.style("width").replace("px", "") - margens.left - margens.right;
  const height = +svg.style("height").replace("px", "") - margens.top - margens.bottom;
  const radius = Math.min(width, height) / 2;

  const color = d3.scaleOrdinal()
    .domain(["Positive", "Negative"])
    .range(["seagreen", "crimson"]);

  const pieGenerator = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const modes = Array.from(new Set(data.map(d => d.mode)));

  modes.forEach((mode, i) => {
    const subset = data.filter(d => d.mode === mode);
    const pieData = pieGenerator(subset);
    const centerX = margens.left + (i + 1) * (width / (modes.length + 1));
    const centerY = margens.top + height / 2;

    const g = svg.append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    g.selectAll('path')
      .data(pieData)
      .join('path')
      .attr('d', arcGenerator)
      .attr('fill', d => color(d.data.type))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', (event, d) => {
        d3.select('#tooltip')
          .style('display', 'block')
          .html(`${mode} – ${d.data.type}: ${d.data.value}`);
      })
      .on('mousemove', event => {
        d3.select('#tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        d3.select('#tooltip').style('display', 'none');
      });

    g.selectAll('text')
      .data(pieData)
      .join('text')
      .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'white')
      .text(d => Math.round(100 * d.data.value / d3.sum(subset, s => s.value)) + '%');

    g.append('text')
      .attr('y', radius + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(mode);

      // Legenda
  const legendData = [
    { label: "Avaliações positivas", color: "seagreen" },
    { label: "Avaliações negativas", color: "crimson" }
  ];

  const legendGroup = svg.selectAll('#legend').data([0]).join('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${margens.left}, ${margens.top})`);

  legendGroup.selectAll('rect')
    .data(legendData)
    .join('rect')
    .attr('x', 0)
    .attr('y', (d, i) => i * 25)
    .attr('width', 18)
    .attr('height', 18)
    .attr('fill', d => d.color);

  legendGroup.selectAll('text')
    .data(legendData)
    .join('text')
    .attr('x', 25)
    .attr('y', (d, i) => i * 25 + 14)
    .style('font-size', '1.2em')
    .text(d => d.label);
  });
}

export function clearChart() {
    d3.select('svg').selectAll('*').remove();

    // Limpar gráfico de barras simples
    d3.select('#group')
        .selectAll('*')
        .remove();

    // Limpar gráfico de barras com linha
    d3.select('#groupCombined')
        .selectAll('*')
        .remove();
        
    // Limpar labels das barras
    d3.selectAll('.bar-label')
        .remove();

    // Limpar gráfico de bolhas
    d3.select('#groupBubble')
        .selectAll('*')
        .remove();
        
    // Limpar gráfico de dispersão
    d3.select('#groupScatter')
        .selectAll('*')
        .remove();
        
    // Limpar gráfico de barras horizontal
    d3.select('#horizontalBarGroup')
        .remove();
        
    // Limpar gráfico de linha
    d3.select('#groupLine')
        .selectAll('*')
        .remove();
        
    d3.select('#xAxisLabel')
        .remove();
        
    // Limpar gráfico de detalhes dos jogos
    d3.select('#gamesDetailGroup')
        .remove();
        
    d3.select('#detailTitle')
        .remove();
        
    // Limpar eixos
    d3.select('#axisX')
        .selectAll('*')
        .remove();

    d3.select('#axisY')
        .selectAll('*')
        .remove();

    d3.select('#axisYRight')
        .selectAll('*')
        .remove();

    d3.select('#axisYLeft')
        .selectAll('*')
        .remove();

    // Esconder tooltip
    d3.select('#tooltip')
        .style('display', 'none');
    }