$( document ).ready(function() {

  var width = 800;
  var height = 250;

  var angle = d3.scale.ordinal().domain(d3.range(4)).rangePoints([0, 2 * Math.PI]),
      color = d3.scale.category10().domain(d3.range(width/10));

  // number of layers
  var layer = 6;  
  var numOfNodes = 24;
  var offset = 0;

  var nodes = [];

  // Add nodes
  for (i=0; i<layer; i++) {

    for (j=0; j<numOfNodes; j++) {

      nodes.push({x: i*width/layer, y: j*8});
    }
  }

  var links = [];

  // Add links
  for (i=0; i<layer-1; i++) {

    var start = i*nodes.length/layer + offset;

    for (j=0; j<numOfNodes; j=j+3) {

      for (k=0; k<numOfNodes; k=k+3)
      links.push({source: nodes[start+k], target: nodes[start + j + numOfNodes-offset]});
    }
  }

  var svg = d3.select("div#deepVis").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + 50 + "," + 50 + ")");

  var diagonal = d3.svg.diagonal()
    .source(function(d) { return {"x":d.source.y, "y":d.source.x}; })            
    .target(function(d) { return {"x":d.target.y, "y":d.target.x}; })
    .projection(function(d) { return [d.y, d.x]; });

  var link = svg.selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#ADADAD")
    .attr("d", diagonal)
    .on("mouseover", linkMouseover)
    .on("mouseout", mouseout);

  var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", 4)
    .style("fill", function(d) { return color(d.x/35); })
    .on("mouseover", nodeMouseover)
    .on("mouseout", mouseout);

    function linkMouseover(d) {
      svg.selectAll(".link").classed("active", function(p) { return p === d; });
      svg.selectAll(".node circle").classed("active", function(p) { return p === d.source || p === d.target; });
    }

    function nodeMouseover(d) {
      svg.selectAll(".link").classed("active", function(p) { return p.source === d || p.target === d; });
      d3.select(this).classed("active", true);
    }

    function mouseout() {
      svg.selectAll(".active").classed("active", false);
    }
});