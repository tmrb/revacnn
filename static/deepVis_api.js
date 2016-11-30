var get_dim = function(a) {
    var dim = [];
    for (;;) {
        dim.push(a.length);

        if (Array.isArray(a[0])) {
            a = a[0];
        } else {
            break;
        }
    }
    return dim;
}

var get_canvas_from_array = function(L, isFilter, grads, index, scale) {

  //(256, 128, 3, 3)
  //(index, depth, sx, sy)
  
  var A = nj.float64(L[index]);
  var depth = A.shape[0]
  var sx = A.shape[1]
  var sy = A.shape[2]

  var isColor = false;
  if(depth == 3) { isColor = true; }
  
  var s = scale || 2; // scale
  //if(isFilter) s = 4;

  var draw_grads = false;
  if(typeof(grads) !== 'undefined') draw_grads = grads;

  // // get max and min activation to scale the maps automatically
  // var w = draw_grads ? A.dw : A.w;
  
  var rangeA = nj.float64(L);
  var minv = rangeA.min()
  var maxv = rangeA.max()
  var mmdv = maxv - minv

  if (sx != 1) {
      minv = A.min()
      maxv = A.max()
      mmdv = maxv - minv
  }
    
  var testa = [];
  //console.log('a shape: '+A.shape);

  var canv = document.createElement('canvas');
  canv.className = 'actmap';
  var W = sx * s;
  var H = sy * s;
  canv.width = W;
  canv.height = H;
  var ctx = canv.getContext('2d');
  var g = ctx.createImageData(W, H);

  if(isColor) { // draw a color img
    for(var d=0;d<3;d++) {
      for(var x=0;x<sx;x++) {
        for(var y=0;y<sy;y++) {
          if(draw_grads) {
            var dval = Math.floor((A.get(d, y, x)-minv)/mmdv*255);
          } else {
            var dval = Math.floor((A.get(d, y, x)-minv)/mmdv*255);  
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
  }
  else { //draw a black & white img
    if(isFilter) {

      for(var x=0;x<sx;x++) {
        for(var y=0;y<sy;y++) {
          var dval = 0
          //calculate average of the filter weights
          for(var d=0;d<depth;d++) {
            if(draw_grads) {
              dval += Math.floor((A.get(d, y, x)-minv)/mmdv*255);
            } else {
              dval += Math.floor((A.get(d, y, x)-minv)/mmdv*255);  
            }
          }
          dval = dval/depth;
          for(var dx=0;dx<s;dx++) {
            for(var dy=0;dy<s;dy++) {
              var pp = ((W * (y*s+dy)) + (dx + x*s)) * 4;
              for(var i=0;i<3;i++) { g.data[pp + i] = dval; } // rgb
              g.data[pp+3] = 255; // alpha channel
            }
          }
        }
      }
    } 
    else {
      
        var d = 0;
        
        for(var x=0;x<sx;x++) {
          for(var y=0;y<sy;y++) {
            
            var dval = Math.floor((A.get(d, y, x)-minv)/mmdv*255);
            testa.push(dval);
            for(var dx=0;dx<s;dx++) {
              for(var dy=0;dy<s;dy++) {
                var pp = ((W * (y*s+dy)) + (dx + x*s)) * 4;
                for(var i=0;i<3;i++) { g.data[pp + i] = dval; } // rgb
                g.data[pp+3] = 255; // alpha channel
              }
            }
          }
        }
      } //else end
    } //else end
   
  //console.log(L[index]);
  //console.log(testa);
  ctx.putImageData(g, 0, 0);
  return canv;
}


var get_filter_from_array = function(A, scale, grads, index) {
  
  var depth = A.shape[0]
  var sx = A.shape[1]
  var sy = A.shape[2]
  
  var s = scale || 2; // scale
  var draw_grads = false;
  if(typeof(grads) !== 'undefined') draw_grads = grads;

  // get max and min activation to scale the maps automatically
  //var w = draw_grads ? A.dw : A.w;
  var minv = A.min()
  var maxv = A.max()
  var mmdv = maxv - minv
  // create the canvas elements, draw and add to DOM
  var d = index;

  var canv = document.createElement('canvas');
  canv.className = 'actmap';
  var W = sx * s;
  var H = sy * s;
  canv.width = W;
  canv.height = H;
  var ctx = canv.getContext('2d');
  var g = ctx.createImageData(W, H);

  for(var x=0;x<sx;x++) {
    for(var y=0;y<sy;y++) {
      
      var dval = Math.floor((A.get(d, y, x)-minv)/mmdv*255);

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












var get_canvas_img = function(L, index) {

  // var get_layer_canvas = function(L, isFilter, grads, index, 2) {
  // if(L.layer_type == 'conv') {
  return get_canvas_from_array(L, true, false, index, 3);
  // }
  // else if(L.layer_type == 'relu') {
  //   return get_layer_canvas(L, false, false, index, 2);
  // }
  // else if(L.layer_type == 'pool') {
  //   return get_layer_canvas(L, false, false, index, 2);
  // }
  // else if(L.layer_type == 'softmax') {
  //   return get_layer_canvas(L, false, false, index, 10);
  // }
  // else if(L.layer_type == 'fc') {
  //   return get_layer_canvas(L, false, false, index, 10);
  // }
  // else if(L.layer_type == 'input') {
  //   return get_layer_canvas(L, false, false, index, 2);
  // }
  // else {
  //   console.log('Invalid layer');
  // }

}


var get_number_of_elements_in_layer = function(L) {

  if(L.layer_type == 'conv') {
      return L.filters.length;
  }
  else {
    if(L.layer_type == 'input')
      return 1;
    else 
      return L.out_act.depth;
  }
}

var get_grad_magnitude = function(L, index){

  var isFilter = true;

  var A = {};
  if(isFilter) {
    A = L.filters[index];
  } else {
    A = L.out_act;
  }
  var grad_magnitude = 0.0;
  var area = A.sx * A.sy * A.depth;
  // console.log(A.depth);
  if(isFilter) {
    for(var d=0;d<A.depth ; d++) {
      for(var x=0;x<A.sx;x++) {
        for(var y=0;y<A.sy;y++) {
          var A_grad=A.get_grad(x,y,d);
          grad_magnitude+=A_grad*A_grad;  
        }
      }
    }
  }else {
    // var d = index;
    // for(var x=0;x<A.sx;x++) {
    //   for(var y=0;y<A.sy;y++) {
    //     var A_grad=A.get_grad(x,y,d);
    //     grad_magnitude+=A_grad*A_grad;
    //   }
    // }
  }

  return grad_magnitude * 200 / area;
}

var get_path_intensity = function(L1, L2, index){

  var isFilter = false;

  if(L1.layer_type == 'conv') {
    isFilter = true;
  }

  var A = {};
  if(isFilter) {
    A = L1.filters[index];
  } else {
    A = L1.out_act;
  }
  var path_intensity = 0.0;
  var area = A.sx * A.sy / 100;

  if(isFilter) {
    for(var d=0;d<A.depth ; d++) {
      for(var x=0;x<A.sx;x++) {
        for(var y=0;y<A.sy;y++) {
          var act=A.get(x,y,d);
          if(act < 0) act = -1 * act;
          path_intensity+=act;  
        }
      }
    }
  } else {
     if(L1.layer_type == 'pool' && (L2.layer_type == 'conv' || L2.layer_type == 'fc')) {
      var num_out = get_number_of_elements_in_layer(L2);
      var path_arr = [];
      for(var i=0; i<num_out; i++) {

        path_intensity = 0.0;
        stride = L2.stride;
        var d = index;
        var B = L2.filters[i];
        for(var x=0;x<A.sx;x+=stride) {
          for(var y=0;y<A.sy;y+=stride) {
            for(var fx=0;fx<B.sx;fx++) {
              for(var fy=0;fy<B.sy;fy++) {

                var act=A.get(x,y,d);
                var weights = B.get(fx,fy,d);
                var conval = act*weights
                path_intensity+=conval;
              }
            }
          }
        }
        area = area * B.sx * B.sy;
        if(path_intensity < 0) path_intensity = -1 * path_intensity;
        path_arr.push(path_intensity / area);
      }
      return path_arr;
    } else {
      var d = index;
      for(var x=0;x<A.sx;x++) {
        for(var y=0;y<A.sy;y++) {
          var act=A.get(x,y,d);
          if(act < 0) act = -1 * act;
          path_intensity+=act;
        }
      }
    }
  }

  if(L1.layer_type == 'input') {
    var num_out = get_number_of_elements_in_layer(L2);
    var path_arr = [];
    for(var i=0; i<num_out; i++) {
      path_arr.push(path_intensity / area);
    }

    return path_arr;
  }

  var path_arr = [];
  path_arr.push(path_intensity / area);
  return path_arr;
}

