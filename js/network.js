function initNetwork() {
    nodes = new Array;
    for(let i=0; i<locations.length; i++){
        obj = {
            id : i+1,
            name : locations[i]
        }
        nodes.push(obj);
    }

    network_counts = {};

    yint_data.forEach(obj => {
        from = obj.location;
        tmp = obj.mention_locations.slice(1, -1); //removing [] from csv
        if (tmp){
            toArray = tmp.split(',').map(to => to.trim().slice(1, -1));
            toArray.forEach(to => {
                if (locations.includes(from) && locations.includes(to) && from!==to) {
                    network_counts[`${from} - ${to}`] = (network_counts[`${from} - ${to}`] || 0) + 1;
                }
            });
        }
    });

    links = new Array;
    locations.forEach(from => {
        locations.forEach(to => {
            if (from !== to){
                obj = {};
                obj['source'] = locations.indexOf(from)+1;
                obj['target'] = locations.indexOf(to)+1;
                obj['count'] = network_counts[`${from} - ${to}`] || 0;
                links.push(obj);
            }
        });
    });

    network_toolTip = d3.select("#InnovativeView").append('div').classed("ToolTip", true);

    network_svg = d3.select('#networkSVG');

    network_g = network_svg.append('g');

    scale = d3.scaleLinear().domain(d3.extent(links, d=>d.count)).range([1,10]);

    link = network_g.selectAll("line")
                    .data(links)
                    .join("line")
                    .attr("stroke", "black")
                    .on('mouseover', function(d, e){
                        network_toolTip.html(`<strong>${e.count}</strong> messages<br>
                                            from ${e.source.name}<br>
                                            to ${e.target.name}`)
                                    .style('visibility', 'visible');
                    })
                    .on('mousemove', function(d, e){
                        // toolTipWidth = +network_toolTip.style('width').replace('px', '')
                        // toolTipHeight = +network_toolTip.style('height').replace('px', '')
                        // dcx = (e.x <= 1040) ? 10 : -(10+toolTipWidth);
                        // dcy = (e.y >=300) ? -(10+toolTipHeight) : 10;
                        network_toolTip
                            .style('left', `${d.pageX + 10}px`)
                            .style('top', `${d.pageY + 10}px`);
                    })
                    .on('mouseout', function(d) {
                        network_toolTip.style('visibility', 'hidden');
                    });

    node = network_g.selectAll(".node")
                    .data(nodes, d=>d.name)
                    .join("circle")
                    .classed("node", true)
                    .attr("r", 85)
                    .attr("fill", "white")
                    .attr("stroke", "black")
                    .on('mouseover', function(d, e){
                        [sent_least, sent_most] = d3.extent(links.filter(i=>i.source.name===e.name), i=>i.count);
                        sl = links.find(i=>i.source.name===e.name && i.count===sent_least);
                        sm = links.find(i=>i.source.name===e.name && i.count===sent_most);
                        [received_least, received_most] = d3.extent(links.filter(i=>i.target.name===e.name), i=>i.count);
                        rl = links.find(i=>i.target.name===e.name && i.count===received_least);
                        rm = links.find(i=>i.target.name===e.name && i.count===received_most);
                        
                        network_toolTip.html(`<strong>${e.name}</strong> sent the most(${sent_most})<br>
                        messages to <strong>${sm.target.name}</strong><br>
                        <strong>${e.name}</strong> sent the least(${sent_least})<br>
                        messages to <strong>${sl.target.name}</strong><br>
                        <strong>${e.name}</strong> received the most(${received_most})<br>
                        messages from <strong>${rm.source.name}</strong><br>
                        <strong>${e.name}</strong> received the least(${received_least})<br>
                        messages from <strong>${rl.source.name}</strong><br>`)
                                    .style('visibility', 'visible');
                    })
                    .on('mousemove', function(d, e){
                        // toolTipWidth = +network_toolTip.style('width').replace('px', '')
                        // toolTipHeight = +network_toolTip.style('height').replace('px', '')
                        // dcx = (e.x <= 1040) ? 10 : -(10+toolTipWidth);
                        // dcy = (e.y >=300) ? -(10+toolTipHeight) : 10;
                        network_toolTip
                            .style('left', `${d.pageX + 10}px`)
                            .style('top', `${d.pageY + 10}px`);
                    })
                    .on('mouseout', function(d) {
                        network_toolTip.style('visibility', 'hidden');
                    });

    label = network_g.selectAll(".nodeLabel")
                    .data(nodes, d=>d.name)
                    .join("text")
                    .classed('nodeLabel', true)
                    .attr("id", d=>`${d.name.replace(/\s/g, "")}`)
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle")
                    .attr("font-size", 9)
                    .text(d=>d.name)
                    .on('mouseover', function(d, e){
                        [sent_least, sent_most] = d3.extent(links.filter(i=>i.source.name===e.name), i=>i.count);
                        sl = links.find(i=>i.source.name===e.name && i.count===sent_least);
                        sm = links.find(i=>i.source.name===e.name && i.count===sent_most);
                        [received_least, received_most] = d3.extent(links.filter(i=>i.target.name===e.name), i=>i.count);
                        rl = links.find(i=>i.target.name===e.name && i.count===received_least);
                        rm = links.find(i=>i.target.name===e.name && i.count===received_most);
                        
                        network_toolTip.html(`<strong>${e.name}</strong> sent the most(${sent_most})<br>
                        messages to <strong>${sm.target.name}</strong><br>
                        <strong>${e.name}</strong> sent the least(${sent_least})<br>
                        messages to <strong>${sl.target.name}</strong><br>
                        <strong>${e.name}</strong> received the most(${received_most})<br>
                        messages from <strong>${rm.source.name}</strong><br>
                        <strong>${e.name}</strong> received the least(${received_least})<br>
                        messages from <strong>${rl.source.name}</strong><br>`)
                                    .style('visibility', 'visible');
                    })
                    .on('mousemove', function(d, e){
                        // toolTipWidth = +network_toolTip.style('width').replace('px', '')
                        // toolTipHeight = +network_toolTip.style('height').replace('px', '')
                        // dcx = (e.x <= 1040) ? 10 : -(10+toolTipWidth);
                        // dcy = (e.y >=300) ? -(10+toolTipHeight) : 10;
                        network_toolTip
                            .style('left', `${d.pageX + 10}px`)
                            .style('top', `${d.pageY + 10}px`);
                    })
                    .on('mouseout', function(d) {
                        network_toolTip.style('visibility', 'hidden');
                    });;

    simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink().links(links).id(d=>d.id).distance(160))
                    .force("charge", d3.forceManyBody().strength(-10000))
                    .force("x", d3.forceX(705).strength(0.06))
                    .force("y", d3.forceY(392).strength(0.54))
                    .on("tick", ticked)
                    .on("end", initRadarChart);

    function ticked() {
        link.attr("x1", d=>d.source.x)
            .attr("y1", d=>d.source.y)
            .attr("x2", d=>d.target.x)
            .attr("y2", d=>d.target.y)
            .attr("stroke-width", d=> scale(d.count))
            .attr("stroke-opacity", 0.2);
        
        node.attr("cx", d=>d.x)
            .attr("cy", d=>d.y);
        
        label.attr("x", d=>d.x)
            .attr("y", d=>d.y-78);
    }

    function initRadarChart() {
        radar_g = network_svg.append('g');
        nodes.forEach(e => {
            g = radar_g.append('g').attr("transform", `translate(${e.x}, ${e.y})`);
            drawRadarChart(g, e.name);
        });
    }
}
