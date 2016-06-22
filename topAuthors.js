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
        return d.nb + " publications";
    });
graphLayout.call(nodetip);

var force = d3.layout.force()
    .charge(-500)
    .linkDistance(function (d) {return 500/d.value;})
    .size([width, height]);
  
//===================
d3.json("data_top50Authors_corrected.json", function(error, json) {
  if (error) throw error;

// https://medium.com/@sxywu/understanding-the-force-ef1237017d5#.ekd5lav2b

//Creates the graph data structure out of the json data
force.nodes(json.nodes)
    .links(json.links)
    .gravity(.8)
    .start();

var n = json.nodes.length;
//for (var i = 10000 ; i > 0; --i) force.tick();
force.start();

// sort nodes to get max
json.nodes.sort(function(a,b) {
        return b.nb - a.nb;
});
var maxPublications = json.nodes[0].nb;

// sort links to get max
json.links.sort(function(a,b) {
        return b.value - a.value;
});
var maxCoauthors = json.links[0].value;

console.log("maxPublications: ", maxPublications);
console.log("maxCoauthors: ", maxCoauthors);

var link = graphLayout.selectAll(".link")
var link = graphLayout.selectAll(".link")
    .data(json.links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function (d) {
    	//return Math.sqrt(d.value);
    	//return d.value;
    	return 20*(d.value/maxCoauthors);  
    });

var node = graphLayout.selectAll(".node")
    .data(json.nodes)
    .enter().append("g")
    .attr("class", "node")
    .call(force.drag)
    .on("mouseover", nodemouseover)
    .on("mouseout", nodemouseout)
    .on("mousedown", clearNotes)		// otherwise texts from rowChart are not set correctly when nodes are moved
    .on('click', connectedNodes);

node.append("circle")
    .attr("r", function (d) { return 20*(d.nb/maxPublications);}) 
    .attr("id", function (d) { return "node" + d.id; })
    .style("fill", function (d) { return color(d.group); })
    .attr("stroke", "black")
    .attr("stroke-width", 1);

function nodemouseover(d) {
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
   $("#search").val("");
}

function resetLinks() {
   clearNotes();
   force.resume();
   node.style("opacity", 1);
   link.style("opacity", 1);
}

function connectedNodes() {
   //Reduce the opacity of all but the neighbouring nodes
   var d = d3.select(this).node().__data__;  
   node.style("opacity", function (o) {
       return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
   });
   
   link.style("opacity", function (o) {
       return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
   });
   
   fillNotes(d);
}

//---End Insert---    
    
//---Insert------
var optArray = [];
for (var i = 0; i < json.nodes.length - 1; i++) {
    optArray.push(json.nodes[i].name);
}

optArray = optArray.sort();

$("#search").autocomplete({
        source: optArray
});
   
$("#search").on("autocompleteopen", function() {
   resetLinks();
});

$("#search").on("autocompleteclose", function() {
    //Reduce the opacity of all but the neighbouring nodes
    var selectedVal = $('#search').val();
     
    if (selectedVal) {
    var d = graphLayout.selectAll(".node").filter(function (d, i) {
        return d.name == selectedVal;
    });
    d = d.node().__data__;
    node.style("opacity", function (o) {
        return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
    });
    
    link.style("opacity", function (o) {
        return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
    });
    fillNotes(d);
    }
});

$("#graphLayout").on("dblclick", function() {
   resetLinks();
});

var notes = d3.select('#notes');

function fillNotes(d) {
   force.stop();

   notes.append('h3').text(d.name);
   notes.append('p').text("Number of publications: " + d.nb).style("font-weight", "bold");
   notes.append('p').text("Co-authors from the top50").style("text-align", "center");
   var list_authors = [];
   json.links.forEach(function(link){
           if (d.index==link.source.index) {
   		list_authors.push({name: link.target.name, value: link.value});
           } 
           if (d.index==link.target.index) {
   		list_authors.push({name: link.source.name, value: link.value});
           }
   });
   list_authors.sort(function(a,b) {
       return b.value - a.value;
   });

   //-----------------------------------
   // Build a row chart
   var chartWidth = 300;
   var barHeight = 20;
   var chartHeight = barHeight * (list_authors.length+1);

   var margin = {top: 0, right: 10, bottom: 10, left: 100};
   var rowChart = notes.append("svg")
      .attr("class", "rowChart")
      .attr("width", chartWidth + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
   .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   rowChart.append("g").attr("class", "bars");
   rowChart.append("g").attr("class", "xaxis");

   // maxDomain is the max of publications round by 10
   var maxDomain = 45;
   var delta = 5;

   var xScale = d3.scale.linear()
      .domain([0, maxDomain])
      .range([0, chartWidth]);

   var colorsNb = maxDomain / delta;  			// Must be integer and <= 9 
   //var colors = colorbrewer["YlGnBu"][colorsNb];	// Limited to 9 see http://d3js.org/colorbrewer.v1.js
   var colors = colorbrewer["YlOrRd"][colorsNb];	// Limited to 9 see http://d3js.org/colorbrewer.v1.js
   var colorScale = d3.scale.quantize()
      .domain([0, maxDomain])
      .range(colors);

   var xaxis = rowChart.select(".xaxis").selectAll("g")
     .data(xScale.ticks(colorsNb + 1))
     .enter()
     .append("g");

   xaxis.append("line")
    .attr("x1", function(d) { return xScale(d); })
    .attr("x2", function(d) { return xScale(d); })
    .attr("y1", 0)
    .attr("y2", barHeight * list_authors.length)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5);

   xaxis.append("text")
    .attr("x", function(d) { return xScale(d); })
    .attr("y", barHeight * list_authors.length + barHeight/2)
    .attr("dy", 5)
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });

   var bars = rowChart.select(".bars").selectAll("g")
     .data(list_authors)
     .enter()
     .append("g");

   bars.append("rect")
    .attr("y", function(d, i) { return i * barHeight; })
    .attr("width", function(d) { return xScale(d.value); })
    .attr("height", barHeight)
    .attr("fill", function(d) { return colorScale(d.value); });

   bars.append("text")
    .text(function(d) { return d.value; })
    .attr("x", function(d) { return xScale(d.value); })
    .attr("y", function(d, i) { return i * barHeight; })
    .attr("dx", 20)
    .attr("dy", "1.25em")
    .attr("text-anchor", "end");

   bars.append("text")
    .text(function(d) { return d.name; })
    .attr("x", 0)
    .attr("y", function(d, i) { return i * barHeight; })
    .attr("dx", -5)
    .attr("dy", "1.25em")
    .attr("text-anchor", "end");
    //-----------------------------------

}

//===================
});
    
})
