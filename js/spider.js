function drawRadarChart(g, loc) {
    radar_filtered_data = yint_data.filter(d=>d.location===loc);
    user_msg_counts = {};
    radar_filtered_data.forEach(e=>{
        usr = e.account;
        user_msg_counts[usr] = (user_msg_counts[usr] || 0) + 1;
    });

    top_users = Object.entries(user_msg_counts).sort((a,b) => b[1]-a[1]).slice(0, 3).map(d=>d[0]);
    radar_plot_data = [];
    idx = 0;
    top_users.forEach(usr=>{
        usr_filtered_data = radar_filtered_data.filter(d=>d.account===usr);
        usr_word_counts = {};
        usr_filtered_data.forEach(obj => {
            tmp = obj.keyword_info;
            if (tmp) {
                tmp = tmp.split('],');
                tmp.forEach(e => {
                        [kw, temp] = e.split(':[');
                        kw = kw.trim();
                        usr_word_counts[kw] = (usr_word_counts[kw] || 0) + 1;
                });
            }
        });
        usr_data = Object.keys(keywords).map(function (key) {
            obj = {};
            obj["axis"] = key;
            obj["real_value"] = usr_word_counts[key] || 0;
            obj["value"] = d3.min([10, obj["real_value"]]);
            obj["idx"] = idx;
            return obj;
        });
        obj = {};
        obj.user = usr;
        obj.data = usr_data;
        radar_plot_data.push(obj);
        idx++;
    });

    axis_g = g.append("g");

    axis_g.selectAll(".levels")
            .data(d3.range(1,4).reverse())
            .join("circle")
            .classed("levels", true)
            .attr("r", d=>22*d)
            .attr("fill", "#CDCDCD")
            .attr("stroke", "#CDCDCD")
            .attr("fill-opacity", 0.1);

    maxValue = d3.max(radar_plot_data, d=>d3.max(d.data, i=>i.value));
    radar_scale = d3.scaleLinear().range([0, 65]).domain([0, maxValue]);
    pie_angle = Math.PI*2 / 9;

    radar_axis = axis_g.selectAll(".axis")
                        .data(radar_plot_data[0].data.map(d=>d.axis))
                        .join('g')
                        .attr("class", "axis");

    radar_axis.append("line")
                .attr("x2", (d, i)=>radar_scale(maxValue) * Math.cos(pie_angle*i - Math.PI/2))
                .attr("y2", (d, i)=>radar_scale(maxValue) * Math.sin(pie_angle*i - Math.PI/2))
                .attr("stroke", "white")
                .attr("stroke-width", "2px");


    radar_axis.append("text")
                .style("font-size", "7")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("x", (d, i)=>radar_scale(maxValue*1.1) * Math.cos(pie_angle*i - Math.PI/2))
                .attr("y", (d, i)=>radar_scale(maxValue*1.1) * Math.sin(pie_angle*i - Math.PI/2))
                .text(d=>d);

    radarLine = d3.lineRadial().curve(d3.curveCardinalClosed)
                                .radius((d)=>radar_scale(d.value))
                                .angle((d,i)=>i*pie_angle);
                                    	
    g.selectAll(".radarArea")
        .data(radar_plot_data)
        .join("path")
        .classed("radarArea", true)
        .attr("d", d=>radarLine(d.data))
        .attr("fill", (d,i)=>radarColor(i))
        .attr("fill-opacity", 0.35)
        .on('mouseover', function (d,e){
            d3.selectAll(".radarArea")
                .transition().duration(500)
                .attr("fill-opacity", 0.1); 
            d3.select(this)
                .transition().duration(500)
                .attr("fill-opacity", 0.7);
            info = `<strong>${e.user}</strong><br>`;
            e.data.forEach(obj=>{
                info += `${obj.axis}: <strong>${obj.real_value}</strong><br>`;
            })
            network_toolTip.html(info)
                .style('visibility', 'visible');
        })
        .on('mousemove', function(d){
            network_toolTip.style('left', `${d.pageX + 10}px`)
                            .style('top', `${d.pageY + 10}px`);
        })
        .on('mouseout', function(){
            d3.selectAll(".radarArea")
                .transition().duration(500)
                .attr("fill-opacity", 0.35);
            network_toolTip.style('visibility', 'hidden');
        });
                                	
    g.selectAll(".radarStroke")
        .data(radar_plot_data)
        .join("path")
        .classed("radarStroke", true)
        .attr("d", d=>radarLine(d.data))
        .attr("stroke-width", 2)
        .attr("stroke", (d,i)=>radarColor(i))
        .attr("fill", "none")
        .on('mouseover', function (d,e){
            d3.selectAll(".radarArea")
                .transition().duration(500)
                .attr("fill-opacity", 0.1); 
            d3.select(this)
                .transition().duration(500)
                .attr("fill-opacity", 0.7);
            info = `<strong>${e.user}</strong><br>`;
            e.data.forEach(obj=>{
                info += `${obj.axis}: <strong>${obj.real_value}</strong><br>`;
            })
            network_toolTip.html(info)
                .style('visibility', 'visible');
        })
        .on('mousemove', function(d){
            network_toolTip.style('left', `${d.pageX + 10}px`)
                            .style('top', `${d.pageY + 10}px`);
        })
        .on('mouseout', function(){
            d3.selectAll(".radarArea")
                .transition().duration(500)
                .attr("fill-opacity", 0.35);
            network_toolTip.style('visibility', 'hidden');
        });		


    radar_plot_data.forEach(obj=>{
        g.selectAll(`#radarDot${obj.user}`)
            .data(obj.data)
            .join("circle")
            .attr("id", `radarDot${obj.user}`)
            .attr("r", 2)
            .attr("cx", (d,i)=>radar_scale(d.value) * Math.cos(pie_angle*i - Math.PI/2))
            .attr("cy", (d,i)=>radar_scale(d.value) * Math.sin(pie_angle*i - Math.PI/2))
            .attr("fill",d=> radarColor(d.idx))
            .attr("fill-opacity", 0.8);
    });
}