var day;
var map;
var markers = [];
var markersLayer = new L.LayerGroup();
var searchTerms = [];
var visibleMarkers = [];
var resetMarkersDaily;
var disableMarkers = [];
var categories = [
    'american-flowers', 'antique-bottles', 'arrowhead', 'bird-eggs', 'coin', 'family-heirlooms', 'lost-bracelet',
    'lost-earrings', 'lost-necklaces', 'lost-ring', 'card-cups', 'card-pentacles', 'card-swords', 'card-wands', 'nazar',
    'fast-travel'
];
var enabledTypes = categories;
var categoryButtons = document.getElementsByClassName("menu-option clickable");

var routesData = [];
var polylines;

var customRouteEnabled = false;
var customRoute = [];
var customRouteConnections = [];

var showCoordinates = false;

var toolType = '3'; //All type of tools
var avaliableLanguages = ['en-us'];
var lang;
var languageData = [];

var nazarLocations = [
    {"id":"1", "x":"-40.5625","y":"109.078125"},
    {"id":"2", "x":"-43","y":"132.828125"},
    {"id":"3", "x":"36.75","y":"153.6875"},
    {"id":"4", "x":"-56.171875","y":"78.59375"},
    {"id":"5", "x":"-63.6640625","y":"105.671875"},
    {"id":"6", "x":"-60.421875","y":"130.640625"},
    {"id":"7", "x":"-66.046875","y":"151.03125"},
    {"id":"8", "x":"-84.4375","y":"82.03125"},
    {"id":"9", "x":"-90.53125","y":"135.65625"},
    {"id":"10","x":"-100.140625","y":"48.8125"},
    {"id":"11","x":"-105.0703125","y":"84.9765625"},
    {"id":"12","x":"-124.03125","y":"34.171875"}
];

var fastTravelLocations = [
    {"text": "fasttravel.tumbleweed", "x": "-109.3203125","y": "26.859375"},
    {"text": "fasttravel.armadillo", "x": "-104.375","y": "53.4140625"},
    {"text": "fasttravel.macfarlanes", "x": "-101.515625","y": "72.4140625"},
    {"text": "fasttravel.manzanita", "x": "-88.5859375","y": "80.7890625"},
    {"text": "fasttravel.blackwater", "x": "-82.9140625","y": "99.765625"},
    {"text": "fasttravel.strawberry", "x": "-70.03125","y": "84.296875"},
    {"text": "fasttravel.valentine", "x": "-53.578125","y": "108.3828125"},
    {"text": "fasttravel.colter", "x": "-25.9296875","y": "91.046875"},
    {"text": "fasttravel.emerald", "x": "-56.7734375","y": "134.8203125"},
    {"text": "fasttravel.rhodes", "x": "-83.6640625","y": "130.65625"},
    {"text": "fasttravel.wapiti", "x": "-29.7265625","y": "118.7890625"},
    {"text": "fasttravel.van_horn", "x": "-53.703125","y": "156.3203125"},
    {"text": "fasttravel.annesburg", "x": "-43.46875","y": "156.765625"},
    {"text": "fasttravel.saint_denis", "x": "-86.328125","y": "152.6796875"},
    {"text": "fasttravel.lagras", "x": "-72.59375","y": "143.859375"}
];

var nazarCurrentLocation = 11;

function init()
{
    if(typeof Cookies.get('removed-items') === 'undefined')
        Cookies.set('removed-items', '', { expires: resetMarkersDaily ? 1 : 999});

    if(typeof Cookies.get('language') === 'undefined')
    {
        if(avaliableLanguages.includes(navigator.language.toLowerCase()))
            Cookies.set('language', navigator.language.toLowerCase());
        else
            Cookies.set('language', 'en-us');
    }

    if(!avaliableLanguages.includes(Cookies.get('language')))
        Cookies.set('language', 'en-us');

    if(typeof Cookies.get('removed-markers-daily') === 'undefined')
        Cookies.set('removed-markers-daily', 'true', 999);

    resetMarkersDaily = Cookies.get('removed-markers-daily') == 'true';
    $("#reset-markers").val(resetMarkersDaily.toString());



    lang = Cookies.get('language');
    $("#language").val(lang);

    disableMarkers = Cookies.get('removed-items').split(';');

    var minZoom = 2;
    var maxZoom = 7;

    var defaultLayer = L.tileLayer('https://s.rsg.sc/sc/images/games/RDR2/map/game/{z}/{x}/{y}.jpg', { noWrap: true});
    var detailLayer = L.tileLayer('assets/maps/detailed/{z}/{x}_{y}.jpg', { noWrap: true});
    var darkLayer = L.tileLayer('assets/maps/darkmode/{z}/{x}_{y}.jpg', { noWrap: true});

    // create the map
    map = L.map('map', {
        minZoom: minZoom,
        maxZoom: maxZoom,
        zoomControl: false,
        crs: L.CRS.Simple,
        layers: [defaultLayer, detailLayer]
    }).setView([-70, 111.75], 3);

    var baseMaps = {
        "Default": defaultLayer,
        "Detailed": detailLayer,
    };


    L.control.layers(baseMaps).addTo(map);

    map.on('click', function (e)
    {
        addCoordsOnMap(e);
    });

    map.on('popupopen', function()
    {
        $('.remove-button').click(function(e)
        {
            var itemName = $(event.target).data("item");
            if(disableMarkers.includes(itemName.toString()))
            {
                disableMarkers = $.grep(disableMarkers, function(value) {
                    $.each(routesData, function(key, j){
                        if (disableMarkers.includes(value.key)){
                            delete value.hidden;
                        }
                    });
                    return value != itemName.toString();
                    
                });
                $(visibleMarkers[itemName]._icon).css('opacity', '1');
            }
            else
            {   
                disableMarkers.push(itemName.toString());
                $.each(routesData[day], function(b, value){
                    if (disableMarkers.includes(value.key)){
                        value.hidden = true;
                    }
                });
                $(visibleMarkers[itemName]._icon).css('opacity', '0.35');
            }

            Cookies.set('removed-items', disableMarkers.join(';'), { expires: resetMarkersDaily ? 1 : 999});
            if($("#routes").val() == 1){drawLines()}


        });
    });

    map.on('baselayerchange', function (e)
    {
        switch(e.name) {
            default:
            case 'Default':
            case 'Detailed':
                $('#map').css('background-color', '#d2b790');
                break;
				
        }
    });

    loadMarkers();
    setCurrentDayCycle();
    loadRoutesData();
    var pos = [-53.2978125, 68.7596875];
    var offset = 1.15;
    L.imageOverlay('overlays/cave_01.png', [[pos], [pos[0] + offset, pos[1] + offset]]).addTo(map);

}

function getNazarPosition()
{
    $.getJSON(`https://madam-nazar-location-api.herokuapp.com/current`, {}, function(x)
    {
        nazarCurrentLocation = x.data._id - 1;
        addNazarMarker();
    });
}

function loadLanguage()
{
    languageData = [];
    $.getJSON(`langs/${lang}.json`, {}, function(data)
    {
        $.each(data, function(key, value) {
            languageData[value.key] = value.value;

        });
        addMarkers();
        setMenuLanguage();
    });
}

function setMenuLanguage()
{
    $.each($('[data-text]'), function (key, value)
    {
        var temp = $(value);
        if(languageData[temp.data('text')] == null) {
            console.error(`[LANG][${lang}]: Text not found: '${temp.data('text')}'`);
        }

        $(temp).text(languageData[temp.data('text')]);
    });
}

function setCurrentDayCycle()
{
    //day1: 2 4 6
    //day2: 0 3
    //day3: 1 5
    var weekDay = new Date().getUTCDay();
    switch(weekDay)
    {
        case 2: //tuesday
        case 4: //thursday
        case 6: //saturday
            day = 1;
            break;

        case 0: //sunday
        case 3: //wednesday
            day = 2;
            break;

        case 1: //monday
        case 5: //friday
            day = 3;
            break;
    }

    $('#day').val(day);

    //Cookie day not exists? create
    if(typeof Cookies.get('day') === 'undefined')
    {
        Cookies.set('day', day, { expires: 1 });
    }
    //if exists, remove markers if the days arent the same
    else
    {
        if(Cookies.get('day') != day.toString())
        {
            Cookies.set('day', day, { expires: 1 });
            if(resetMarkersDaily)
                Cookies.set('removed-items', '', { expires: 1 });
        }
    }
}

function loadRoutesData()
{

    $.getJSON(`assets/routes/day_1.json`, {}, function (data) {
        routesData[1] = data;
    });
    $.getJSON(`assets/routes/day_2.json`, {}, function (data) {
        routesData[2] = data;
    });
    $.getJSON(`assets/routes/day_3.json`, {}, function (data) {
        routesData[3] = data;
    });


}

function drawLines()
{
    var connections = [];
    for (var node of routesData[day]){
        for (var marker of markers){
            if (marker.text == node.key && marker.day ==day && !disableMarkers.includes(node.key) && enabledTypes.includes(marker.icon)){
                var connection = [marker.x, marker.y]
                connections.push(connection);
            }
        }
    }
    

    if (polylines instanceof L.Polyline)
    {
        map.removeLayer(polylines);
    }

    polylines = L.polyline(connections, {'color': '#9a3033'});
    map.addLayer(polylines);

}


function loadMarkers()
{
    markers = [];
    $.getJSON("items.json?nocache=2", {}, function(data)
    {
        markers = data;
        loadLanguage();

        addNazarMarker();
        addfastTravelMarker();
    });

}

function addMarkers()
{
    markersLayer.clearLayers();

    visibleMarkers = [];

    $.each(markers, function (key, value)
    {

        if(value.tool != toolType && toolType !== "3")
            return;

        if(enabledTypes.includes(value.icon))
        {
            if (value.day == day || isNaN(value.day)) //if is not a number, will be nazar or fast travel
            {
                if (languageData[value.text+'.name'] == null)
                {
                    console.error(`[LANG][${lang}]: Text not found: '${value.text}'`);
                }

                if (searchTerms.length > 0)
                {
                    $.each(searchTerms, function (id, term)
                    {
                        if (languageData[value.text+'.name'].toLowerCase().indexOf(term.toLowerCase()) !== -1)
                        {
                            if (visibleMarkers[value.text] == null)
                            {
                                addMarkerOnMap(value);


                                //not working as planned
                                //if (languageData[value.text+'.name'].toLowerCase().indexOf(term.toLowerCase()) == -1)
                                //{
                                //    $(tempMarker._icon).css({'filter': 'grayscale(1)', 'opacity': '0.4'});
                                //}
                            }
                        }
                    });
                }
                else {
                    addMarkerOnMap(value);
                }

            }
        }
    });

    markersLayer.addTo(map);

    removeCollectedMarkers();
}

function addMarkerOnMap(value){
    var tempMarker = L.marker([value.x, value.y], {icon: L.AwesomeMarkers.icon({iconUrl: 'icon/' + value.icon + '.png', markerColor: 'day_' + value.day})});

    switch (value.day) {
        case 'nazar':
            tempMarker.bindPopup(`<h1> ${languageData[value.text + '.name']} - 4th October</h1><p>  </p>`);
            break;
        case 'fasttravel':
            tempMarker.bindPopup(`<h1>${languageData[value.text + '.name']}</h1><p>  </p>`);
            break;
        default:
            tempMarker.bindPopup(`<h1> ${languageData[value.text + '.name']} - День ${value.day}</h1><p> ${languageData[value.text + '_' + value.day + '.desc']} </p><p class="remove-button" data-item="${value.text}">Показать/Скрыть</p>`).on('click', addCoordsOnMap);
            break;
    }


    visibleMarkers[value.text] = tempMarker;
    markersLayer.addLayer(tempMarker);
}

function removeCollectedMarkers()
{

    $.each(markers, function (key, value)
    {
        if(visibleMarkers[value.text] != null)
        {
            if (disableMarkers.includes(value.text.toString()))
            {
                $(visibleMarkers[value.text]._icon).css('opacity', '.35');
            }
            else
            {
                $(visibleMarkers[value.text]._icon).css('opacity', '1');
            }
        }
    });
}

//loads the current location of Nazar and adds a marker in the correct location
function addNazarMarker()
{
    //var nazarMarker = L.marker([nazarLocations[nazarCurrentLocation].x, nazarLocations[nazarCurrentLocation].y], {icon: L.AwesomeMarkers.icon({iconUrl: 'icon/nazar.png', markerColor: 'red'})}).bindPopup(`<h1>Madam Nazar - October 3rd</h1>`).on('click', addCoordsOnMap);
    //markersLayer.addLayer(nazarMarker);

    markers.push({"text": "madam_nazar", "day": "nazar", "tool": "-1", "icon": "nazar", "x": nazarLocations[nazarCurrentLocation].x, "y": nazarLocations[nazarCurrentLocation].y});
}
//adds fasttravel points
function addfastTravelMarker()
{   
    $.each(fastTravelLocations, function(b, value){
        //var ftmarker = L.marker([value.x, value.y], {icon: L.AwesomeMarkers.icon({iconUrl: 'icon/fast-travel.png', markerColor: 'gray'})}).bindPopup(`<h1>${value.text}</h1>`).on('click', addCoordsOnMap);
        //markersLayer.addLayer(ftmarker);
        markers.push({"text": value.text, "day": "fasttravel", "tool": "-1", "icon": "fast-travel", "x": value.x, "y": value.y});

    });
}

function customMarker(coords){
    var nazarMarker = L.marker(coords, {icon: L.AwesomeMarkers.icon({iconUrl: 'icon/nazar.png', markerColor: 'day_4'})}).bindPopup(`<h1>debug</h1>`).on('click', addCoordsOnMap);
    markersLayer.addLayer(nazarMarker);
}

function addCoordsOnMap(coords)
{
    // Show clicked coordinates (like google maps)
    if (showCoordinates) {
        if (document.querySelectorAll('.lat-lng-container').length < 1) {
            var container = document.createElement('div');
            var innerContainer = document.createElement('div');
            var closeButton = document.createElement('button');
            $(container).addClass('lat-lng-container').append(innerContainer);
            $(closeButton).attr('id', 'lat-lng-container-close-button').html('&times;');
            $(innerContainer).html('<p>lat: ' + coords.latlng.lat + '<br> lng: ' + coords.latlng.lng + '</p>').append(closeButton);

            $('body').append(container);

            $('#lat-lng-container-close-button').click(function() {
                $(container).css({
                    display: 'none',
                })
            })
        } else {
            $('.lat-lng-container').css({
                display: '',
            });
            $('.lat-lng-container div p').html('lat: ' + coords.latlng.lat + '<br> lng: ' + coords.latlng.lng);
        }
    }


    // Add custom routes
    if(customRouteEnabled)
    {
        if(event.ctrlKey)
            customRouteConnections.pop();
        else
            customRouteConnections.push(coords.latlng);

        if (customRoute instanceof L.Polyline)
        {
            map.removeLayer(customRoute);
        }

        customRoute = L.polyline(customRouteConnections);
        map.addLayer(customRoute);
    }
}

function changeCursor()
{
    if(showCoordinates || customRouteEnabled)
        $('.leaflet-grab').css('cursor', 'pointer');
    else
        $('.leaflet-grab').css('cursor', 'grab');
}

$("#day").on("input", function()
{
    day = $('#day').val();
    addMarkers();

    if($("#routes").val() == 1)
        drawLines();

});

$("#search").on("input", function()
{
    searchTerms = [];
    $.each($('#search').val().split(';'), function(key, value)
    {
        if($.inArray(value.trim(), searchTerms) == -1)
        {
            if(value.length > 0)
                searchTerms.push(value.trim());
        }
    });
    addMarkers();
});

$("#routes").on("change", function()
{
    if($("#routes").val() == 0) {
        if (polylines instanceof L.Polyline) {
            map.removeLayer(polylines);
        }
    }
    else {
        drawLines();
    }
});

$("#tools").on("change", function()
{
    toolType = $("#tools").val();
    addMarkers();
});

$("#reset-markers").on("change", function()
{
    if($("#reset-markers").val() == 'clear')
    {
        Cookies.set('removed-items', '', { expires: resetMarkersDaily ? 1 : 999});
        disableMarkers = Cookies.get('removed-items').split(';');
        $("#reset-markers").val('false');
    }

    resetMarkersDaily = $("#reset-markers").val() == 'true';
    Cookies.set('removed-markers-daily', resetMarkersDaily, 999);


    removeCollectedMarkers();
});

$("#custom-routes").on("change", function()
{
    var temp = $("#custom-routes").val();
    customRouteEnabled = temp == '1';
    if(temp == 'clear')
    {
        customRouteConnections = [];
        map.removeLayer(customRoute);
        customRouteEnabled = true;
        $("#custom-routes").val('1');
    }

    changeCursor();


});

$('#show-coordinates').on('change', function()
{
    showCoordinates = $('#show-coordinates').val() == '1';

    changeCursor();
});

$("#language").on("change", function()
{
    lang = $("#language").val();
    Cookies.set('language', lang);
    loadLanguage();
});

$('.menu-option.clickable').on('click', function ()
{
    var menu = $(this);
    menu.children('span').toggleClass('disabled');

    if(menu.children('span').hasClass('disabled'))
    {
        enabledTypes = $.grep(enabledTypes, function(value) {
            return value != menu.data('type');
        });
    }
    else {
        enabledTypes.push(menu.data('type'));
    }
    addMarkers();
    if($("#routes").val() == 1)
    drawLines();
});

$('.menu-toggle').on('click', function()
{
    $('.side-menu').toggleClass('menu-opened');

    if($('.side-menu').hasClass('menu-opened'))
    {
        $('.menu-toggle').text('X');
    }
    else
    {
        $('.menu-toggle').text('>');
    }
});


//a hide/show all function
function showall() {
    for (i of categoryButtons){
        i.children[1].classList.remove("disabled")
    }
    enabledTypes = categories;
    addMarkers();
}
function hideall() {
    for (i of categoryButtons){
        i.children[1].classList.add("disabled")
    }
    enabledTypes = [];
    addMarkers();
}