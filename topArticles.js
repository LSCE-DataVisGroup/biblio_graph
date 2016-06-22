$(document).ready(function(){

var width = 800;
var height = 800;
var graphLayout = d3.select("#graphLayout").append("svg")
        .attr("width", width)
        .attr("height", height);

var color = d3.scale.category20();

var nodetip = d3.tip()
    .attr('class', 'd3-tip nodetip')
    .offset([-20, 0])
    .html(function (d) {
        return d.nb + " citations"; 
    });
graphLayout.call(nodetip);
    
var linktip = d3.tip()
    .attr('class', 'd3-tip linktip')
    .offset([-50, 0])
    .html(function (d) {
	if (d.value == 1) plurial = "";
	else plurial = "s";
        return  d.value + " common author" + plurial + ': <br>' +
		'<div style="font-style: italic; margin-left: 30px;">' + d.authors + '</div>'; 
    });
graphLayout.call(linktip);

var force = d3.layout.force()
    .charge(-500)
    .linkDistance(function (d) {return 50/d.value;})
    .size([width, height]);

  
//===================
d3.json("data_top50Articles_corrected.json", function(error, json) {
  if (error) throw error;

// https://medium.com/@sxywu/understanding-the-force-ef1237017d5#.ekd5lav2b

//Creates the graph data structure out of the json data
force.nodes(json.nodes)
    .links(json.links)
    .gravity(.2)
    .start();

var n = json.nodes.length;
//for (var i = 10000 ; i > 0; --i) force.tick();
force.start();

// sort nodes to get max
json.nodes.sort(function(a,b) {
        return b.nb - a.nb;
});
var maxCitations = json.nodes[0].nb;

// sort links to get max
json.links.sort(function(a,b) {
        return b.value - a.value;
});
var maxCoauthors = json.links[0].value;

console.log("maxCitations: ", maxCitations);
console.log("maxCoauthors: ", maxCoauthors);

var link = graphLayout.selectAll(".link")
var link = graphLayout.selectAll(".link")
    .data(json.links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function (d) {
    	//return Math.sqrt(d.value);
    	//return d.value;
    	return 10*(d.value/maxCoauthors);  
    })
    .on("mouseover", linkmouseover)
    .on("mouseout", linkmouseout);

function linkmouseover(d) {
  linktip.show(d);
  var selectedLink = d3.select(this);
  selectedLink.transition()
      .duration(150)
      .style("stroke", "black");

  var selectedCircles = d3.selectAll('#node'+ d.target.id + ', #node' + d.source.id);
  selectedCircles.transition()
      .duration(150)
      .attr("stroke-width", 3);

  var x0 = (d.target.x + d.source.x)/2;
  var y0 = (d.target.y + d.source.y)/2;
  var x1 = Math.min(d.source.x, d.target.x) - 50;
  var y1 = Math.min(d.source.y, d.target.y) - 50;
  //path = "M " + x0 + "," + y0 + " L " + x1 + "," + y1;
  var dx = x1 - x0,
      dy = y1 - y0,
      dr = Math.sqrt(dx * dx + dy * dy);
      // A rx ry xaxis large-arc sweep x y
  path = "M" + x0 + "," + y0 +
      "A" + dr + " " + dr + " 0 0 1 " + x1 + " " + y1;
  //path = "M " + x0 + "," + y0 + " L " + x1 + "," + y1;
  //console.log(path);
  graphLayout.append("svg:path")
    .attr("id", "d3-tip-stem")
    .attr("d", path)
    .attr("stroke", "black")
    .attr("stroke-width", "2")
    .attr("fill", "none");
}

function linkmouseout(d) {
  linktip.hide(d);
  var selectedLink = d3.select(this);
  selectedLink.transition()
      .duration(150)
      .style("stroke", "#999");
  graphLayout.select("#d3-tip-stem")
      .remove();
  var selectedCircles = d3.selectAll('#node'+ d.target.id + ', #node' + d.source.id);
  selectedCircles.transition()
      .duration(150)
      .attr("stroke-width", 1);
}

var node = graphLayout.selectAll(".node")
    .data(json.nodes)
    .enter().append("g")
    .attr("class", "node")
    .call(force.drag)
    .on("mouseover", nodemouseover)
    .on("mouseout", nodemouseout);
    //.on("mousedown", clearNotes)
    //.on('click', connectedNodes);

node.append("circle")
    .attr("r", function (d) { return 20*(d.nb/maxCitations); }) 
    .attr("id", function (d) { return "node" + d.id; }) 
    .style("fill", function (d) { return color(d.group); })
    .attr("stroke", "black")
    .attr("stroke-width", 1);

function nodemouseover(d) {
  clearNotes();
  connectedNodes(d);
  nodetip.show(d);
  var selectedNode = d3.select(this);
  selectedNode.select("circle").transition()
      .duration(750)
      .attr("stroke-width", 3);
  selectedNode.select("text").transition()
      .duration(750)
      .style("font-weight", "bold");
}

function nodemouseout(d) {
  nodetip.hide(d);
  var selectedNode = d3.select(this);
  selectedNode.select("circle").transition()
      .duration(750)
      .attr("stroke-width", 1);
  selectedNode.select("text").transition()
      .duration(750)
      .style("font-weight", "normal");
}

node.append("text")
      .attr("dx", 10)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });

force.on("tick", function () {
    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });
    
    d3.selectAll("circle").attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });

    d3.selectAll("text").attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });
    
});
    
//---Insert-------

//Create an array logging what is connected to what
var linkedByIndex = {};
for (var i = 0; i < json.nodes.length; i++) {
   linkedByIndex[i + "," + i] = 1;
};
json.links.forEach(function (d) {
   linkedByIndex[d.source.index + "," + d.target.index] = 1;
});

//This function looks up whether a pair are neighbours  
function neighboring(a, b) {
   return linkedByIndex[a.index + "," + b.index];
}

function clearNotes() {
   notes.selectAll('*').remove();
}

function resetLinks() {
   clearNotes();
   force.resume();
   node.style("opacity", 1);
   link.style("opacity", 1);
}

function connectedNodes(d) {
   //Reduce the opacity of all but the neighbouring nodes
   //var d = d3.select(this).node().__data__;  
   node.style("opacity", function (o) {
       return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
   });
   
   link.style("opacity", function (o) {
       return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
   });
   
   fillNotes(d);
}

//---End Insert---    
    
$("#graphLayout").on("dblclick", function() {
   resetLinks();
});

var notes = d3.select('#notes');

function fillNotes(d) {
   force.stop();

   notes.append('p').text(d.title2).style("font-weight", "bold").style("font-size", "16px");
   notes.append('p').text(d.title1).style("font-weight", "bold");
   notes.append('p').text(d.authors).style("font-style", "italic");
   notes.append('p').text(d.abstract);
   notes.append('p').html('<span style="font-weight: bold;">' + d.nb + " citations </span>(from Scopus)");
   notes.append('p').html('DOI: ' + '<a target="_blank" href="http://dx.doi.org/' + d.DOI + '">' + d.DOI +'</a>');
   notes.append('p').html('Record number: <span style="font-weight: bold;">' + d.name + '</span>');
}

//===================
});
    
})
