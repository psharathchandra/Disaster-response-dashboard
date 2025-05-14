function TFIDF(TF, DF, N) {
    return Math.log1p(TF) * (1+ Math.log(N / (1 + DF)));
}


function calculateTFIDF () {
    word_filtered_data = yint_data.filter(d=>Date.parse(d.time)>=Date.parse(start_time)
                                        && Date.parse(d.time)<=Date.parse(end_time));
    
    word_tfs = {}
    word_DFs = {}

    word_filtered_data.forEach(obj => {
        tmp = obj.keyword_info;
        loc = obj.location;
        if (!locations.includes(loc)) return
        word_tfs[loc] = word_tfs[loc] || {};
        if (tmp) {
            tmp = tmp.split('],');
            tmp.forEach(e => {
                    [kw, temp] = e.split(':[');
                    kw = kw.trim();
                    [w, sidx, eidx] = temp.split(',');
                    word_tfs[loc][`${kw} - ${w}`] = (word_tfs[loc][`${kw} - ${w}`] || 0) + 1;
                    word_DFs[`${kw} - ${w}`] = word_DFs[`${kw} - ${w}`] || new Set;
                    if (locations.includes(loc)) word_DFs[`${kw} - ${w}`].add(loc);
            });
        }
    });

    word_TFIDF_data = new Array;
    for(loc in word_tfs) {
        for(key in word_tfs[loc]){
            obj = {};
            obj.location = loc;
            [kw, w] = key.split(' - ')
            obj["keyword"] = kw;
            obj["word"] = w;
            obj["count"] = word_tfs[loc][key];
            obj["tfidf"] = TFIDF(word_tfs[loc][key], word_DFs[key].size, locations.length);
            word_TFIDF_data.push(obj);
        }
    }
}

function addSlide(num) {
    if (d3.select(`#slide${num}`).node()) return;

    slide = d3.select('.carousel-inner')
                .append('div')
                .classed("carousel-item", true)
                .attr("id", `slide${num}`);
    if (num===1) slide.classed("active", true);
    slide.append('svg')
            .classed("wordSVG", true)
            .attr("id", `wordSVG${num}`);
}


function removeSlide(num) {
    d3.select(`#slide${num-1}`).classed("active", true);
    d3.select(`#slide${num}`).remove();
}


function initWordCloud() {
    word_toolTip = d3.select("#wordcloudtooltip");
    slope_locations = selected_locations;
    slideNumber = Math.floor((slope_locations.length-1)/6) + 1;
    if (slope_locations.length%6===1) {
        addSlide(slideNumber);
    }
    else if (slope_locations.length%6===0) {
        removeSlide(slideNumber+1);
    }
}


function drawWordCloud(loc, slideNumber=null, row=null, col=null) {
    if (row===null) row = Math.floor(((slope_locations.length-1)%6)/3);
    if (col===null) col = ((slope_locations.length-1)%6)%3;
    if (slideNumber===null) slideNumber = Math.floor((slope_locations.length-1)/6) + 1;

    word_svg = d3.select(`#wordSVG${slideNumber}`);

    location_g = d3.select(`#g${loc.replace(/\s/g, "")}`);
    if (!location_g.node()){
        location_g = word_svg.append('g')
                            .attr("id", `g${loc.replace(/\s/g, "")}`)
                            .attr("transform", `translate(${col*315+10}, ${row*340+10})`);
        
        location_g.append("text")
                    .text(loc)
                    .attr("x", 150)
                    .attr("y", 10)
                    .attr("text-anchor", "middle");
    }
    
    word_g = location_g.select('g');
    if (!word_g.node()) word_g = location_g.append('g').attr("transform", "translate(0, 30)");

    word_plot_data = word_TFIDF_data.filter(d=>d.location===loc);

    // word_filtered_data = yint_data.filter(d=>d.location===loc);
    // word_filtered_data = word_filtered_data.filter(d=>Date.parse(d.time)>=Date.parse(start_time)
    //                                              && Date.parse(d.time)<=Date.parse(end_time));

    // word_counts = {}

    // word_filtered_data.forEach(obj => {
    //     tmp = obj.keyword_info;
    //     if (tmp) {
    //         tmp = tmp.split('],');
    //         tmp.forEach(e => {
    //                 [kw, temp] = e.split(':[');
    //                 kw = kw.trim();
    //                 [w, sidx, eidx] = temp.split(',');
    //                 word_counts[`${kw} - ${w}`] = (word_counts[`${kw} - ${w}`] || 0) + 1;
    //         });
    //     }
    // });

    // word_plot_data = Object.keys(word_counts).map(function (key) {
    //     obj = {};
    //     [kw, w] = key.split(' - ')
    //     obj["keyword"] = kw;
    //     obj["word"] = w;
    //     obj["count"] = word_counts[key];
    //     // obj["tf-idf"] = 
    //     return obj;
    // });
    

    fontScale = d3.scaleLinear()
                        .domain(d3.extent(word_plot_data, d=>d.tfidf))
                        .range([10, 40]);

    cloud_layout = d3.layout.cloud()
                        .size([300, 300])
                        .words(word_plot_data)
                        .padding(2)
                        .rotate(0)
                        .text(d=>d.word)
                        .fontSize(d => fontScale(d.tfidf))
                        .on("end", drawLayout);
    cloud_layout.start();
}


function drawLayout(words) {
    hidemsgviewer();
    word = word_g.selectAll('.cloudWord')
                .data(words, e=>e.text)
                .join("text")
                .classed('cloudWord', true)
                .attr("id", e=>`cloud_${e.keyword}`)
                .style("font-size", e=>e.size)
                .style("fill", e=>color(e.keyword))
                .attr("text-anchor", "middle")
                .attr("transform", e => `translate(${e.x+150}, ${e.y+130})`)
                .text(e => e.text)
                .attr("fill-opacity", 0)
                .on("mouseover", function(d, e){
                    word_svg.selectAll('.cloudWord').style("fill-opacity", 0.3);
                    word_svg.selectAll(`#cloud_${e.keyword}`).style("fill-opacity", 1);
                })
                .on("mousemove", function(d, e){
                    word_svg.selectAll(`.${e.keyword}`).style("fill-opacity", 1);
                })
                .on("mouseout", function(d){
                    word_svg.selectAll('.cloudWord').style("fill-opacity", 1);
                })
                .on("click", function(d, e) {
                    messageviewerdata=yint_data.filter(d=>d.location==e.location&&d.message.toLowerCase().includes(e.text))
                    messageviewerdata=messageviewerdata.slice(0,20)
                    ypos=d.pageY-500;
                    word_toolTip=word_toolTip
                        .style('visibility', 'visible')
                        .style('left', `${d.pageX}px`)
                        .style('top', `${ypos-5}px`)
                    createToolTipTable(messageviewerdata,e.text,color(e.keyword));
                });
    word.transition()
        .delay((e,i)=>i*20)
        .duration(500)
        .attr("fill-opacity", 1);
}


function createToolTipTable(data, text, color){
    tbody=d3.selectAll("#tableToolTipBody")
    tbody.html('')
    for (let d of data){
        var re = new RegExp(text, 'i');
        message=d.message.replace(re,`<b style="color:${color}">${text}</b`)
        tbody.append("tr").html(`<td>${(d.time+"").slice(0,10)+(d.time+"").slice(15,21)}</td><td>${d.location}</td><td>${d.account}</td><td>${message}</td>`);
    }
}

function hidemsgviewer(){
    word_toolTip.style('visibility','hidden')
}


function removeWordCloud(loc, idx) {
    if (idx===slope_locations.length) {
        d3.select('.carousel-inner').select(`#g${loc.replace(/\s/g, "")}`)
            .attr("fill-opacity", 0).remove();
        return;
    }
    else {
        new_loc = selected_locations.pop();
        selected_locations.splice(idx, 0, new_loc);
        slope_locations = selected_locations;

        row = Math.floor((idx%6)/3);
        col = (idx%6)%3;
        slideNumber = Math.floor(idx/6) + 1;
        d3.select('#WordCloud').select(`#g${loc.replace(/\s/g, "")}`).remove();
        d3.select('#WordCloud').select(`#g${new_loc.replace(/\s/g, "")}`).remove();

        drawWordCloud(new_loc, slideNumber, row, col);
    }
}
