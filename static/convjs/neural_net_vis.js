/* @author: Bum Chul Kwon
  E-Mail: bumchul.kwon@us.ibm.com */
function NeuralNetVis(canvas, data, panel_canvas){
	var _self = this;
	_self.data = data;
	_self.node_size = 30;
	_self.begin_node_image_url = "/convnetjs/demo/image/puppies.png";
	_self.jquery_canvas = $(canvas);
	_self.canvas = d3.select(canvas);
	_self.canvas.selectAll("*").remove();

	_self.width = parseInt(_self.canvas.style("width"))-_self.node_size*2;
	_self.height = 1200 || parseInt(_self.canvas.style("height"))-_self.node_size*2;

	_self.panel_canvas = d3.select(panel_canvas).style("position", "relative");

	_self.draw_layers();

	_self.svg = _self.canvas.append("svg")
					.attr("width", _self.width)
					.attr("height", _self.height)
				.append("g")
					.attr("class", "svg_path");

	_self.draw_path();
	_self.node_vis();
	_self.restart_intervals();
	_self.set_panel();
	_self.jitter_node();
}

NeuralNetVis.prototype.update = function(data){
	var _self = this;
	_self.data = data;
	_self.remove_nodes();
	_self.draw_layers();
	$('div.layers').prependTo(_self.jquery_canvas);
	_self.node_vis();
	_self.svg.selectAll("path").remove();
	_self.draw_path();
	_self.jitter_node();
}


NeuralNetVis.prototype.setup_layer_filter_width = function(layer_size, filter_size){
	var _self = this;
	_self.layer_size_initial = layer_size || 3;
    _self.filter_size_initial = filter_size || 8;
	_self.unit_width = (_self.width-_self.node_size*4)/(_self.data["node_images"].length);
}


NeuralNetVis.prototype.add_layer = function(){
	var _self = this;
	if(_self.layer_size_initial < 7){
		_self.layer_size_initial = _self.layer_size_initial + 1;
		_self.setup_layer_filter_width(_self.layer_size_initial, _self.filter_size_initial);
		_self.remove_all();
		_self.draw_layers();
		_self.draw_path();
		_self.node_vis();
		_self.restart_intervals();
		$('div.layers').prependTo(_self.jquery_canvas);
	}
}


NeuralNetVis.prototype.remove_layer = function(){
	var _self = this;
	if(_self.layer_size_initial > 0){
		_self.layer_size_initial = _self.layer_size_initial - 1;
		_self.setup_layer_filter_width(_self.layer_size_initial, _self.filter_size_initial);
		_self.remove_all();
		_self.draw_layers();
		_self.draw_path();
		_self.node_vis();
		_self.restart_intervals();
		$('div.layers').prependTo(_self.jquery_canvas);
	}
}


NeuralNetVis.prototype.remove_all = function(){
	var _self = this;
	_self.svg.selectAll("path").remove();
	_self.canvas.selectAll("div.layers").remove();
}

NeuralNetVis.prototype.remove_nodes = function(){
	var _self = this;
	_self.canvas.selectAll("div#begin_node").remove();
	_self.canvas.selectAll("div.end_node").remove();
	_self.canvas.selectAll("div.layers").remove();
}


NeuralNetVis.prototype.draw_layers = function(){
	var _self = this;

	_self.begin_node = _self.canvas.selectAll("div").data(_self.data["node_images"][0]).enter().append("div")
						.attr("id", "begin_node")
						.style({width: _self.node_size,
								height: _self.node_size,
								"vertical-align": "middle",
								position: "absolute",
								top: function(d){return (_self.height/2-d3.select(d).attr("height")/2)+"px";},
								left: function(d){return (_self.node_size-d3.select(d).attr("width")/2)+"px"; }});

	_self.begin_node.append(function(d){return d;});

    _self.end_data = _self.data["node_images"][_self.data["node_images"].length-1];
	_self.end_node = _self.canvas.selectAll("div.end_node")
						.data(_self.end_data).enter()
					.append("div")
						.attr("class", "end_node")
						.style({width: _self.node_size,
								height: _self.node_size,
								"vertical-align": "middle",
								position: "absolute",
								top: function(d,i){return (i*_self.node_size*2 + (_self.height/2 - _self.node_size*2*_self.end_data.length/2)-d3.select(d).attr("height")/2 )+"px";},
								right: function(d,i){return (_self.node_size*2-d3.select(d).attr("width")/2)+"px";}});

	_self.end_node.append(function(d){return d;});
    
	_self.setup_layer_filter_width(3,8);
	_self.layer_data = _self.data["node_images"].slice(1, _self.data["node_images"].length-1);

	_self.layer_div = _self.canvas.selectAll("div.layers")
						.data(_self.layer_data).enter()
					.append("div")
						.attr("class", "layers")
						.attr("id", function(d,i){return "layer_"+(i+1);})
						.style({width: _self.node_size,
							height: _self.node_size,
							"vertical-align": "middle",
							position: "absolute",
							left: function(d,i){return (i+1)*_self.unit_width+"px";}});

	_self.filter_div = _self.layer_div.selectAll("div.filters")
							.data(function(d){return d;}).enter()
						.append("div")
							.attr("class", "filters")
							.attr("id", function(d,i){return "filter_"+i;})
							.style({width: _self.node_size,
									height: _self.node_size,
									"vertical-align": "middle",
									position: "absolute",
									top: function(d,i){return (i*_self.node_size*2-d3.select(d).attr("width")/2)+"px";},
									left: function(d){return (_self.node_size*4-d3.select(d).attr("height")/2)+"px"}});

	_self.node_svg = _self.filter_div.append("div");

}


NeuralNetVis.prototype.add_filter_to_column = function(col){
	var _self = this;
	_self.layer_data[col].push(0);

	var layer = d3.select("div.layers#layer_"+col).selectAll("div.filters").data(_self.layer_data[col]).enter()
				.append("div")
				.attr("class", "filters")
				.attr("id", function(d,i){return "filter_"+col;})
				.style({width: _self.node_size,
						height: _self.node_size,
						"vertical-align": "middle",
						position: "absolute",
						top: function(d,i){return i*_self.node_size*2+"px";},
						left: _self.node_size*4+"px"});

	var node_div = layer.selectAll("div.three_divs")
							.data(["blue", "red", "green"]).enter()
						.append("div")
							.attr("class", "three_divs")
							.style({"width": _self.node_size,
								"height": _self.node_size,
								"vertical-align": "middle",
								"position": "absolute",
								"left": function(d,i){return i*_self.node_size*2+"px"}});

	var node_svg = node_div.append("svg")
							.attr("class", "node_svg")
							.attr("width", _self.node_size)
							.attr("height", _self.node_size)
						.append("g")
							.attr("class", "node_svg_g");

	_self.node_svg = d3.selectAll("g.node_svg_g");

    _self.node_vis();
	_self.restart_intervals();    
}


NeuralNetVis.prototype.restart_intervals = function(){
	var _self = this;
	// var dateStarted = new Date();
	// var timeStarted = dateStarted.getTime();
	// clearInterval(_self.interval_node);
	// clearInterval(_self.interval_path);
 //    _self.interval_path = setInterval(function() {
	//   _self.animate_path();
	// }, 3000);

	// _self.interval_node = setInterval(function() {
	//   var num = Math.floor(((new Date()).getTime() - timeStarted)/1000)
	//   _self.animate_node(num);
	// }, 1000);

	// _self.interval_jitter_node = setInterval(function() {
	//   _self.jitter_node(10);
	// }, 100);
}


NeuralNetVis.prototype.remove_filter_at_column = function(col){
	var _self = this;
	// _self.layer_data[col].pop();

	// var layer = d3.select("div.layers#layer_"+col).selectAll("div.filters").data(_self.layer_data[col]).exit().remove();

	// // var node_div = layer.selectAll("div.three_divs")
	// // 						.data(["blue", "red", "green"]).enter()
	// // 					.append("div")
	// // 						.attr("class", "three_divs")
	// // 						.style({"width": _self.node_size,
	// // 							"height": _self.node_size,
	// // 							"vertical-align": "middle",
	// // 							"position": "absolute",
	// // 							"left": function(d,i){return i*_self.node_size*2+"px"}});

	// var node_svg = layer.append("div");
	// // var node_svg = node_div.append("svg")
	// // 						.attr("class", "node_svg")
	// // 						.attr("width", _self.node_size)
	// // 						.attr("height", _self.node_size)
	// // 					.append("g")
	// // 						.attr("class", "node_svg_g");

	// _self.node_svg = d3.selectAll("g.node_svg_g");

 //    _self.node_vis();
 //    _self.restart_intervals();
}


NeuralNetVis.prototype.animate_path = function(){
	var _self = this;
	// var colorscale = d3.scale.linear().domain([0,1]).range(["#FFA07A", "#1E90FF"]);
	// _self.path.transition().duration(500)
	// 	.style("stroke-width", function(d,i){return getRandomFloat(5, 50);})
	// 	.style("stroke", function(d,i){return colorscale(getRandomFloat(0,1));});
}


NeuralNetVis.prototype.animate_node = function(num){
	var _self = this;
	// _self.nodes.forEach(function(node){
	// 		var num = getRandomInt(0, 85);
	// 		var url = "https://unsplash.it/"+_self.node_size+"/?image="+num;
	// 		node.attr("xlink:href", url);
	// })
}

NeuralNetVis.prototype.jitter_node = function(num){
	var _self = this;
	var jitter = _self.data["node_jitter"].reduce(function(a,b){return a.concat(b);});
	_self.node_svg.each(function(node, index){
		var o_x = parseFloat(d3.select(this.parentNode).style("left"));
		var o_y = parseFloat(d3.select(this.parentNode).style("top"));
		var layer_id = d3.select(this.parentNode.parentNode).attr("id");
		var layer_num = parseInt(layer_id.match(/\d+$/)[0]);
		var filter_id = d3.select(this.parentNode).attr("id");
		var filter_num = parseInt(filter_id.match(/\d+$/)[0]);
		var num_x = _self.data["node_jitter"][layer_num][filter_num];
		var num_y = _self.data["node_jitter"][layer_num][filter_num];
		d3.select(this.parentNode).transition().duration(10).style("left", (o_x+num_x)+"px").style("top", (o_y+num_y)+"px").transition().duration(10).style("left", (o_x-num_x)+"px").style("top", (o_y-num_y)+"px").each("end", jitter);
		function jitter(){
			var element = d3.select(this);
			(function repeat() {
			    element = element.transition()
			        .style("left", (o_x+num_x)+"px")
			        .style("top", (o_y+num_y)+"px")
			      .transition()
			        .style("left", (o_x-num_x)+"px")
			        .style("top", (o_y-num_y)+"px")
			        .each("end", repeat);
			  })();
		}
	});
}

NeuralNetVis.prototype.draw_path = function(threshold){
	var _self = this;

	var line = d3.svg.line()
                 .x(function(d) { return d.x;})
                 .y(function(d) { return d.y;})
                 .interpolate("monotone");

    var linedata = [];
    var offset = 10;
    var domain_obj = {};
    _self.data["path_intensity"].forEach(function(layer, l_index){
    	layer.forEach(function(filter, f_index){
    		var obj = {}
			if(l_index == 0){
    			obj["x"] = _self.node_size;
    			obj["y"] = _self.height/2;
    		}else{
    			obj["x"] = _self.unit_width*l_index + _self.node_size*4;
    			obj["y"] = f_index*_self.node_size*2;
    		}
    		filter.forEach(function(path, p_index){
    			var p_obj = {};
    			if(l_index==0){
    				p_obj["x"] = _self.unit_width*(l_index+1) + _self.node_size*4;
    				p_obj["y"] = p_index*_self.node_size*2;
    			}else if(l_index == _self.data["path_intensity"].length-2){
    				p_obj["x"] = _self.width-_self.node_size;
    				p_obj["y"] = (p_index*_self.node_size*2 + (_self.height/2 - _self.node_size*2*filter.length/2));
    			}else if(l_index%3!=0 && l_index != _self.data["path_intensity"].length-2){
    				p_obj["x"] = _self.unit_width*(l_index+1) + _self.node_size*4;
    				p_obj["y"] = f_index*_self.node_size*2;
    			}else{
    				p_obj["x"] = _self.unit_width*(l_index+1) + _self.node_size*4;
    				p_obj["y"] = p_index*_self.node_size*2;
    			}
    			if(l_index != _self.data["path_intensity"].length-1){
    				obj["layer"] = l_index;
    				obj["filter"] = f_index;
    				p_obj["layer"] = l_index;
    				p_obj["filter"] = f_index;
    				if(domain_obj[l_index]==undefined){
    					domain_obj[l_index]=[path];
    				}else{
    					domain_obj[l_index].push(path)
    				}
    				obj["path_intensity"] = path;
    				p_obj["path_intensity"] = path;
    				linedata.push([obj, p_obj]);
    			}
    		})
    	})
    });

    var bluered = ["#1E90FF","#FFA07A"];
    var black = ["black", "black"];

    _self.path_scale_obj = {};
    _self.color_scale_obj = {};
    for(var key in domain_obj){
    	var scale = d3.scale.linear().domain(d3.extent(domain_obj[key])).range([5, 25]);
    	var color_scale = d3.scale.linear().domain(d3.extent(domain_obj[key])).range(bluered);
    	_self.path_scale_obj[key] = scale;
    	_self.color_scale_obj[key] = color_scale;
    }

    _self.path = _self.svg.selectAll("path")
    				.data(linedata).enter()
    			.append("path")
    				.attr("d", line)
    				.style("stroke", "steelblue")
    				.style("opacity", .33)
    				.style("stroke-width", "10")
    				.style("fill", "none");
    				
    _self.path.style("stroke-width", function(d){
    	return _self.path_scale_obj[d[0]["layer"]](d[0]["path_intensity"]);})
    	.style("stroke", function(d){return _self.color_scale_obj[d[0]["layer"]](d[0]["path_intensity"]);})
    	.style("opacity", function(d){
    		var domain_scale = domain_obj[d[0]["layer"]].sort();
    		if(d[0]["layer"]==0){
    			return .33;
    		}
    		if(domain_scale.indexOf(d[0]["path_intensity"]) < domain_scale.length/2){
    			return 0;
    		}else{
    			return .33;
    		}
    	});
}


NeuralNetVis.prototype.node_vis = function(threshold){
	var _self = this;
	_self.nodes = [];
	_self.node_svg.each(function(d){
		d3.select(this).selectAll("*").remove();
		_self.nodes.push(d3.select(this).append(function(d){return d;}));		
	});
}


NeuralNetVis.prototype.set_panel = function(){
	var _self = this;
	_self.panel_canvas.selectAll("*").remove();
	_self.panel_div = _self.panel_canvas
					.append("div")
						.attr("class", "panel")
						.attr("id", "panel_div")
						.style("height", _self.node_size*4+ "px");
						
	_self.layer_div = _self.panel_div.append("div")
						.style({width: _self.node_size*3 + "px",
							height: _self.node_size + "px",
							"vertical-align": "middle",
							margin: "auto"});

	_self.layer_div.append("div").style({"text-align": "center"}).text("Layer Sets:");

	_self.layer_div.append("a").attr("class", "btn-large").attr("id", "btn_layer_minus").attr("href", "#")
					.style("float", "left")
				.append("img")
			      .attr("src", function(d){ return "/convnetjs/demo/image/minus.png"; })
  			      .attr("class", "layer_minus")
			      .attr("x", -_self.node_size)
			      .attr("y", "0px")
			      .attr("width", _self.node_size)
			      .attr("height", _self.node_size);

	_self.layer_div.append("a").attr("class", "btn-large").attr("id", "btn_layer_plus").attr("href", "#")
						.style("float", "right")
				.append("img")
			      .attr("src", function(d){ return "/convnetjs/demo/image/plus.png"; })
			      .attr("class", "layer_plus")
			      .attr("x", _self.node_size)
			      .attr("y", "0px")
			      .attr("width", _self.node_size)
			      .attr("height", _self.node_size);
    
    _self.filter_div = [];
	for (var i = 0; i < _self.layer_size_initial; i++) {

		_self.filter_div.push(_self.panel_div.append("div")
			.style({width: _self.node_size*3+ "px",
				height: _self.node_size+ "px",
				"vertical-align": "middle",
				"position": "absolute",
				"top": _self.node_size*2+ "px",
				"left": function(){return ((i+1)*_self.unit_width*3)+"px";}}));

		_self.filter_div[i].append("div").style({"text-align": "center"}).text("Filters:");

		_self.filter_div[i].append("a").attr("class", "btn-large").attr("id", "btn_layer_minus").attr("href", "#")
					.style("float", "left")
				.append("img")
			      .attr("src", function(d){ return "/convnetjs/demo/image/minus.png"; })
			      .attr("class", "filter_minus")
			      .attr("filter_id", i)
			      .attr("x", -_self.node_size)
			      .attr("y", "0px")
			      .attr("width", _self.node_size)
			      .attr("height", _self.node_size);

		_self.filter_div[i].append("a").attr("class", "btn-large").attr("id", "btn_layer_plus").attr("href", "#")
					.style("float", "right")
				.append("img")
			      .attr("src", function(d){ return "/convnetjs/demo/image/plus.png"; })
  			      .attr("class", "filter_plus")
			      .attr("filter_id", i)
			      .attr("x", _self.node_size)
			      .attr("y", "0px")
			      .attr("width", _self.node_size)
			      .attr("height", _self.node_size);

	}

	// $('.layer_minus').on("click", function(){
	// 	_self.remove_layer();
	// 	_self.set_panel();
	// });

	// $('.layer_plus').on("click", function(){
	// 	_self.add_layer();
	// 	_self.set_panel();
	// });

	// $('.filter_minus').on("click", function(){
	// 	var id = $(this).attr("filter_id");
	// 	_self.remove_filter_at_column(id);
	// });

	// $('.filter_plus').on("click", function(){
	// 	var id = $(this).attr("filter_id");
	// 	_self.add_filter_to_column(id);
	// });
}


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}