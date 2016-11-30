function run_train() {
    console.log("run train");
    $.ajax({
        type: 'POST',
        // Provide correct Content-Type, so that Flask will know how to process it.
        contentType: 'application/json',
        // Encode your data as JSON.
        data: JSON.stringify({}),
        // This is the type of data you're expecting back from the server.
        dataType: 'json',
        url: '/run_model',
        success: function(e) {
            console.log(e);
        }
    });

    var input_img_div = document.getElementById("input_img_div");
    input_img_div.innerHTML = '<br><br><img src="/static/cifar_10_horse.png" alt="horse View" style="width:50px; display: inline-block;">';

    var control_div = document.getElementById("control_div");
    control_div.innerHTML = "";

}

$(document).ready(function() {

    var monitored = {};
    var source = new EventSource('/subscribe/epoch/end/');
    var chart = null;

    var out_div = document.getElementById("scatter");
    var vis_div = document.getElementById("visualization");
    var test_div = document.getElementById("test_div");

    var eg_data = [
        [32.380120, -86.300629],
        [58.299740, -134.406794],
        [33.448260, -112.075774],
        [34.748655, -92.274494],
        [38.579065, -121.491014],
        [39.740010, -104.992259],
        [41.763325, -72.674069]
    ];


    //var S = new TsnePlot.tsneplot($, eg_data, out, false, false, false, 0, 300, false); // create a scatterjs instance

    var tsne_plot;
    var wave_plot;

    source.addEventListener('message', function(e) {

        var data = JSON.parse(e.data);

        if (data.type == 'model') {
            console.log(data);

            layer_array = data.weight


            /////////////////////////////////////////////////////////////////////////////
            // activation image start
            //test_div.innerHTML = "";

            //for (var i = 0; i < data.activation.length; i++) {
            //  for (var j = 0; j < data.activation[i].length; j++) {
            //    test_div.appendChild(get_canvas_from_array(data.activation[i], false, false, j, 3));
            //}
            // test_div.appendChild(document.createElement("br"));
            // test_div.appendChild(document.createElement("br"));
            //}
            //console.log(get_canvas_from_array(input_data, true, false, data_index, 3).toDataURL());
            /////////////////////////////////////////////////////////////////////////////


            if (tsne_plot === undefined) {
                console.log('Create tsne plot');
                tsne_plot = new TsnePlot.tsneplot($, layer_array, out_div, true, true, false, 0, 900, false);
            } else {
                console.log('Update tsne plot');
                tsne_plot.new_data(layer_array);
                tsne_plot.new_change(data.filter_grad[0]);
            }

            if (wave_plot === undefined) {
                console.log('Create wave plot');
                wave_plot = new WavePlot(vis_div, data, 900, 720);
            } else {
                console.log('Update wave plot');
                wave_plot.update(data);
                //wave_plot.new_change(data);
            }

            var dis_data = { dis: data.dis };


        } else if (data.type == 'graph') {

            if (chart === null) {
                for (key in data) {
                    monitored[key] = [key, data[key]];
                }
                var columns = [];
                for (key in monitored) {
                    columns.push(monitored[key]);
                }
                chart = c3.generate({
                    bindto: '#c3graph',
                    data: {
                        x: 'epoch',
                        columns: columns
                    }
                });
            } else {
                for (key in data) {
                    if (key in monitored) {
                        monitored[key].push(data[key]);
                    }
                    var columns = [];
                    for (key in monitored) {
                        columns.push(monitored[key]);
                    }
                    chart.load({
                        columns: columns
                    });
                }
            }

        }

    }, false);

});
