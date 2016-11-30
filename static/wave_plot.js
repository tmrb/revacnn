function WavePlot(canvas, data, screen_width, screen_height){
    
    var _self = this;
    _self.data = data;
    console.log(_self.data);
    _self.keys = ["activation_sum", "filter_grad"];
    var keys = _self.keys;
    _self.key_index = 0;
    var margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = screen_width - margin.left - margin.right,
        height = screen_height - margin.top - margin.bottom;

    _self.width = width;
    _self.height = height;
    _self.color_category = ["steelblue", "lightpink"];
    
    // Play/Stop Button Added Here:
    
// _self.parameter_group = d3.select(canvas)
//     .append("div")
//     .attr("class", "row");

// _self.play_button_group = _self.parameter_group
//     .append("div")
//     .attr("class", "col-lg-1")
//     .append("button")
//     .attr("id", "play_button")
//     .attr("current", "paused")
//     .attr("type", "button")
//     .attr("class", "btn btn-default btn-lg");

// _self.play_button = _self.play_button_group
//     .append("span")
//     .attr("class", "glyphicon glyphicon-play")
//     .style("visibility", "visible")
//     .style("display", "inline")
//     .attr("area-hidden", true);

// _self.pause_button = _self.play_button_group
//     .append("span")
//     .attr("class", "glyphicon glyphicon-pause")
//     .attr("area-hidden", true)
//     .style("display", "none")
//     .style("visibility", "hidden");
    
    // Play/Stop Button Above

    _self.svg = d3.select(canvas).append("p").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    $('input[name="bar_val"]').on("click", function(){
      _self.key_index = _self.keys.indexOf($(this).val());
      _self.toggle_bar();
    });
    
    $('body').on('click', '#play_button', function(){
        var status = $(this).attr("current");
        if(status == "paused"){
            _self.click_on_process("playing");
        }else if(status == "playing"){
            _self.click_on_process("paused");
        }
    })
    _self.redraw();
}

WavePlot.prototype.redraw = function() {
  var _self = this;

  _self.svg.selectAll("*").remove();

  _self.x = d3.scale.ordinal()
            .rangeRoundBands([0, _self.width], .1);

  _self.x.domain(_self.data[_self.keys[_self.key_index]].map(function(d,i){return i;}));

  _self.y = d3.scale.ordinal()
      .rangeBands([0, _self.height]);

  _self.y_val = d3.scale.linear()
      .range([0, _self.x.rangeBand()/2])

  _self.extent_val = {};
  _self.y_scale = {};
  _self.y_val_scale = {};
  _self.keys.forEach(function(key_element,key_index){
    _self.extent_val[key_element] = [];
    _self.y_scale[key_element] = [];
    _self.y_val_scale[key_element] = [];
    _self.data[key_element].forEach(function(data_element,data_index){
       var range = [0, _self.height];
       if(data_element.length < 32){
           range = [(32-data_element.length)*_self.height/32, _self.height/32*data_element.length];
       }
      _self.extent_val[key_element].push(d3.extent(data_element));
      _self.y_scale[key_element].push(d3.scale.ordinal()
          .rangeRoundBands(range,.1).domain(data_element.map(function(d,i){return i;})));
      _self.y_val_scale[key_element].push(d3.scale.linear()
      .range([0, _self.x.rangeBand()/2]).domain(d3.extent(data_element)));
    })
  });

  _self.layer = _self.svg.selectAll(".layer")
                .data(_self.data[_self.keys[_self.key_index]]).enter()
              .append("g").attr("class", "layer")
                .attr("layer_num", function(d,i){return i;})
                .attr("transform", function(d,i){
                  var x = _self.x(i);
                  var y = 0;
                  return "translate(" + x + "," + y + ")";
                });

  _self.layer_axis = _self.layer
      .append("g").attr("class", "y axis")
        .call(d3.svg.axis()
        .ticks(0)
        .scale(_self.y)
        .orient("left"));


  _self.layer_axis_label = _self.layer.append("text")
                          .style("text-anchor", "middle")
                          .style("alignment-baseline", "hanging")
                          .attr("y", _self.height)
                          .text(function(d,i){
                            return "Conv-" + i;
                          });
  
  // + / - button below
  _self.node_size = 25;
    
  _self.layer.append("a").attr("class", "btn-large").attr("id", "btn_layer_minus").attr("href", "#")
                      .style("float", "left")
                      .append("svg:image")
                      .attr("xlink:href", function(d){ return "/static/image/minus.png"; })
                      .attr("class", "layer_minus")
                      .attr("x", -_self.node_size*2)
                      .attr("y", -_self.node_size)
                      .attr("width", _self.node_size)
                      .attr("height", _self.node_size);
    
  _self.layer.append("text").attr("class", "layer_desc")
                          .style("text-anchor", "middle")
                          .style("alignment-baseline", "baseline")
                          .text(function(d,i){
                              var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
                              var length = _self.data[_self.keys[_self.key_index]][index].length;
                              return length;});

  _self.layer.append("a").attr("class", "btn-large").attr("id", "btn_layer_plus").attr("href", "#")
                    .style("float", "right")
                    .append("svg:image")
                    .attr("xlink:href", function(d){ return "/static/image/plus.png"; })
                    .attr("class", "layer_plus")
                    .attr("x", _self.node_size)
                    .attr("y", -_self.node_size)
                    .attr("width", _self.node_size)
                    .attr("height", _self.node_size);
  
  // + / - button above

   _self.layer.append("a").attr("class", "btn-large").attr("id", "btn_layer_play_pause").attr("href", "#")
        .style("float", "middle")
        .append("svg:image")
        .attr("xlink:href", function(d){ return "/static/image/play_button.png"; })
        .attr("class", "layer_play_pause")
        .attr("current", "play")
        .attr("x", -_self.node_size/2)
        .attr("y", -_self.node_size*2)
        .attr("width", _self.node_size)
        .attr("height", _self.node_size)
        .on("click", function(){
               var status = d3.select(this).attr("current");
               if(status == "play"){
                d3.select(this).attr("xlink:href", function(d){return "/static/image/pause_button.png";});   
               }else{
                d3.select(this).attr("xlink:href", function(d){return "/static/image/play_button.png";});
               }
           })
    

  _self.bar = _self.layer.selectAll(".bar")
              .data(function(d,i){
                return d;}).enter()
            .append("rect")
              .attr("y", function(d,i){
                var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
                return _self.y_scale[_self.keys[_self.key_index]][index](i);})
              .attr("height", function(d,i){
                var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
                return _self.y_scale[_self.keys[_self.key_index]][index].rangeBand()})
              .attr("width", function(d,i){
                var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
                return _self.y_val_scale[_self.keys[_self.key_index]][index](_self.data[_self.keys[_self.key_index]][index][i]);})
              .style("fill", _self.color_category[_self.key_index])
              .style("stroke", "lightgray");
   
   _self.image = _self.layer.selectAll(".canvas_node")
                   .data(function(d){return d;}).enter()
                .append("g")
                   .attr("class", "canvas_node")
                   .attr("transform", function(d,i){
                       var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
                       return "translate(0," + _self.y_scale[_self.keys[_self.key_index]][index](i) + ")";
                   })
                   .each(function(d,i){
                       var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
                       var tempcanvas = get_canvas_from_array(_self.data.activation[index], false, false, i, 3);
                       d3.select(this).append("svg:image")
                               .attr("xlink:href", tempcanvas.toDataURL())
                               .attr("x", function(d,i){
                                    var index = parseInt(d3.select(d3.select(this).node().parentNode.parentNode).attr("layer_num"));
                                    return -(_self.y_scale[_self.keys[_self.key_index]][index].rangeBand()+5);})
                               .attr("width", function(d,i){
                                    var index = parseInt(d3.select(d3.select(this).node().parentNode.parentNode).attr("layer_num"));
                                    return _self.y_scale[_self.keys[_self.key_index]][index].rangeBand();})
                               .attr("height", function(d,i){
                                    var index = parseInt(d3.select(d3.select(this).node().parentNode.parentNode).attr("layer_num"));
                                    return _self.y_scale[_self.keys[_self.key_index]][index].rangeBand();})
                               .on("mouseenter", function(d){ d3.select(this).transition().duration(500).attr("width", 200).attr("height", 200);})
                               .on("mouseleave", function(d,i){
                                    var index = parseInt(d3.select(d3.select(this).node().parentNode.parentNode).attr("layer_num"));
                                   var org_scale = _self.y_scale[_self.keys[_self.key_index]][index].rangeBand();
                                    d3.select(this).transition().duration(500).attr("width", org_scale).attr("height", org_scale);})
                   });
                   

  // _self.dot = _self.layer.selectAll(".dot")
  //               .data(function(d){return d;}).enter()
  //             .append("circle")
  //               .attr("cy", function(d,i){
  //                 var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
  //                 return _self.y_scale[_self.keys[_self.key_index]][index](i) + _self.y_scale[_self.keys[_self.key_index]][index].rangeBand()/2;})
  //               .attr("r", function(d,i){
  //                 var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
  //                 return _self.y_scale[_self.keys[_self.key_index]][index].rangeBand()/4})
  //               .style("fill", "lightpink")
  //               .style("stroke", "lightgray");
};

WavePlot.prototype.toggle_bar = function() {
  var _self = this;
  _self.bar.transition().duration(250).ease("linear")
      .attr("y", function(d,i){
        var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
        return _self.y_scale[_self.keys[_self.key_index]][index](i);})
      .attr("height", function(d,i){
        var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
        return _self.y_scale[_self.keys[_self.key_index]][index].rangeBand()})
      .attr("width", function(d,i){
        var index = parseInt(d3.select(d3.select(this).node().parentNode).attr("layer_num"));
        return _self.y_val_scale[_self.keys[_self.key_index]][index](_self.data[_self.keys[_self.key_index]][index][i]);})
      .style("fill", _self.color_category[_self.key_index]);
};

WavePlot.prototype.update = function(new_data) {
  var _self = this;
  _self.data = new_data;
  _self.redraw();
};

WavePlot.prototype.click_on_process = function(argument){
    var _self = this;
    if(argument == "paused"){
        _self.play_button.style("visibility", "visible").style("display", "inline");
        _self.pause_button.style("visibility", "hidden").style("display", "none");
        _self.play_button_group.attr("current", "paused");
    }else if(argument == "playing"){
        _self.play_button.style("visibility", "hidden").style("display", "none");
        _self.pause_button.style("visibility", "visible").style("display", "inline");
        _self.play_button_group.attr("current", "playing");
    }
}