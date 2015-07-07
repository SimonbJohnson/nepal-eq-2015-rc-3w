//configuration object

var config = {
    title:"Nepal Earthquake RC Recovery 3W",
    description:"<p>Click the graphs or map to interact. - Date: 06/07/2015",
    data:"data/data.json",
    whoFieldName:"#org",
    whatFieldName:"#sector",
    whereFieldName:"#adm3+code",
    statusFieldName:"#indicator",
    //priorityFieldName:"Priority",
    geo:"data/nepal_adm3.json",
    joinAttribute:"HLCIT_CODE",
    nameAttribute:"DISTRICT",
    color:"#03a9f4"
};

//function to generate the 3W component
//data is the whole 3W Excel data set
//geom is geojson file

function generate3WComponent(config,data,geom){
    
    $('#title').html(config.title);
    $('#description').html(config.description);

    var whoChart = dc.rowChart('#rc-3W-who');
    var whatChart = dc.rowChart('#rc-3W-what');
    var statusChart = dc.pieChart('#rc-3W-status');
    //var priorityChart = dc.pieChart('#rc-3W-priority');
    var whereChart = dc.leafletChoroplethChart('#rc-3W-where');

    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    var whatDimension = cf.dimension(function(d){ return d[config.whatFieldName]; });
    var statusDimension = cf.dimension(function(d){ return d[config.statusFieldName]; });
    //var priorityDimension = cf.dimension(function(d){ return d[config.priorityFieldName]; });
    var whereDimension = cf.dimension(function(d){ return d[config.whereFieldName]; });
    
    var whoGroup = whoDimension.group();
    var whatGroup = whatDimension.group();
    var statusGroup = statusDimension.group();
    //var priorityGroup = priorityDimension.group();
    var whereGroup = whereDimension.group();
    var all = cf.groupAll();

    whoChart.width($('#rc-3W-who').width()).height(270)
            .dimension(whoDimension)
            .group(whoGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(13)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .xAxis().ticks(5);

    whatChart.width($('#rc-3W-what').width()).height(270)
            .dimension(whatDimension)
            .group(whatGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(13)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .xAxis().ticks(5);    
    
    statusChart.width($('#rc-3W-status').width()).height(170)
            .dimension(statusDimension)
            .group(statusGroup)
            .colors([config.color,'#06b9f9'])
            .colorAccessor(function(d, i){return i;});

    //priorityChart.width($('#rc-3W-priority').width()).height(170)
    //        .dimension(priorityDimension)
    //        .group(priorityGroup)
    //        .colors([config.color,'#06b9f9'])
    //        .colorAccessor(function(d, i){return i;}); 

    dc.dataCount('#count-info')
            .dimension(cf)
            .group(all);

    whereChart.width($('#rc-3W-where').width()).height(300)
            .dimension(whereDimension)
            .group(whereGroup)
            .center([0,0])
            .zoom(0)    
            .geojson(geom)
            .colors(['#DDDDDD', config.color])
            .colorDomain([0, 1])
            .colorAccessor(function (d) {
                if(d>0){
                    return 1;
                } else {
                    return 0;
                }
            })           
            .featureKeyAccessor(function(feature){
                return feature.properties[config.joinAttribute];
            }).popup(function(feature){
                return feature.properties[config.nameAttribute];
            })
            .renderPopup(true)
            .featureOptions({
                'fillColor': 'black',
                'color': 'gray',
                'opacity':0.1,
                'fillOpacity': 0,
                'weight': 1
            });

dc.dataTable("#data-table")
                .dimension(whoDimension)                
                .group(function (d) {
                    return d['#adm3+name'];
                })
                .size(650)
                .columns([
                    function(d){
                       return d['#adm3']; 
                    },
                    function(d){
                       return d['#sector']; 
                    },
                    function(d){
                       return d['#org']; 
                    },
                    function(d){
                       return d['#adm4']; 
                    },
                    function(d){
                       return d['#indicator']; 
                    }
                ]);            

    dc.renderAll();
    
    var map = whereChart.map();

    zoomToGeom(geom);
    
    var g = d3.selectAll('#rc-3W-who').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-who').width()/2)
        .attr('y', 268)
        .text('Sum of Activites per VDC');

    var g = d3.selectAll('#rc-3W-what').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-what').width()/2)
        .attr('y', 268)
        .text('Sum of Activites per VDC');

    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }
    
    function genLookup(geojson,config){
        var lookup = {};
        geojson.features.forEach(function(e){
            lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
        });
        return lookup;
    }
}

//load 3W data

var dataCall = $.ajax({ 
    type: 'GET', 
    url: config.data, 
    dataType: 'json',
});

//load geometry

var geomCall = $.ajax({ 
    type: 'GET', 
    url: config.geo, 
    dataType: 'json',
});

//when both ready construct 3W

$.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
    var geom = topojson.feature(geomArgs[0],geomArgs[0].objects.nepal_adm3);
    geom.features.forEach(function(e){
        e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]); 
    });
    generate3WComponent(config,dataArgs[0],geom);
});