/*
@author Günther Jungbluth
*/

var map_json = {};
var speed = 1.0;
var img = "img/week46.png";
var img_black = "img/black.png";
var canvas;
var context;
var locX = 0, locY = 0;
var motX = 1, motY = 0;
var json_index = 0;
var direction = "E";
var tile_size = 6;
var lastAction = "echo";
var chunks = {};
var isFinished = false;
var budget = 0;
var men = 0;
var creeks = {};
var isPaused = false;
var loadedJson = {};

//Let's initialize the canvas and load the context
function initialize(json) {
    map_json = json;
    clearBoard();
    lastAction = "echo";
    chunks = {};
    creeks = {};
    json_index = 1;
    isFinished = false;
    locX = 0;
    locY = 0;
    isPaused = false;
    updatePause();
    direction = map_json[0].data.heading;
    budget = map_json[0].data.budget;
    men = map_json[0].data.men;
    updateMotion(direction);
}

function clearBoard() {
    context.fillStyle = "#000000";
    context.fillRect(0,0,600,600);
}

//Loads the json map from the file input
function onSelectMap(event) {
    var selectedFile = event.target.files[0];
    var reader = new FileReader();
    isFinished = true;

    reader.onload = function(event) {
        loadedJson = JSON.parse(event.target.result);
    };

    reader.readAsText(selectedFile);
}

//Prototype poru convertir une image en base64 (pour le canvas)
File.prototype.convertToBase64 = function(callback){
        var FR= new FileReader();
        FR.onload = function(e) {
             callback(e.target.result)
        };       
        FR.readAsDataURL(this);
}

function onSelectImg(event) {
    var selectedFile = event.target.files[0];
    isFinished = true;
    selectedFile.convertToBase64(function(r){
        img = r;
    });
}

//Prints a tile at x,y
function printTile(src,x,y) { 
    printMapPart(src,x,y, tile_size);
}

//Prints part of the map at x,y
function printMapPart(src,x,y, size) { 
    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, x*tile_size, y*tile_size, size*3, size*3, tile_size*x, tile_size*y, size*3, size*3);
    };
    imageObj.src = src;
}

//Prints the drone, needs progress
function printPlane(src,x,y) { 
    src="img/gray.png";
    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 0, 0, 32, 32, tile_size*x, tile_size*y, tile_size*3, tile_size*3);
    };
    imageObj.src = src;
}

//Prints a creek at x,y
function printCreek(x, y, color) {
    context.beginPath();
    if(!color)
        color ="#FF0000"
    printCircle(x, y, tile_size, color);
}

//Prints a circle at x,y
function printCircle(x, y, size, color) {
    context.beginPath();
    if(!color)
        color ="#FF0000"
    context.arc(tile_size*x+size/2, tile_size*y+size/2, size, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.stroke();
}

//Prints the crew
function printCrew(x, y) {
    context.beginPath();
    context.moveTo(tile_size*x-tile_size/2, tile_size*y-tile_size/2);
    context.lineTo(tile_size*x+tile_size/2, tile_size*y+tile_size/2);
    context.strokeStyle = "#FF0000";
    context.stroke();
    context.beginPath();
    context.moveTo(tile_size*x-tile_size/2, tile_size*y+tile_size/2);
    context.lineTo(tile_size*x+tile_size/2, tile_size*y-tile_size/2);
    context.stroke();
}

//Moves the drone and update the display
function moveDrone() {
    if(chunks[locX*3+":"+locY*3] == undefined)
        printTile(img_black, locX*3, locY*3);
    move();
    if(chunks[locX*3+":"+locY*3] == undefined)
        printPlane("img/drone_"+direction.toLowerCase()+".png", locX*3, locY*3);
}

//Update the coordinates
function move() {
    locX+=motX;
    locY+=motY;
}

//Starts the game
function start() {
    stop();
    setTimeout(function(){
        initialize(loadedJson);
        $("#input_map").val("");
        $("#input_map_pic").val("");
        handleJson(map_json[json_index]);
    }, 50);
}

//Arrete la simulation
function stop() {
    isFinished = true;
}

function pause() {
    isPaused = !isPaused;
    updatePause();
}

function updatePause() {
    $("#btn_pause").html(isPaused ? "Continuer" : "Pause");
}

//Update the motion according to a direction
function updateMotion(dir) {
    switch(dir) {
        case "N":
            motX=0;motY=-1;
            break;
        case "S":
            motX=0;motY=1;
            break
            case "E":
            motX=1;motY=0;
            break;
        case "W":
            motX=-1;motY=0;
            break;
    }
}

//Saves the creeks
function addCreeks(_creeks, x, y) {
    for(var i in _creeks) {
        var id = _creeks[i];
        creeks[id] = {x:x, y:y};
    }
}

//Handles the different game steps
function handleJson(json) {
    setTimeout(function () {
        if(isFinished) {
            return;
        }
        if(isPaused) {
            handleJson(json);
            return;
        } 
        if(json.part == "Explorer") {
            switch(json.data.action) {
                case "land":
                    for(var i in creeks) {
                        var creek = creeks[i]
                        printCreek(creek.x, creek.y, "#FF0000");
                    }
                    var creek = creeks[json.data.parameters.creek];
                    locX = creek.x;
                    locY = creek.y;
                    printCreek(locX, locY, "#FFFF00");
                    break;
                case "move_to":
                    printCircle(locX, locY, 2, "#AAAAAA");
                    updateMotion(json.data.parameters.direction);
                    move();
                    break;
                case "fly":
                    moveDrone();
                    break;
                case "scan":
                    chunks[locX*3+":"+locY*3] = {};
                    printTile(img, locX*3, locY*3);
                    break;
                case "heading":
                    moveDrone();
                    updateMotion(json.data.parameters.direction);
                    moveDrone();
                    direction = json.data.parameters.direction;
                    break;
            }
            lastAction = json.data.action;
        } else if(json.part == "Engine") {
            switch(lastAction) {
                case "scan":
                if(json.data.extras.creeks.length != 0) {
                    addCreeks(json.data.extras.creeks, locX*3, locY*3);
                    printCreek(locX*3, locY*3);
                }
                break;
            }
        }
        if(json_index < map_json.length) {
            handleJson(map_json[json_index++]);
        }
    }, speed*100);
}

//Load the necessary content when the page is ready
$(document).ready(function(){
    canvas = document.getElementById('map');
    context = canvas.getContext('2d');
    
    $( "#speed_bar" ).slider({
        range: "max",
        min: 0,
        max: 1000,
        value: 500,
        slide: function( event, ui ) {
            speed = (1000-$('#speed_bar').slider("option", "value"))/500;
        }
    });
    $("#speed_bar").keyup(function() {
        $("#speed_bar").slider("value" , $(this).val())
    });
    clearBoard();
});