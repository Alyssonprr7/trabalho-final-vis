import * as d3 from 'd3';

// export async function loadChartQuestion2(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
//     const treatedData = data.map(d => ({ x: d.hour, y: d.tip_amount }));
//     plotBarChart(treatedData, margens, { x: 'Hora do dia', y: 'Gorjeta ($)' }, 'steelblue');
// }

// export async function loadChartQuestion1(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
//     const treatedData = data.map(d => ({ x: d.day_type, y: d.trip_distance }));
//     plotBarChart(treatedData, margens, { x: 'Dia', y: 'Média da distância (Milhas)' }, 'steelblue');
// }

export async function loadChartMetacritic(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
    const treatedData = data.map(d => ({ x: Number(d.metacritic_score), y: Number(d.average_playtime_forever), name: d.name }));
    plotScatterPlot(treatedData, margens, {x: 'Avaliação', y: 'Tempo jogado (h)', name: "Nome"});
}

export async function loadChartBubble(data, margens = { left: 75, right: 50, top: 50, bottom: 75 }) {
    const treatedData = data.map(d => ({ x: treatOwners(d.estimated_owners)/10000, y: Number(d.price), r: Number(d.average_playtime_forever), name: d.name }));
    console.log(treatedData);
    plotBubbleChart(treatedData, margens, {x: 'Quantidade de vendas (em milhares)', y: 'Média do preço ($)', r: "Tempo jogado (h)"});
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
        .attr("y", 60)
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "1.5em")
        .text(labels.x);

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
        .attr('fill', barColor);

    bars.exit()
        .remove();

    bars
        .attr('x', d => mapX(d.x))
        .attr('y', d => mapY(d.y))
        .attr('width', mapX.bandwidth())
        .attr('height', d => svgHeight - mapY(d.y))
        .attr('fill', barColor);

    d3.select('#group')
        .attr('transform', `translate(${margens.left}, ${margens.top})`);
}


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
    const group = svg.selectAll('#group').data([0])
        .join('g')
        .attr('id', 'group')
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
  const group = svg.selectAll('#group').data([0])
    .join('g')
    .attr('id', 'group')
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


export function clearChart() {
    d3.select('#group')
        .selectAll('rect')
        .remove();

    d3.select('#group2')
        .selectAll('.line')
        .remove();

    d3.select('#group2')
        .selectAll('text')
        .remove();

    d3.select('#axisX')
        .selectAll('*')
        .remove();

    d3.select('#axisY')
        .selectAll('*')
        .remove();

    d3.select('#group2')
        .selectAll('*')
        .remove();
    }