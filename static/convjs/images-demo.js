//images-demo.js

/*
sample_training_instance
sample_test_instance
*/
var sample_training_instance = function() {
  // find an unloaded batch
  var bi = Math.floor(Math.random()*loaded_train_batches.length);
  var b = loaded_train_batches[bi];
  var k = Math.floor(Math.random()*num_samples_per_batch); // sample within the batch
  var n = b*num_samples_per_batch+k;

  // load more batches over time
  if(step_num%(2 * num_samples_per_batch)===0 && step_num>0) {
    for(var i=0;i<num_batches;i++) {
      if(!loaded[i]) {
        // load it
        load_data_batch(i);
        break; // okay for now
      }
    }
  }

  // fetch the appropriate row of the training image and reshape into a Vol
  var p = img_data[b].data;
  var x = new convnetjs.Vol(image_dimension,image_dimension,image_channels,0.0);
  var W = image_dimension*image_dimension;
  var j=0;
  for(var dc=0;dc<image_channels;dc++) {
    var i=0;
    for(var xc=0;xc<image_dimension;xc++) {
      for(var yc=0;yc<image_dimension;yc++) {
        var ix = ((W * k) + i) * 4 + dc;
        x.set(yc,xc,dc,p[ix]/255.0-0.5);
        i++;
      }
    }
  }

  if(random_position){
    var dx = Math.floor(Math.random()*5-2);
    var dy = Math.floor(Math.random()*5-2);
    x = convnetjs.augment(x, image_dimension, dx, dy, false); //maybe change position
  }

  if(random_flip){
    x = convnetjs.augment(x, image_dimension, 0, 0, Math.random()<0.5); //maybe flip horizontally
  }

  var isval = use_validation_data && n%10===0 ? true : false;
  return {x:x, label:labels[n], isval:isval};
}

// sample a random testing instance
var sample_test_instance = function() {

  var b = test_batch;
  var k = Math.floor(Math.random()*num_samples_per_batch);
  var n = b*num_samples_per_batch+k;

  var p = img_data[b].data;
  var x = new convnetjs.Vol(image_dimension,image_dimension,image_channels,0.0);
  var W = image_dimension*image_dimension;
  var j=0;
  for(var dc=0;dc<image_channels;dc++) {
    var i=0;
    for(var xc=0;xc<image_dimension;xc++) {
      for(var yc=0;yc<image_dimension;yc++) {
        var ix = ((W * k) + i) * 4 + dc;
        x.set(yc,xc,dc,p[ix]/255.0-0.5);
        i++;
      }
    }
  }

  // distort position and maybe flip
  var xs = [];
  
  if (random_flip || random_position){
    for(var k=0;k<6;k++) {
      var test_variation = x;
      if(random_position){
        var dx = Math.floor(Math.random()*5-2);
        var dy = Math.floor(Math.random()*5-2);
        test_variation = convnetjs.augment(test_variation, image_dimension, dx, dy, false);
      }
      
      if(random_flip){
        test_variation = convnetjs.augment(test_variation, image_dimension, 0, 0, Math.random()<0.5); 
      }

      xs.push(test_variation);
    }
  }else{
    xs.push(x, image_dimension, 0, 0, false); // push an un-augmented copy
  }
  
  // return multiple augmentations, and we will average the network over them
  // to increase performance
  return {x:xs, label:labels[n]};
}


var data_img_elts = new Array(num_batches);
var img_data = new Array(num_batches);
var loaded = new Array(num_batches);
var loaded_train_batches = [];

// int main
$(window).load(function() {

  $("#newnet").val(t);
  eval($("#newnet").val());

  update_net_param_display();

  for(var k=0;k<loaded.length;k++) { loaded[k] = false; }

  load_data_batch(0); // async load train set batch 0
  load_data_batch(test_batch); // async load test set
  start_fun();
});

var start_fun = function() {
  if(loaded[0] && loaded[test_batch]) { 
    console.log('starting!'); 
    setInterval(load_and_step, 0); // lets go!
  }
  else { setTimeout(start_fun, 200); } // keep checking
}

var load_data_batch = function(batch_num) {
  // Load the dataset with JS in background
  data_img_elts[batch_num] = new Image();
  var data_img_elt = data_img_elts[batch_num];
  data_img_elt.onload = function() { 
    var data_canvas = document.createElement('canvas');
    data_canvas.width = data_img_elt.width;
    data_canvas.height = data_img_elt.height;
    var data_ctx = data_canvas.getContext("2d");
    data_ctx.drawImage(data_img_elt, 0, 0); // copy it over... bit wasteful :(
    img_data[batch_num] = data_ctx.getImageData(0, 0, data_canvas.width, data_canvas.height);
    loaded[batch_num] = true;
    if(batch_num < test_batch) { loaded_train_batches.push(batch_num); }
    console.log('finished loading data batch ' + batch_num);
  };
  data_img_elt.src = dataset_name + "/" + dataset_name + "_batch_" + batch_num + ".png";
}

var maxmin = cnnutil.maxmin;
var f2t = cnnutil.f2t;

// elt is the element to add all the canvas activation drawings into
// A is the Vol() to use
// scale is a multiplier to make the visualizations larger. Make higher for larger pictures
// if grads is true then gradients are used instead
var draw_activations = function(elt, A, scale, grads) {

  var s = scale || 2; // scale
  var draw_grads = false;
  if(typeof(grads) !== 'undefined') draw_grads = grads;

  // get max and min activation to scale the maps automatically
  var w = draw_grads ? A.dw : A.w;
  var mm = maxmin(w);

  // create the canvas elements, draw and add to DOM
  for(var d=0;d<A.depth;d++) {

    var canv = document.createElement('canvas');
    canv.className = 'actmap';
    var W = A.sx * s;
    var H = A.sy * s;
    canv.width = W;
    canv.height = H;
    var ctx = canv.getContext('2d');
    var g = ctx.createImageData(W, H);

    for(var x=0;x<A.sx;x++) {
      for(var y=0;y<A.sy;y++) {
        if(draw_grads) {
          var dval = Math.floor((A.get_grad(x,y,d)-mm.minv)/mm.dv*255);
        } else {
          var dval = Math.floor((A.get(x,y,d)-mm.minv)/mm.dv*255);  
        }
        for(var dx=0;dx<s;dx++) {
          for(var dy=0;dy<s;dy++) {
            var pp = ((W * (y*s+dy)) + (dx + x*s)) * 4;
            for(var i=0;i<3;i++) { g.data[pp + i] = dval; } // rgb
            g.data[pp+3] = 255; // alpha channel
          }
        }
      }
    }
    ctx.putImageData(g, 0, 0);
    elt.appendChild(canv);
  }  
}

var draw_activations_COLOR = function(elt, A, scale, grads) {

  var s = scale || 2; // scale
  var draw_grads = false;
  if(typeof(grads) !== 'undefined') draw_grads = grads;

  // get max and min activation to scale the maps automatically
  var w = draw_grads ? A.dw : A.w;
  var mm = maxmin(w);

  var canv = document.createElement('canvas');
  canv.className = 'actmap';
  var W = A.sx * s;
  var H = A.sy * s;
  canv.width = W;
  canv.height = H;
  var ctx = canv.getContext('2d');
  var g = ctx.createImageData(W, H);
  for(var d=0;d<3;d++) {
    for(var x=0;x<A.sx;x++) {
      for(var y=0;y<A.sy;y++) {
        if(draw_grads) {
          var dval = Math.floor((A.get_grad(x,y,d)-mm.minv)/mm.dv*255);
        } else {
          var dval = Math.floor((A.get(x,y,d)-mm.minv)/mm.dv*255);  
        }
        for(var dx=0;dx<s;dx++) {
          for(var dy=0;dy<s;dy++) {
            var pp = ((W * (y*s+dy)) + (dx + x*s)) * 4;
            g.data[pp + d] = dval;
            if(d===0) g.data[pp+3] = 255; // alpha channel
          }
        }
      }
    }
  }
  ctx.putImageData(g, 0, 0);
  elt.appendChild(canv);
}

var get_filter_canvas = function(A, scale, grads, index) {

  var s = scale || 2; // scale
  var draw_grads = false;
  if(typeof(grads) !== 'undefined') draw_grads = grads;

  // get max and min activation to scale the maps automatically
  var w = draw_grads ? A.dw : A.w;
  var mm = maxmin(w);

  // create the canvas elements, draw and add to DOM
  var d = index;

  var canv = document.createElement('canvas');
  canv.className = 'actmap';
  var W = A.sx * s;
  var H = A.sy * s;
  canv.width = W;
  canv.height = H;
  var ctx = canv.getContext('2d');
  var g = ctx.createImageData(W, H);

  for(var x=0;x<A.sx;x++) {
    for(var y=0;y<A.sy;y++) {
      if(draw_grads) {
        var dval = Math.floor((A.get_grad(x,y,d)-mm.minv)/mm.dv*255);
      } else {
        var dval = Math.floor((A.get(x,y,d)-mm.minv)/mm.dv*255);  
      }
      for(var dx=0;dx<s;dx++) {
        for(var dy=0;dy<s;dy++) {
          var pp = ((W * (y*s+dy)) + (dx + x*s)) * 4;
          for(var i=0;i<3;i++) { g.data[pp + i] = dval; } // rgb
          g.data[pp+3] = 255; // alpha channel
        }
      }
    }
  }
  ctx.putImageData(g, 0, 0);
  return canv;
}

var tsneArray = [];
var visualize_activations = function(net, elt) {
  //visualize_tsne.js
  visualize_tsne(net, elt);

}

// loads a training image and trains on it with the network
var paused = false;
var paused_vis = false;
var load_and_step = function() {
  if(paused) return; 

  var sample = sample_training_instance();
  step(sample); // process this image
  
  //setTimeout(load_and_step, 0); // schedule the next iteration
}

// evaluate current network on test set
var test_predict = function() {
  var num_classes = net.layers[net.layers.length-1].out_depth;

  document.getElementById('testset_acc').innerHTML = '';
  var num_total = 0;
  var num_correct = 0;

  // grab a random test image
  for(num=0;num<4;num++) {
    var sample = sample_test_instance();
    var y = sample.label;  // ground truth label

    // forward prop it through the network
    var aavg = new convnetjs.Vol(1,1,num_classes,0.0);
    // ensures we always have a list, regardless if above returns single item or list
    var xs = [].concat(sample.x);
    var n = xs.length;
    for(var i=0;i<n;i++) {
      var a = net.forward(xs[i]);
      aavg.addFrom(a);
    }
    var preds = [];
    for(var k=0;k<aavg.w.length;k++) { preds.push({k:k,p:aavg.w[k]}); }
    preds.sort(function(a,b){return a.p<b.p ? 1:-1;});
    
    var correct = preds[0].k===y;
    if(correct) num_correct++;
    num_total++;

    var div = document.createElement('div');
    div.className = 'testdiv';

    // draw the image into a canvas
    draw_activations_COLOR(div, xs[0], 2); // draw Vol into canv

    // add predictions
    var probsdiv = document.createElement('div');
    
    var t = '';
    for(var k=0;k<3;k++) {
      var col = preds[k].k===y ? 'rgb(85,187,85)' : 'rgb(187,85,85)';
      t += '<div class=\"pp\" style=\"width:' + Math.floor(preds[k].p/n*100) + 'px; background-color:' + col + ';\">' + classes_txt[preds[k].k] + '</div>'
    }
    probsdiv.innerHTML = t;
    probsdiv.className = 'probsdiv';
    div.appendChild(probsdiv);

    // add it into DOM
    $(div).prependTo($("#testset_vis")).hide().fadeIn('slow').slideDown('slow');
    if($(".probsdiv").length>200) {
      $("#testset_vis > .probsdiv").last().remove(); // pop to keep upper bound of shown items
    }
  }
  testAccWindow.add(num_correct/num_total);
  $("#testset_acc").text('test accuracy based on last 200 test images: ' + testAccWindow.get_average());  
}
var testImage = function(img) {
  var x = convnetjs.img_to_vol(img);
  var out_p = net.forward(x);


  var vis_elt = document.getElementById("visnet");
  visualize_activations(net, vis_elt);

  var preds =[]
  for(var k=0;k<out_p.w.length;k++) { preds.push({k:k,p:out_p.w[k]}); }
  preds.sort(function(a,b){return a.p<b.p ? 1:-1;});

  // add predictions
  var div = document.createElement('div');
  div.className = 'testdiv';

  // draw the image into a canvas
  draw_activations_COLOR(div, x, 2);

  var probsdiv = document.createElement('div');


  var t = '';
  for(var k=0;k<3;k++) {
    var col = k===0 ? 'rgb(85,187,85)' : 'rgb(187,85,85)';
    t += '<div class=\"pp\" style=\"width:' + Math.floor(preds[k].p/1*100) + 'px; background-color:' + col + ';\">' + classes_txt[preds[k].k] + '</div>'
  }
  
  probsdiv.innerHTML = t;
  probsdiv.className = 'probsdiv';
  div.appendChild(probsdiv);

  // add it into DOM
  $(div).prependTo($("#testset_vis")).hide().fadeIn('slow').slideDown('slow');
  if($(".probsdiv").length>200) {
    $("#testset_vis > .probsdiv").last().remove(); // pop to keep upper bound of shown items
  }
}

var lossGraph = new cnnvis.Graph();
var xLossWindow = new cnnutil.Window(100);
var wLossWindow = new cnnutil.Window(100);
var trainAccWindow = new cnnutil.Window(100);
var valAccWindow = new cnnutil.Window(100);
var testAccWindow = new cnnutil.Window(50, 1);

var step_num = 0;

var step = function(sample) {

  var x = sample.x;
  var y = sample.label;

  if(sample.isval) {
    // use x to build our estimate of validation error
    net.forward(x);
    var yhat = net.getPrediction();
    var val_acc = yhat === y ? 1.0 : 0.0;
    valAccWindow.add(val_acc);
    return; // get out
  }

  // train on it with network
  var stats = trainer.train(x, y);
  var lossx = stats.cost_loss;
  var lossw = stats.l2_decay_loss;

  // keep track of stats such as the average training error and loss
  var yhat = net.getPrediction();
  var train_acc = yhat === y ? 1.0 : 0.0;
  xLossWindow.add(lossx);
  wLossWindow.add(lossw);
  trainAccWindow.add(train_acc);

  // visualize training status
  var train_elt = document.getElementById("trainstats");
  train_elt.innerHTML = '';
  var t = 'Forward time per example: ' + stats.fwd_time + 'ms';
  train_elt.appendChild(document.createTextNode(t));
  train_elt.appendChild(document.createElement('br'));
  var t = 'Backprop time per example: ' + stats.bwd_time + 'ms';
  train_elt.appendChild(document.createTextNode(t));
  train_elt.appendChild(document.createElement('br'));
  var t = 'Classification loss: ' + f2t(xLossWindow.get_average());
  train_elt.appendChild(document.createTextNode(t));
  train_elt.appendChild(document.createElement('br'));
  var t = 'L2 Weight decay loss: ' + f2t(wLossWindow.get_average());
  train_elt.appendChild(document.createTextNode(t));
  train_elt.appendChild(document.createElement('br'));
  var t = 'Training accuracy: ' + f2t(trainAccWindow.get_average());
  train_elt.appendChild(document.createTextNode(t));
  train_elt.appendChild(document.createElement('br'));
  var t = 'Validation accuracy: ' + f2t(valAccWindow.get_average());
  train_elt.appendChild(document.createTextNode(t));
  train_elt.appendChild(document.createElement('br'));
  var t = 'Examples seen: ' + step_num;
  train_elt.appendChild(document.createTextNode(t));
  train_elt.appendChild(document.createElement('br'));

  var run_pause_div = document.getElementById("run_pause_div");
  run_pause_div.innerHTML = '';
  run_pause_div.appendChild(document.createTextNode(t));

  // visualize activations
  if(step_num % 700 === 0) {
    var vis_elt = document.getElementById("visnet");
    if(step_num==0) visualize_activations(net, vis_elt);
    else {
      if(tsneArray.length!=0){
        for(var i=0;i<tsneArray.length;i++) {
          tsneArray[i].change_p(net.layers[tsneArray[i].layer_num]);
        }
      }
    }
  }

  // log progress to graph, (full loss)
  if(step_num % 200 === 0) {
    var xa = xLossWindow.get_average();
    var xw = wLossWindow.get_average();
    if(xa >= 0 && xw >= 0) { // if they are -1 it means not enough data was accumulated yet for estimates
      lossGraph.add(step_num, xa + xw);
      lossGraph.drawSelf(document.getElementById("lossgraph"));
    }
  }

  // run prediction on test set
  if((step_num % 100 === 0 && step_num > 0) || step_num===100) {
    test_predict();
  }


  //// Neural Net Vis ////
  if(step_num % 20 === 0 && !paused_vis) {
    var deepVis_div = document.getElementById("deepVis_div");
    var neural_net_vis = document.getElementById("neural_net_vis");
    var ae = new api_example(net);
    if(step_num === 0){
      window.nnv = new NeuralNetVis("#neural_net_vis", ae.layer_data, "#deepVis_div");
    }else{
      window.nnv.update(ae.layer_data);
    }
    d3.select("#neural_net_vis").style("position", "relative").style("top", "20px");
  }

  $('body').on("click", '.filter_minus', function(){
      var id = $(this).attr("filter_id");
      change_filter(this.net, id, false);
      var ae = new api_example(net);
      window.nnv.update(ae.layer_data);
  });

  $('body').on("click", '.filter_plus', function(){
      var id = $(this).attr("filter_id");
      change_filter(this.net, id, true);
      var ae = new api_example(net);
      window.nnv.update(ae.layer_data);
  });

  $('body').on("click", '.layer_plus', function(){

    change_layer(this.net, true);
    console.log('+++layer');

    var ae = new api_example(net);
    window.nnv.update(ae.layer_data);
  });
 ///////////////////////////////////////////////////////

  step_num++;
}

// user settings 
var change_lr = function() {
  trainer.learning_rate = parseFloat(document.getElementById("lr_input").value);
  update_net_param_display();
}
var change_momentum = function() {
  trainer.momentum = parseFloat(document.getElementById("momentum_input").value);
  update_net_param_display();
}
var change_batch_size = function() {
  trainer.batch_size = parseFloat(document.getElementById("batch_size_input").value);
  update_net_param_display();
}
var change_decay = function() {
  trainer.l2_decay = parseFloat(document.getElementById("decay_input").value);
  update_net_param_display();
}
var update_net_param_display = function() {
  document.getElementById('lr_input').value = trainer.learning_rate;
  document.getElementById('momentum_input').value = trainer.momentum;
  document.getElementById('batch_size_input').value = trainer.batch_size;
  document.getElementById('decay_input').value = trainer.l2_decay;
}
var toggle_pause = function() {
  paused = !paused;
  var btn = document.getElementById('buttontp');
  if(paused) { 
    btn.value = 'resume' 
  }
  else { 
    btn.value = 'pause'; 
  }
}
var toggle_vis = function() {
  paused_vis = !paused_vis;
  var btn = document.getElementById('toggle_vis_btn');
  if(paused_vis) { btn.value = 'resume' }
  else { btn.value = 'pause'; }
}
var dump_json = function() {
  document.getElementById("dumpjson").value = JSON.stringify(this.net.toJSON());
}
var clear_graph = function() {
  lossGraph = new cnnvis.Graph(); // reinit graph too 
}
var reset_all = function() {
  // reinit trainer
  trainer = new convnetjs.SGDTrainer(net, {learning_rate:trainer.learning_rate, momentum:trainer.momentum, batch_size:trainer.batch_size, l2_decay:trainer.l2_decay});
  update_net_param_display();

  // reinit windows that keep track of val/train accuracies
  xLossWindow.reset();
  wLossWindow.reset();
  trainAccWindow.reset();
  valAccWindow.reset();
  testAccWindow.reset();
  lossGraph = new cnnvis.Graph(); // reinit graph too
  step_num = 0;
}
var load_from_json = function() {
  var jsonString = document.getElementById("dumpjson").value;
  var json = JSON.parse(jsonString);
  net = new convnetjs.Net();
  net.fromJSON(json);
  trainer.learning_rate = 0.0001;
  trainer.momentum = 0.9;
  trainer.batch_size = 2;
  trainer.l2_decay = 0.00001;
  reset_all();
}

var load_pretrained = function() {
  $.getJSON(dataset_name + "_snapshot.json", function(json){
    net = new convnetjs.Net();
    net.fromJSON(json);
    trainer.learning_rate = 0.0001;
    trainer.momentum = 0.9;
    trainer.batch_size = 2;
    trainer.l2_decay = 0.00001;
    reset_all();
  });
}

var change_net = function() {
  eval($("#newnet").val());
  reset_all();
}
