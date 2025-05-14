function populateDropdown(keywords) {
    d3.select('.dropdown-menu').on("click", function(e) {e.stopPropagation()})

    keywords.forEach(e => {
        let check = d3.select('.dropdown-menu').append('li').classed("dropdown-item", true);
        check.on("click", function(e) {
            if (e.target.classList.contains("dropdown-item")){
                d3.select(this).select('input').node().click();
            }
        });
        check.append('input')
                .classed("form-check-input", true)
                .attr("id", e)
                .attr("type", "checkbox")
                .attr("value", e)
                .style("margin-right", "10px")
                .on("click", drawAreaChart);
        check.append('label')
                .attr("class", "form-check-label")
                .attr("for", e)
                .html(`<svg  width="15" height="15">
                <rect width="15" height="15"
                style="fill:${color(e)};" />
              </svg>  ` + e);
    });
};

function initAreaChart() {
    populateDropdown(Object.keys(keywords));
    sel_keywords = new Array;
    
    keyword_counts = {}
    yint_data.forEach(obj => {
        tmp = obj.keyword_info;
        roundedTime = new Date(Math.floor(Date.parse(obj.time)/(30*60000))*(30*60000));
        keyword_counts[roundedTime] = keyword_counts[roundedTime] || {};
        if (tmp) {
            tmp = tmp.split('],');
            tmp.forEach(e => {
                [kw, temp] = e.split(':[');
                kw = kw.trim();
                keyword_counts[roundedTime][kw] = (keyword_counts[roundedTime][kw] || 0) + 1;
            });
        }
    });
    
    keyword_count_data = [];
    for (const time in keyword_counts) {
        obj = { time, ...keyword_counts[time] };
        Object.keys(keywords).forEach(key => {
            obj[key] = obj[key] || 0;
        });
        keyword_count_data.push(obj);
    }

    area_toolTip = d3.select("#AreaChart").append('div').classed("ToolTip", true);

    area_svg = d3.select('#areaSVG');
    areaSvgWidth = +area_svg.style("width").replace('px', '');
    areaSvgHeight = +area_svg.style("height").replace('px', '');

    area_margin = {top: 0, right: 10, bottom: 90, left: 50};
    area_innerWidth = areaSvgWidth - area_margin.left - area_margin.right;
    area_innerHeight = areaSvgHeight - area_margin.top - area_margin.bottom;

    area_g = area_svg.append('g').attr('transform', `translate(${area_margin.left}, ${area_margin.top})`);
    area_yAxis = area_g.append('g');
    area_xAxis = area_g.append('g').attr('transform', `translate(0, ${area_innerHeight})`);
    area_xScale = d3.scaleTime()
                    .domain(d3.extent(yint_data, d=>new Date(d.time)))
                    .range([0, area_innerWidth]);
    area_xAxis.call(d3.axisBottom(area_xScale));

    area_xAxis.append('text')
                .attr("x", area_innerWidth/2)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .attr("font-size", 14)
                .text("Year");
    
    area_yAxis.append('text')
                .attr("y", -30)
                .attr("x", -(area_innerHeight/2))
                .attr("transform", "rotate(-90)")
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .attr("font-size", 14)
                .text("Frequency");

    // area_g.on("click", function(d){

    //     area_xAxis.select('.newtick').remove();

    //     mouseX = d3.pointer(d)[0];
    //     clickedTime = area_xScale.invert(mouseX);
    //     tick_g = area_xAxis.append('g').classed('newtick', true)
    //                         .attr("opacity", 1)
    //                         .attr("transform", `translate(${mouseX}, 0)`)
    //     tick_g.append("line")
    //                 .attr("y2", 6)
    //                 .attr("stroke", "red");
        
    //     time_f = d3.timeFormat("%H:%M");
    //     tick_g.append("text")
    //                 .attr("y", 9)
    //                 .attr("dy", "0.71em")
    //                 .attr("text-anchor", "middle")
    //                 .attr("fill", "red")
    //                 .text(time_f(new Date(clickedTime)));
    // });

    inflections = [["2020-04-09 05:41:48", "2020-04-09 10:57:14"],
    ["2020-04-08 13:37:40", "2020-04-08 20:56:30"],
    ["2020-04-10 03:33:00", "2020-04-10 09:15:00"]];

    earthquake_hits = [["2020-04-06 14:30:00", "2020-04-06 19:30:00"],
    ["2020-04-08 09:00:00", "2020-04-08 14:00:00"],
    ["2020-04-09 15:00:00", "2020-04-09 20:00:00"]];
    mark_path = "M 0,0 5,7 5,14 -5,14 -5,7 z";
    area_xAxis.selectAll('.quakemark')
                .data(earthquake_hits)
                .enter()
                .append("g")
                .classed("quakemark", true)
                .attr("transform", d=>`translate(${area_xScale(new Date(d[0]))}, 0)`)
                .append("path")
                .attr("d", mark_path)
                .attr("fill", color("earthquake"))
                .on("click", function(d, e){
                    brush_g.call(brush.move, [new Date(e[0]), new Date(e[1])].map(area_xScale));
                });
    area_xAxis.selectAll('.inflection')
                .data(inflections)
                .enter()
                .append("g")
                .classed("inflection", true)
                .attr("transform", d=>`translate(${area_xScale(new Date((Date.parse(d[0])+Date.parse(d[1]))/2))}, 0)`)
                .append("path")
                .attr("d", mark_path)
                .attr("fill", "black")
                .on("click", function(d, e){
                    brush_g.call(brush.move, [new Date(e[0]), new Date(e[1])].map(area_xScale));
    });

    brush_g = area_svg.append('g').attr('transform', `translate(${area_margin.left}, ${area_margin.top})`);
    brush = d3.brushX().extent([[0,0],[area_innerWidth, area_innerHeight]])
                .on("brush", function(d) {
                    selection = d.selection;
                    [stime, etime] = selection.map(area_xScale.invert);
                    interval = (((Date.parse(etime)-Date.parse(stime))/(60*60000)).toFixed(1));
                    console.log(interval);
                    area_g.selectAll('.brushTime')
                            .data([interval], e=>e)
                            .join("text")
                            .classed("brushTime", true)
                            .attr("x", selection[0])
                            .attr("y", 20)
                            .attr("fill", "black")
                            .text(e=>`${e} hrs`);
                })
                .on("end", brushed);
    brush_g.call(brush);
    
    function brushed(d) {
        selection = d.selection;
        if (start_time === yint_data[0].time && end_time === yint_data[yint_data.length-1].time){
            if(selection === null) return;
        }
        if (selection === null) {
            area_g.selectAll('.brushTime').remove();
            start_time = yint_data[0].time;
            end_time = yint_data[yint_data.length-1].time;
        }
        else{
            [start_time, end_time] = selection.map(area_xScale.invert);
            if (Date.parse(end_time)-Date.parse(start_time)<30*60000){
                start_time = yint_data[0].time;
                end_time = yint_data[yint_data.length-1].time;
                selection = null;
                return;
            }
        }
        drawChoropleth();
        drawBarChart();
        drawSlopeGraph();
        calculateTFIDF();
        selected_locations.forEach(loc => {
            if (loc==="Wilson Forest") return;
            drawWordCloud(loc);
        })
    }

    d3.select("li #earthquake").attr("checked", true).dispatch("click");
}

function drawAreaChart() {
    kw = d3.select(this).node().value;
    if (sel_keywords.includes(kw)) sel_keywords.splice(sel_keywords.indexOf(kw), 1);
    else sel_keywords.push(kw)
    // sel_keywords = [...d3.selectAll('.form-check-input')].filter(c => c.checked).map(c => c.value);
    d3.select('#dropdownMenuButton').html(`${sel_keywords.length} keywords are selected`);
    
    area_plot_data = keyword_count_data.map(obj => {
        ret = {};
        ret.time = obj.time;
        sel_keywords.forEach(kw=>{
            ret[kw] = obj[kw];
        })
        return ret;
    });

    max_sum = d3.max(area_plot_data, d=>d3.sum(Object.values(d).slice(1)));
    area_yScale = d3.scaleLinear()
                    .domain([0, max_sum])
                    .range([area_innerHeight, 0]);
    

    stack = d3.stack().keys(sel_keywords);
    stack_data = stack(area_plot_data);

    area_g.selectAll(".stacks")
            .data(stack_data, d=>d.key)
            .join("path")
            .classed("stacks", true)
            .style("fill", d=>color(d.key) )
            .attr("d", d3.area()
                            .x(d=>area_xScale(new Date(d.data.time)))
                            .y0(d=>area_yScale(d[0]))
                            .y1(d=>area_yScale(d[1]))
                            .curve(d3.curveMonotoneX)
            );

    area_yAxis.transition().duration(750).call(d3.axisLeft(area_yScale));

}