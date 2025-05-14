function initBarChart() {

    bar_toolTip = d3.select("#BarChart").append('div').classed("ToolTip", true);

    bar_svg = d3.select('#barSVG');
    barSvgWidth = +bar_svg.style("width").replace('px', '');
    barSvgHeight = +bar_svg.style("height").replace('px', '');
    
    bar_margin = {top: 35, right: 10, bottom: 0, left: 130};
    bar_innerWidth = barSvgWidth - bar_margin.left - bar_margin.right;
    bar_innerHeight = barSvgHeight - bar_margin.top - bar_margin.bottom;

    bar_g = bar_svg.append('g').attr('transform', `translate(${bar_margin.left}, ${bar_margin.top})`);
    bar_xAxis = bar_g.append('g').attr('transform', `translate(0, ${16*16 + 5})`);

    bar_svg.append('text')
            .attr("y", 22)
            .attr("x", barSvgWidth/2)
            .attr("text-anchor", "middle")
            .attr("font-size", 14)
            .text("Hashtag Bar Chart");

    drawBarChart();
}


function drawBarChart() {
    if (selected_locations.length===0) bar_filtered_data = yint_data;
    else bar_filtered_data = yint_data.filter(d=>selected_locations.includes(d.location));
    bar_filtered_data = bar_filtered_data.filter(d=>Date.parse(d.time)>=Date.parse(start_time)
                                                 && Date.parse(d.time)<=Date.parse(end_time));

    hashtagCounter = {};
    bar_filtered_data.forEach(e => {
        hashtags = e.hashtag;
        if (hashtags) { 
            hashtagArray = hashtags.split(',').map(tag => tag.trim());
            hashtagArray.forEach(hashtag => {
                hashtagCounter[hashtag] = (hashtagCounter[hashtag] || 0) + 1;
            });
        }    
    });
    hashtagCounter = Object.entries(hashtagCounter).sort((a, b) => b[1] - a[1]).slice(0,16);

    bar_xScale = d3.scaleLinear()
                    .domain([0, d3.max(hashtagCounter, d=>d[1])])
                    .range([0, bar_innerWidth]);
    
    bar_g.selectAll('rect')
            .data(hashtagCounter, d=>d[0])
            .join(
                enter => enter.append("rect")
                                .attr("y", (d,i) => i*16)
                                .attr("height", 15)
                                .attr("fill", "#808000")
                                .call(enter=> {
                                    enterDelay = ([...enter].length === hashtagCounter.length) 
                                                ? 0
                                                : 750;
                                    enter.transition().delay(enterDelay).duration(750)
                                            .attr("width", d=>bar_xScale(d[1]))}),
                update => update.call(update => {
                    update.transition().duration(750)
                            .attr("width", d=>bar_xScale(d[1]));
                    update.transition().delay(750).duration(750)
                            .attr("y", (d, i) => i*16);
                }),
                exit => exit.call(exit => {
                    exit.transition().duration(750)
                            .attr("width", 0)
                            .remove()
                })
            )
            .on('mouseover', function(d, e){
                bar_toolTip.html(`#${e[0]}<br>Count: ${e[1]}`)
                            .style('visibility', 'visible');
            })
            .on('mousemove', function(d, e){
                // toolTipWidth = +bar_toolTip.style('width').replace('px', '')
                // toolTipHeight = +bar_toolTip.style('height').replace('px', '')
                // dcx = (e.x <= 1040) ? 10 : -(10+toolTipWidth);
                // dcy = (e.y >=300) ? -(10+toolTipHeight) : 10;
                bar_toolTip
                    .style('left', `${d.pageX + 10}px`)
                    .style('top', `${d.pageY + 10}px`);
            })
            .on('mouseout', function(d) {
                bar_toolTip.style('visibility', 'hidden');
            });

    bar_g.selectAll('.hashtag')
            .data(hashtagCounter, d=>d[0])
            .join(
                enter => enter.append("text")
                                .classed("hashtag", true)
                                .text(d=>`#${d[0]}`)
                                .attr("y", (d,i) => i*16 + 10)
                                .attr("x", -5)
                                .attr("font-size", 11)
                                .style("fill", "black")
                                .attr("fill-opacity", 0)
                                .style("text-anchor", "end")
                                .call(enter=> {
                                    enterDelay = ([...enter].length === hashtagCounter.length) 
                                                ? 0
                                                : 750;
                                    enter.transition().delay(enterDelay).duration(750)
                                            .attr("fill-opacity", 1)}),
                update => update.call(update => {
                    update.transition().delay(750).duration(750)
                            .attr("y", (d, i) => i*16 + 10)
                            .attr("fill-opacity", 1);
                }),
                exit => exit.call(exit => {
                    exit.transition().duration(750)
                            .attr("fill-opacity", 0)
                            .remove()
                })
            );

    bar_xAxis.transition().duration(750).call(d3.axisBottom(bar_xScale));
}