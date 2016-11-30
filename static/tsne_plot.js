var TsnePlot = (function() {
    "use strict";

    //global
    var dotrain = true;
    var L;
    var gs;

    var step = function(data, T, xscale, yscale, zoomBeh, svg, xAxis, yAxis, out) {

        if (dotrain) {
            var cost = T.step(); // do a few steps

            if (T.iter % 200 === 0) {
                // console.log("iter: " + T.iter);
            }

            if (T.iter % 10 === 0) {
                $("#iteration_text").html(T.iter);
                updateEmbedding(T, xscale, yscale, zoomBeh, svg, xAxis, yAxis);
            }
        }
    };

    var getRange = function(data) {
        var xMax = d3.max(data, function(d) {
            return d[0];
        }) * 1.2;
        var xMin = d3.min(data, function(d) {
            return d[0];
        }) * 1.2;
        // xMin = xMin > 0 ? 0 : xMin,
        var yMax = d3.max(data, function(d) {
            return d[1];
        }) * 1.2;
        var yMin = d3.min(data, function(d) {
            return d[1];
        }) * 1.2;
        // yMin = yMin > 0 ? 0 : yMin;

        return {
            xMax: xMax,
            xMin: xMin,
            yMax: yMax,
            yMin: yMin
        };
    };

    var updateEmbedding = function(T, xscale, yscale, zoomBeh, svg, xAxis, yAxis) {

        // get current solution
        var tdata = T.getSolution();

        var range = getRange(tdata);
        xscale.domain([range.xMin, range.xMax]);
        yscale.domain([range.yMin, range.yMax]);

        zoomBeh.x(xscale.domain([range.xMin, range.xMax])).y(yscale.domain([range.yMin, range.yMax]));
        zoomBeh.on("zoom", function() {
            zoom(tdata, svg, xscale, yscale, xAxis, yAxis, gs);
        });

        svg.attr("d", tdata);
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);

        gs.attr("d", tdata)
            .attr("transform", function(d, i) {
                return "translate(" + xscale(tdata[i][0]) + "," + yscale(tdata[i][1]) + ")";
            });

        // gs.attr("d", tdata)
        //     .attr("xlink:href", function(d, i) {
        //         return get_canvas_from_array(L, true, false, i, 3).toDataURL();
        //     });

    };

    var drawEmbedding = function(data, outdom, showImg, isFilter, tsne_width, grads, T) {

        var margin = { top: 0, right: 50, bottom: 50, left: 50 },
            outerWidth = tsne_width,
            outerHeight = outerWidth * 0.8,
            width = outerWidth - margin.left - margin.right,
            height = outerHeight - margin.top - margin.bottom;

        var xscale = d3.scale.linear().range([0, width]).nice();
        var yscale = d3.scale.linear().range([height, 0]).nice();

        var range = getRange(data);
        xscale.domain([range.xMin, range.xMax]);
        yscale.domain([range.yMin, range.yMax]);

        var xAxis = d3.svg.axis()
            .scale(xscale)
            .orient("bottom")
            .tickSize(-height);

        var yAxis = d3.svg.axis()
            .scale(yscale)
            .orient("left")
            .tickSize(-width);

        var tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([0, 0])
            // .append(div)
            .html(function(d, i) {
                // return 'x' + ": " + d[0] + "<br>" + 'y' + ": " + d[1];
                // return '<img src="./download1.png" alt="Mountain View" style="width:100px;height:100px;">';
                // var draw_activations = function(elt, A, scale, grads) {
                if (isFilter) {
                    console.log('filter!!!');
                    var A = nj.float64(L[i]);
                    var depth = A.shape[0];

                    if (depth == 3) {

                        var fimg = get_canvas_from_array(L, isFilter, grads, i, 20).toDataURL();
                        var img_eval = '<img src=' + fimg + ' alt="Mountain View" style="width:100px;height:100px;">';
                        return img_eval;
                    } else {
                        console.log('filters!!');
                        var tip_div = document.createElement('div');

                        for (var j = 0; j < depth; j++) {

                            if (j > 3 && j % 5 === 0) {
                                tip_div.appendChild(document.createElement('br'));
                            }
                            // var get_filter_canvas = function(A, scale, grads, index)
                            //var fimg =  get_filter_canvas(L, 6, grads, j).toDataURL();
                            var A = nj.float64(L[i]);
                            var fimg = get_filter_from_array(A, 8, grads, j).toDataURL();
                            //var img_eval = '<img src=' + fimg + ' alt="Mountain View" style="width:100px;height:100px;margin:5px;">';

                            var img_tag = document.createElement('img');
                            img_tag.className = 'actmap';
                            img_tag.setAttribute('src', fimg);
                            img_tag.setAttribute('style', "margin:1px");

                            tip_div.appendChild(img_tag);
                        }

                        return tip_div.innerHTML;
                    }

                } else {

                    // console.log('not filter');
                    var fimg = get_canvas_from_array(L, isFilter, grads, i, 10).toDataURL();
                    var img_eval = '<img src=' + fimg + ' alt="Mountain View" style="width:100px;height:100px;">';
                    return img_eval;
                }

            });

        var zoomBeh = d3.behavior.zoom()
            .x(xscale)
            .y(yscale)
            .scaleExtent([0, 500]);

        var zoomStop = d3.behavior.zoom();

        var svg = d3.select(outdom)
            .append("svg")
            .attr("width", outerWidth)
            .attr("height", outerHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoomBeh);

        svg.call(tip);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height);

        svg.append("g")
            .classed("x axis", true)
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .classed("label", true)
            .attr("x", width)
            .attr("y", margin.bottom - 10)
            .style("text-anchor", "end");
        // .text('x');

        svg.append("g")
            .classed("y axis", true)
            .call(yAxis)
            .append("text")
            .classed("label", true)
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + margin.right)
            .attr("dy", ".71em")
            .style("text-anchor", "end");
        // .text('y');

        var objects = svg.append("svg")
            .classed("objects", true)
            .attr("width", width)
            .attr("height", height);

        objects.append("svg:line")
            .classed("axisLine hAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0)
            .attr("transform", "translate(0," + height + ")");

        objects.append("svg:line")
            .classed("axisLine vAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height);

        var color = d3.scale.category20();

        gs = objects.selectAll(".dot")
            .data(data)
            .enter().append("g")
            .call(d3.behavior.drag()
                .on("dragstart", dragstarted)
                .on("drag", dragged)
                .on("dragend", dragended));

        var draggedx = 0;
        var draggedy = 0;

        function dragstarted(d, i) {
            var xpos = d3.event.x;
            var ypos = d3.event.y;
            // console.log("drag begins here: " + xpos + "," + ypos);
            dotrain = false; // stop tsne steps
            svg.call(zoomStop); // prevent zoom events
        }

        function dragged(d) {
            var xpos = d3.event.x;
            var ypos = d3.event.y;
            draggedx = xpos;
            draggedy = ypos;

            d3.select(this).attr("transform", function(d, i) {
                return "translate(" + (xpos) + "," + (ypos) + ")"; // move objects to the dragged position
            });
        }

        function dragended(d, i) {
            // console.log(this);
            // console.log(i);
            // console.log(gs);
            var tdata = T.getSolution();
            console.log(tdata);


            console.log("drag done. final position: " + xscale.invert(draggedx) + "," + yscale.invert(draggedy));
            // dotrain = true; // this line will play tsne steps if uncommented
            svg.call(zoomBeh); // recover zoom events

            var dragged = { x: xscale.invert(draggedx), y: yscale.invert(draggedy), i: i };
            var drag_data = { tdata: tdata, drag: dragged };

            $.ajax({
                type: 'POST',
                // Provide correct Content-Type, so that Flask will know how to process it.
                contentType: 'application/json',
                // Encode your data as JSON.
                data: JSON.stringify(drag_data),
                // This is the type of data you're expecting back from the server.
                dataType: 'json',
                url: '/post_drag',
                success: function(e) {
                    console.log(e);
                }
            });

        }

        var circle_change = gs.append("circle")
            .classed("change_circle", true)
            .attr("cx", 7.5)
            .attr("cy", 7.5)
            .attr("r", 1)
            //.attr("transform", transform(data, xscale, yscale))
            .attr("fill", "yellow");

        if (showImg) {

            //            gs.append("rect")
            //                .classed("dot_rect", true)
            //                .attr("width", 15)
            //                .attr("height", 15)
            //             .attr("transform", transform(data, xscale, yscale))
            //             .attr("fill", color);

            gs.append("svg:image")
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 15)
                .attr('height', 15)
                // .attr("xlink:href", canv_img.toDataURL())
                .attr("xlink:href", function(d, i) {
                    return get_canvas_from_array(L, isFilter, grads, i, 3).toDataURL();
                })
                // .attr("xlink:href", function(d) { return "./download1.png"; })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);


        } else {
            gs.append("circle")
                .classed("dot_circle", true)
                .attr("r", 7)
                // .attr("r", function (d) { return 7 * Math.sqrt(3 / Math.PI); })
                // .attr("transform", transform(data, xscale, yscale))
                .attr("fill", color)
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);
        }

        gs.append("text")
            .attr("text-anchor", "top")
            .attr("font-size", 10)
            .attr('x', 3)
            .attr('y', -5)
            .attr("fill", "#333")
            .text(function(d, i) {
                return i;
            });

        zoomBeh.on("zoom", function() {
            zoom(data, svg, xscale, yscale, xAxis, yAxis, gs);
        });

        // var legend = svg.selectAll(".legend")
        //     .data(color.domain())
        //   .enter().append("g")
        //     .classed("legend", true)
        //     .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        // legend.append("circle")
        //     .attr("r", 3.5)
        //     .attr("width", 15)
        //     .attr("height", 15)
        //     // .classed("dots", true)
        //     // .attr("style", "fill:blue;stroke:pink;stroke-width:5;fill-opacity:0.1;stroke-opacity:0.9")
        //     .attr("cx", width + 20)
        //     .attr("fill", color);


        // legend.append("text")
        //     .attr("x", width + 26)
        //     .attr("dy", ".35em")
        // .text(function(d) { return d; });

        // d3.select("#plotbtn").on("click", change);
        //svg.style("opacity", 0);
        return {
            circle_change: circle_change,
            objects: objects,
            xscale: xscale,
            yscale: yscale,
            zoomBeh: zoomBeh,
            svg: svg,
            gs: gs,
            xAxis: xAxis,
            yAxis: yAxis
        };
    };

    var zoom = function(data, svg, xscale, yscale, xAxis, yAxis, gs) {

        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);

        gs.attr("d", data)
            .attr("transform", function(d, i) {
                return "translate(" + xscale(data[i][0]) + "," + yscale(data[i][1]) + ")";

            });
    };

    var transform = function(d, xscale, yscale) {

        return "translate(" + xscale(d[0]) + "," + yscale(d[1]) + ")";
    };

    var tsneplot = function($, inputdata, out, isArrData, showImg, isFilter, layer_num, tsne_width, grads) {
        //constructor
        $("#toggle_train_btn").click(function() {
            console.log('toggle_train');
            dotrain = !dotrain;

            if (dotrain) {
                $(this).text('Pause');
            } else {
                $(this).text('Run');
            }
        });


        var data = inputdata;
        if (isArrData) {

            var njlayer = nj.float64(inputdata);
            var shape = njlayer.shape;
            // console.log(shape);
            // console.log(njlayer.size);
            //32, 3, 3, 3
            var total_val = shape[1] * shape[2] * shape[3];
            var layer_weight = njlayer.reshape(shape[0], total_val);

            data = layer_weight.tolist();
        }

        L = inputdata;

        //Create tsne
        var opt = { epsilon: parseFloat(10), perplexity: parseInt(5) };
        var T = new tsnejs.tSNE(opt); // create a tSNE instance

        T.initDataRaw(data);
        var svgc = drawEmbedding(data, out, showImg, isFilter, tsne_width, grads, T);
        // for(var k = 0; k < 200; k++) {
        //   step(); // every time you call this, solution gets better
        // }
        var iid = setInterval(function() {

            step(data, T, svgc.xscale, svgc.yscale, svgc.zoomBeh,
                svgc.svg, svgc.xAxis, svgc.yAxis, out);

            //       if (T.iter > 50000) {
            //          console.log("tsne stop");
            //          clearInterval(iid);
            //     }

        }, 0);

        this.new_data = function(newinput) {
            dotrain = true;
            var ndata = newinput;

            if (isArrData) {

                var njlayer = nj.float64(newinput);
                var shape = njlayer.shape;
                // console.log(shape);
                // console.log(njlayer.size);
                //32, 3, 3, 3

                var total_val = shape[1] * shape[2] * shape[3];
                var layer_weight = njlayer.reshape(shape[0], total_val);

                ndata = layer_weight.tolist();
            }

            T.changeP(ndata);
            L = newinput;

            gs.attr("d", ndata)
                .select("image")
                .attr("xlink:href", function(d, i) {
                    return get_canvas_from_array(newinput, true, false, i, 3).toDataURL();
                });

        };

        this.new_change = function(rdata) {
            
            svgc.circle_change.data(rdata)
                .transition()
                .duration(3000)
                .attr("r", function(d) {
                    return d * 25;
                });

        };

    };

    return { tsneplot: tsneplot };

})();
