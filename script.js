const width = 900;
const height = 500;
const margin = {
    top: 10,
    bottom: 50,
    left: 50,
    right: 50,
};
const day_route = "data/day.json"
const weekday_route = "data/weekday.json"
const artist_route = "data/artist.json"  


// BUBBLES
// reference: https://bl.ocks.org/officeofjane/a70f4b44013d06b9c0a973f163d8ab7a

const height3 = 550

const centre = { 
    x: width/2, 
    y: height3/2 
};  

const svg3 = d3
    .select("#bubbles-container")
    .append("svg")
    .attr("id", "bubbles-graph")
    .attr("width", width)
    .attr("height", height3);


svg3
    .append("text")
    .text("Label")
    .attr("id", "label-bubbles")
    .attr("text-anchor", "end")
    .attr("font-size", 20)
    .attr("opacity", 0)
    .attr("transform", `translate(${width - margin.right}, ${margin.top + 10})`)

d3.json(artist_route).then( (data) => {
    const forceStrength = 0.03;
    const simulation = d3
        .forceSimulation()
        .force('charge', d3.forceManyBody())  
        .force('x', d3.forceX().strength(forceStrength).x(centre.x))
        .force('y', d3.forceY().strength(forceStrength).y(centre.y))
        .force('collision', d3.forceCollide().radius(d => d.radius + 0.5));
    simulation.stop();

    let rangeMsPlayed = d3.extent(data, (d) => d.msPlayed);
    const radiusScale = d3
        .scaleSqrt()
        .domain([0, rangeMsPlayed[1]])
        .range([0, 80]);

    const colorScale = d3
        .scaleLinear()
        .domain([rangeMsPlayed[0],rangeMsPlayed[1]])
        .interpolate(d3.interpolateRgb)
        .range(["black", "#1DB954"]);

    console.log(colorScale(6,5))
    
    const nodes = data.map( (d) => ({
        ...d,
        radius: radiusScale(d.msPlayed),
        size: d.msPlayed,
        x: Math.random() * 900,
        y: Math.random() * 400
    }));

    const elements = svg3
        .selectAll('.bubble')
        .data(nodes, (d) => d.artist)
        .enter()
        .append('g')

    const bubbles = elements
        .append('circle')
        .attr("class", 'bubble')
        .attr('r', (d) => d.radius)
        .attr('fill', "#1DB954");

    const labels = elements
        .append('text')
        .attr('dy', '.3em')
        .style('text-anchor', 'middle')
        .style('font-size', 10)
        .text((d) => d.artist);

    const ticked = () => {
        bubbles
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
  
        labels
            .attr('x', d => d.x)
            .attr('y', d => d.y)
    };
    
    simulation
        .nodes(nodes)
        .on('tick', ticked)
        .restart();

    bubbles
        .on("mouseenter", (event, d) => {
            svg3
                .select("#label-bubbles")
                .text(`Total time streamed: ${(d.msPlayed/(1000*60*60)).toFixed(2)}hrs`)
                .attr("opacity", 1);
        })
        .on("mouseleave", (event, d) => {
            svg3
                .select("#label-bubbles")
                .attr("opacity", 0)
                .text("")
        });
})


// DENSITY GRAPH
// reference --> https://www.d3-graph-gallery.com/graph/density_basic.html
const svg1 = d3
    .select("#day-container")
    .append("svg")
    .attr("id", "day-graph")
    .attr("width", width)
    .attr("height", height);

svg1
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width - margin.right - margin.left)
    .attr("height", height - margin.top - margin.bottom);

const containerAxisX = svg1
    .append("g")
    .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`);

const containerAxisY = svg1
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const containerGraph = svg1 
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .attr("clip-path","url(#clip)");

svg1
    .append("text")
    .text("Date (Month-day)")
    .attr("text-anchor", "middle")
    .attr("font-size", 13)
    .attr("transform", `translate(${width/2}, ${height - margin.bottom + 40})`);

svg1
    .append("text")
    .text("Time streaming (hours)")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", margin.left - 25)
    .attr("text-anchor", "middle")
    .style("font-size", 13);


d3.json(day_route).then( (data) => {
    const rangeDate = d3.extent(data, d => new Date(d.day));
    const rangemsPlayed = d3.extent(data, d => d.msPlayed/(1000*60*60));
    const scaleAxisX = d3
        .scaleTime()
        .domain([rangeDate[0], rangeDate[1]])
        .range([0, width - margin.right - margin.left]);
    const AxisX = d3.axisBottom(scaleAxisX).tickFormat(d3.timeFormat("%b-%d"));
    containerAxisX
        .call(AxisX);
    const scaleAxisY = d3
        .scaleLinear()
        .domain([0, rangemsPlayed[1]])
        .range([height- margin.top - margin.bottom, margin.top]);
    const AxisY = d3.axisLeft(scaleAxisY);
    containerAxisY
        .call(AxisY)
        .selectAll("line")
        .attr("x1", width - margin.right - margin.left)
        .attr("stroke-dasharray", "5")
        .attr("opacity", 0.1);
    const areaGenerator = d3
        .area()
        .x((d) => scaleAxisX(new Date(d.day)))
        .y0(scaleAxisY(0))
        .y1((d) => scaleAxisY(d.msPlayed/(1000*60*60)));
    const area = containerGraph
        .selectAll(".path")
        .data([data])
        .join("path")
        .attr("class", "path")
        .attr("fill", "#1DB954")
        .attr("stroke", "#15853c")
        .attr("d", areaGenerator);
    
    const zoomController = (event) => {
        const transformation = event.transform;
        const scaleAxisX2 = transformation.rescaleX(scaleAxisX);
        const areaGenerator2 = d3
            .area()
            .x((d) => scaleAxisX2(new Date(d.day)))
            .y0(scaleAxisY(0))
            .y1((d) => scaleAxisY(d.msPlayed/(1000*60*60)));
        area.attr("d", areaGenerator2)
        containerAxisX.call(AxisX.scale(scaleAxisX2))
    };
    const zoom = d3
        .zoom()
        .extent([[0, 0], [width - margin.left - margin.right, height - margin.top - margin.bottom]])
        .scaleExtent([1, 17])
        .translateExtent([[0, 0], [width - margin.left - margin.right, height - margin.top - margin.bottom]])
        .on('zoom',  zoomController);
    containerGraph.call(zoom);
});


// BARPLOT
// reference --> https://www.d3-graph-gallery.com/graph/barplot_horizontal.html
const margin2 = {
    top: 50,
    bottom: 50,
    left: 70,
    right: 10
}; 

const svg2 = d3
    .select("#weekday-container")
    .append("svg")
    .attr("id", "weekday-graph")
    .attr("width", width)
    .attr("height", height);

const containerAxisX2 = svg2
    .append("g")
    .attr("transform", `translate(${0}, ${margin2.top})`);

const containerAxisY2 = svg2
    .append("g")
    .attr("transform", `translate(${margin2.left}, ${0})`);

svg2
    .append("text")
    .text("Average time streaming (min)")
    .attr("text-anchor", "middle")
    .attr("font-size", 13)
    .attr("transform", `translate(${width/2}, ${margin2.top - 30})`);
    
svg2
    .append("text")
    .text("Weekday")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", margin.left - 37)
    .attr("text-anchor", "middle")
    .style("font-size", 13);

d3.json(weekday_route).then( (data) => {
    const range = d3.extent(data, (d) => (d.avg/(1000*60)).toFixed(2));
    // X scale
    const scaleAxisX = d3
        .scaleLinear()
        .range([margin2.left, width - margin2.right])
        .domain( [0, range[1]] );
    const AxisX = containerAxisX2
        .call(d3.axisTop(scaleAxisX))
        .selectAll("line")
        .attr("y1", height - margin2.top - margin2.bottom)
        .attr("stroke-dasharray", "5")
        .attr("opacity", 0.3);
    // Y scale
    const scaleAxisY = d3
        .scaleBand()
        .range([margin2.top, height - margin2.bottom])
        .domain(data.map( (d) => d.weekday))
        .padding(0.3);
    const AxisY = containerAxisY2.call(d3.axisLeft(scaleAxisY));

    const containerBars = svg2
        .append("g")
        .attr("transform", `translate(${margin2.left + 0.5}, ${0})`);

    containerBars
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("id", (d) => "r" +  `${d.weekday}`)
        .attr("height", scaleAxisY.bandwidth())
        .attr("fill", "#1DB954")
        .attr("width", (d) => scaleAxisX((d.avg/(1000*60)).toFixed(2)))
        .attr("x", 0)
        .attr("y", (d) => scaleAxisY(d.weekday));

    svg2
        .append("text")
        .attr("id", "weekday-label")
        .attr("text-anchor", "middle")
    svg2
        .selectAll("rect")
        .on("mouseenter", (event, d) => {
            svg2
                .select("#r" + `${d.weekday}`)
                .attr("fill", "#15853c");
        })
        .on("mousemove", (event, d) => {
            svg2
            .select("#weekday-label")
            .attr("opacity", 1)
            .text(`${(d.avg/(1000*60)).toFixed(2)}min streaming`)
            .attr("x", event.layerX )
            .attr("y", event.layerY - 10)
        })
        .on("mouseleave", (event, d) => {
            svg2
                .select("#r" + `${d.weekday}`)
                .attr("fill", "#1DB954");
            svg2
                .select("#weekday-label")
                .attr("opacity", 0)
                .text("")
        });

})