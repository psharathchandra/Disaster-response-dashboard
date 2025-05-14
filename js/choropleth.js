selected_locations = [];

function initChoropleth() {

    choro_toolTip = d3.select("#ChoroplethMap").append('div').classed("ToolTip", true);

    choropleth_svg = d3.select('#choroSVG');
    choroSvgWidth = +choropleth_svg.style("width").replace('px', '');
    choroSvgHeight = +choropleth_svg.style("height").replace('px', '');

    map_g = choropleth_svg.append('g');
    legend = choropleth_svg.append('g')
                .attr("transform", `translate(10, ${choroSvgHeight-60})`);

    d3.select(`#choroSelect`)
        .selectAll('option')
        .data(Object.keys(keywords))
        .enter()
        .append('option')
        .property("value", d=>d)
        .html(d=>d.charAt(0).toUpperCase() + d.slice(1));

    projection = d3.geoIdentity()
                    .reflectY(true)
                    .fitSize([550,330],geo_data);
    path = d3.geoPath().projection(projection);
    
    map_paths = map_g.selectAll(".map_path")
                        .data(geo_data.features)
                        .enter()
                        .append("path")
                        .classed("map_path", true)
                        .attr("id", d=>d.properties.Nbrhood)
                        .attr("d", path)
                        .attr("stroke", "black")
                        .attr("stroke-width", "1px")
                        .on('click', function(d){
                            place = d3.select(this);
                            if (selected_locations.includes(place.node().id)) {
                                idx = slope_locations.indexOf(place.attr("id"));
                                selected_locations.splice(selected_locations.indexOf(place.attr("id")), 1);
                                place.attr("stroke-width", "1px");
                                initWordCloud();
                                removeWordCloud(place.attr("id"), idx);
                            }
                            else {
                                selected_locations.push(place.attr("id"));
                                place.attr("stroke-width", "2.5px");
                                initWordCloud();
                                drawWordCloud(place.attr("id"));
                            }
                            drawBarChart();
                            drawSlopeGraph();
                        });

    map_paths.each(function (){
        place = d3.select(this).node()
        bbox = place.getBBox();
        tx = ty = tr = 0;
        switch (place.id) {
            case "Chapparal":
                tr = -90;
                tx = 10;
                break;
            case "Wilson Forest":
                tr = -90;
                break;
            case "Southwest":
                tx = -20;
                ty = 10;
                break;
            case "Southton":
                ty = -15;
                break;
            case "Scenic Vista":
                tr = -30;
                break;
            default:
                tx = tr = ty = 0;
        }
        x =  bbox.x + bbox.width/2 + tx;
        y =  bbox.y + bbox.height/2 + ty;
        map_g.append("text")
                .text(place.id)
                .attr("text-anchor", "middle")
                .attr("font-size", 9)
                .attr("transform", `translate(${x}, ${y}) rotate(${tr})`);
    });

    drawChoropleth();
};


function drawChoropleth() {
    choro_filtered_data = yint_data.filter(d=>Date.parse(d.time)>=Date.parse(start_time) 
                                        && Date.parse(d.time)<=Date.parse(end_time));

    choro_selected_keyword = d3.select("#choroSelect").node().value;

    choro_counts = {};

    choro_filtered_data.forEach(obj => {
        tmp = obj.keyword_info;
        if (tmp) {
            tmp = tmp.split('],');
            tmp.forEach(e => {
                    [kw, temp] = e.split(':[');
                    kw = kw.trim();
                    if (kw===choro_selected_keyword) {
                        choro_counts[obj.location] = (choro_counts[obj.location] || 0) + 1;
                    }
                    // [w, sidx, eidx] = temp.split(',');
                    // sidx = parseInt(sidx);
                    // eidx = parseInt(eidx);
                    // console.log(kw, w, sidx, eidx);
                });
        }
    });

    colorCodes = colorScheme(choro_selected_keyword);

    choro_color = d3.scaleQuantile()
                .domain(d3.extent(Object.values(choro_counts)))
                .range(colorCodes);

    map_paths.each(function () {
        place = d3.select(this);;
        place.attr("fill", choro_color((choro_counts[place.node().id] || 0)));
        place.on('mouseover', function(d, e){
            total_count = d3.sum(Object.values(choro_counts));
            percent = ((choro_counts[e.properties.Nbrhood] || 0)*100) / total_count;
            percent = percent.toFixed(2);
            choro_toolTip.html(`<strong>${percent}%</strong> ${choro_selected_keyword}<br>
                                messages are from<br><strong>${e.properties.Nbrhood}</strong>`)
                        .style('visibility', 'visible');
        })
        .on('mousemove', function(d, e){
            // toolTipWidth = +choro_toolTip.style('width').replace('px', '')
            // toolTipHeight = +choro_toolTip.style('height').replace('px', '')
            // dcx = (e.x <= 1040) ? 10 : -(10+toolTipWidth);
            // dcy = (e.y >=300) ? -(10+toolTipHeight) : 10;
            choro_toolTip
                .style('left', `${d.pageX + 10}px`)
                .style('top', `${d.pageY + 10}px`);
        })
        .on('mouseout', function(d) {
            choro_toolTip.style('visibility', 'hidden');
        });       
    });

    [min, max] = d3.extent(Object.values(choro_counts));
    colorQuantiles = choro_color.quantiles();
    colorQuantiles.unshift(min);
    colorQuantiles.push(max);

    legend.selectAll('*').remove();

    legend.selectAll(".rect")
            .data(colorCodes)
            .join("rect")
            .attr("x", (d, i)=>i*25)
            .attr("y", 0)
            .attr("width", 25)
            .attr("height", 20)
            .attr("fill", d=>d);
    
    legend.selectAll(".text")
            .data(colorQuantiles)
            .join("text")
            .text(d=>d.toFixed(1))
            .attr("x", (d,i)=>i*25)
            .attr("y", 30)
            .attr("font-size", 9)
            .style("text-anchor", "middle");
};
