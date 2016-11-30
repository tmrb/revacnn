// api_example.js
// Called from images-demo.js
// Uses deepVis_api.js

var api_example = function(net) {
  console.log('api_example append');
  // console.log(net);
  //clear
  // elt.innerHTML = "";
  var _self = this;
  _self.layer_data = {};

  // var example_layer_div = document.createElement('div');
  // example_layer_div.appendChild(document.createTextNode('get_canvas_img API'));
  // example_layer_div.appendChild(document.createElement('br'));

  var N = net.layers.length;
  N = N - 1; // do not show last layer

  _self.layer_data["node_images"] = [];
  // get_canvas_img API example START
  for(var i=0; i<N; i++) {
    // layer start
    var L = net.layers[i];
    
    // example_layer_div.appendChild(document.createTextNode('layer: ' + i));
    // example_layer_div.appendChild(document.createElement('br'));

    var num_element = get_number_of_elements_in_layer(L);

    var array_of_images = [];
    for(var j=0; j<num_element; j++) {

      var canvas_img = get_canvas_img(L, j);
      // example_layer_div.appendChild(canvas_img);
      // image
      array_of_images.push(canvas_img);
    }
    _self.layer_data["node_images"].push(array_of_images);

    // example_layer_div.appendChild(document.createElement('br'));
    // layer end
    // elt.appendChild(example_layer_div);
  }
  // get_canvas_img API example END



  // example_layer_div.appendChild(document.createElement('br'));
  // example_layer_div.appendChild(document.createElement('br'));
  // example_layer_div.appendChild(document.createTextNode('get_grad_magnitude API'));
  // example_layer_div.appendChild(document.createElement('br'));


  _self.layer_data["node_jitter"] = [];
  // get_grad_magnitude API example START
  for(var i=0; i<N; i++) {
    // layer start
    var L = net.layers[i];

    // example_layer_div.appendChild(document.createTextNode('layer: ' + i));
    // example_layer_div.appendChild(document.createElement('br'));

    var jitter_layer = [];
    if(L.layer_type == 'conv') {// Only for conv layer

      var num_element = get_number_of_elements_in_layer(L);

      for(var j=0; j<num_element; j++) {

        var grad_mag = get_grad_magnitude(L, j);
        // example_layer_div.appendChild(document.createTextNode(grad_mag + ', '));
        jitter_layer.push(grad_mag);
      }
      // example_layer_div.appendChild(document.createElement('br'));
      // layer end

      // elt.appendChild(example_layer_div);
    }else{
      var num_element = get_number_of_elements_in_layer(L);

      for(var j=0; j<num_element; j++) {

        // var grad_mag = get_grad_magnitude(L, j);
        // example_layer_div.appendChild(document.createTextNode(grad_mag + ', '));
        jitter_layer.push(0);
      }
    }
    _self.layer_data["node_jitter"].push(jitter_layer);
  }
  // get_grad_magnitude API example END



  
  // example_layer_div.appendChild(document.createElement('br'));
  // example_layer_div.appendChild(document.createElement('br'));
  // example_layer_div.appendChild(document.createTextNode('get_path_intensity API'));
  // example_layer_div.appendChild(document.createElement('br'));


  _self.layer_data["path_intensity"] = [];
  // get_path_intensity API example START
  for(var i=0; i<N; i++) {
    // layer start
    var L1 = net.layers[i];
    var L2 = net.layers[i+1];

    // example_layer_div.appendChild(document.createTextNode('layer: ' + i));
    // example_layer_div.appendChild(document.createElement('br'));

    var num_element = get_number_of_elements_in_layer(L1);

    var path_intensity = [];
    for(var j=0; j<num_element; j++) {

      var grad_mag = get_path_intensity(L1, L2, j);
      // example_layer_div.appendChild(document.createTextNode(grad_mag + ', '));
      path_intensity.push(grad_mag);
    }
    _self.layer_data["path_intensity"].push(path_intensity);
    // example_layer_div.appendChild(document.createElement('br'));
    // layer end
    // elt.appendChild(example_layer_div);
  }
  // get_path_intensity API example END
  //clear for testing NeuralNetVis
  // elt.innerHTML = "";
}