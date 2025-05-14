document.addEventListener('DOMContentLoaded', function() {

    locations = ['Palace Hills', 'Northwest', 'Old Town', 'Safe Town', 
            'Southwest', 'Downtown', 'Wilson Forest', 'Scenic Vista', 'Broadview', 'Chapparal', 
            'Terrapin Springs', 'Pepper Mill', 'Cheddarford', 'Easton', 'Weston', 'Southton', 
            'Oak Willow', 'East Parton', 'West Parton'];

    colors = ["#9C7D67", "#F16913", "#1A237E", "#4BC8FF", 
            "#FFEB3B", "#CB181D", "#6A51A3", "#737373", "#238B45"];

    schemeYellows = ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176",
                    "#FFEE58", "#FFEB3B", "#FDD835", "#FBC02D"];

    schemeBrowns = ["#EFEBE9", "#D7CCC8", "#BCAAA4", "#A1887F", 
                    "#8D6E63", "#795548", "#6D4C41", "#5D4037"];

    schemeDarkBlues = ["#E8EAF6", "#C5CAE9", "#9FA8DA", "#7986CB",
                        "#5C6BC0", "#3F51B5", "#303F9F", "#1A237E"];

    colorSchemes = [schemeBrowns, d3.schemeOranges[8], schemeDarkBlues,
                    d3.schemeBlues[8], schemeYellows, d3.schemeReds[8], 
                    d3.schemePurples[8], d3.schemeGreys[8], d3.schemeGreens[8]];

    radarColor = d3.scaleOrdinal(d3.schemeCategory10);

    Promise.all([d3.json('data/StHimark.geojson'),
                d3.json('data/keywords.json'),
                d3.csv('data/data.csv')])
                .then(function (values) {
        
        [geo_data, keywords, yint_data] = values;
        
        parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        yint_data.forEach(e => {
                e.time = parseTime(e.time);
        });
        start_time = yint_data[0].time;
        end_time = yint_data[yint_data.length-1].time;

        color = d3.scaleOrdinal().domain(Object.keys(keywords)).range(colors);
        colorScheme = d3.scaleOrdinal().domain(Object.keys(keywords)).range(colorSchemes);
        
        initAreaChart();
        initChoropleth();
        calculateTFIDF();
        initWordCloud();
        initSlopeGraph();
        initBarChart();
        initNetwork();

    });
});


