function initSlopeGraph() {

    slope_svg = d3.select('#slopeSVG');
    slopeSvgWidth = +slope_svg.style("width").replace('px', '');
    slopeSvgHeight = +slope_svg.style("height").replace('px', '');
    
    slope_margin = {top: 30, right: 30, bottom: 40, left: 30};

    slope_xAxis = slope_svg.append('g').attr("text-anchor", "middle");

    slope_g = slope_svg.append('g');

    drawSlopeGraph();
}

function drawSlopeGraph() {
    if (selected_locations.length===0) slope_filtered_data = yint_data;
    else slope_filtered_data = yint_data.filter(d=>selected_locations.includes(d.location));
    slope_filtered_data1 = slope_filtered_data.filter(d=>Date.parse(d.time)>=Date.parse(start_time)-900000 && Date.parse(d.time)<=Date.parse(start_time)+900000);
    slope_filtered_data2 = slope_filtered_data.filter(d=>Date.parse(d.time)>=Date.parse(end_time)-900000 && Date.parse(d.time)<=Date.parse(end_time)+900000);

    slope_counts1 = {};
    slope_counts2 = {};

    slope_filtered_data1.forEach(obj => {
        tmp = obj.keyword_info;
        if (tmp) {
            tmp = tmp.split('],');
            tmp.forEach(e => {
                    [kw, temp] = e.split(':[');
                    kw = kw.trim();
                    slope_counts1[kw] = (slope_counts1[kw] || 0) + 1;
                });
        }
    });
    slope_filtered_data2.forEach(obj => {
        tmp = obj.keyword_info;
        if (tmp) {
            tmp = tmp.split('],');
            tmp.forEach(e => {
                    [kw, temp] = e.split(':[');
                    kw = kw.trim();
                    slope_counts2[kw] = (slope_counts2[kw] || 0) + 1;
                });
        }
    });

    slope_plot_data = Object.keys(keywords).map(function (key) {
        obj = {};
        obj["keyword"] = key;
        obj[start_time] = slope_counts1[key] || 0;
        obj[end_time] = slope_counts2[key] || 0;
        return obj;
    });

    slope_xScale = d3.scalePoint()
                        .domain([start_time, end_time])
                        .range([slope_margin.left, slopeSvgWidth-slope_margin.right])
                        .padding(0.5);

    slope_yScale = d3.scaleLinear()
                        .domain(d3.extent(slope_plot_data.flatMap(d=>[d[start_time], d[end_time]])))
                        .range([slopeSvgHeight-slope_margin.bottom, slope_margin.top]);
    
    slope_xAxis.selectAll('*').remove();
    slope_xAxis.selectAll("g")
                .data([start_time, end_time])
                .join("g")
                .attr("transform", d => `translate(${slope_xScale(d)},15)`)
                .append('text')
                .attr('font-size', 14)
                .text(d=>formatTime(d));

    slope_g.selectAll("line")
                .data(slope_plot_data, d=>d.keyword)
                .join("line")
                .attr("stroke", d=>color(d.keyword))
                .attr("stroke-width", 3)
                .attr("x1", slope_xScale(start_time))
                .attr("x2", slope_xScale(end_time))
                .transition()
                .duration(1000)
                .attr("y1", d=>slope_yScale(d[start_time]))
                .attr("y2", d=>slope_yScale(d[end_time]));

    left_y = dodge(slope_plot_data.map(d=>slope_yScale(d[start_time])));
    right_y = dodge(slope_plot_data.map(d=>slope_yScale(d[end_time])));
    
    for(let i=0; i<slope_plot_data.length; i++) {
        slope_plot_data[i]["ly"] = left_y[i];
        slope_plot_data[i]["ry"] = right_y[i];
    }

    slope_g.selectAll(".left_labels")
            .data(slope_plot_data, d=>d.keyword)
            .join("text")
            .classed("left_labels", true)
            .text(d=>`${d.keyword} ${d[start_time]}`)
            .attr("font-size", 12)
            .attr("text-anchor", "end")
            .attr("x", slope_xScale(start_time)-3)
            .transition()
            .duration(1000)
            .attr("y", d=>d.ly+3);

    lbl = slope_g.selectAll(".right_labels")
            .data(slope_plot_data, d=>d.keyword)
            .join("text")
            .classed("right_labels", true)
            .attr("font-size", 12)
            .attr("text-anchor", "start")
            .attr("x", slope_xScale(end_time)+3)
            .text(d=>`${d[end_time]} ${d.keyword} `);
    lbl.transition()
        .duration(1000)
        .attr("y", d=>d.ry+2);
    lbl.append("tspan")
        .text(d=>`(${Math.abs(d[end_time]-d[start_time])})`)
        .attr("font-size", 12)
        .attr("font-weight", "bold")
        .style("fill", d=>(d[end_time]<d[start_time])? "red" : "green");
}

function dodge(positions, separation = 12, maxiter = 10, maxerror = 1e-1) {
    positions = Array.from(positions);
    let n = positions.length;
    if (!positions.every(isFinite)) throw new Error("invalid position");
    if (!(n > 1)) return positions;
    let index = d3.range(positions.length);
    for (let iter = 0; iter < maxiter; ++iter) {
        index.sort((i, j) => d3.ascending(positions[i], positions[j]));
        let error = 0;
        for (let i = 1; i < n; ++i) {
            let delta = positions[index[i]] - positions[index[i - 1]];
            if (delta < separation) {
                delta = (separation - delta) / 2;
                error = Math.max(error, delta);
                positions[index[i - 1]] -= delta;
                positions[index[i]] += delta;
            }
        }
        if (error < maxerror) break;
    }
    return positions;
}

