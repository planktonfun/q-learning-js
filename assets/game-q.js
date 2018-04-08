(function() {
	var timeouts = [];
	var messageName = "zero-timeout-message";

	function setZeroTimeout(fn) {
		timeouts.push(fn);
		window.postMessage(messageName, "*");
	}

	function handleMessage(event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation();
			if (timeouts.length > 0) {
				var fn = timeouts.shift();
				fn();
			}
		}
	}

	window.addEventListener("message", handleMessage, true);

	window.setZeroTimeout = setZeroTimeout;
})();


var QLearn = function() {
    this.logs = {};
    this.rewardTable = {};
    this.transitionMatrix = {};
    this.learningRate = 0.1;
    this.use = false;
    this.display = false;
    this.addState = function(currentState, action, rewardFromNextState, nextState) {
        this.rewardTable[nextState] = rewardFromNextState;

        if(this.logs[currentState+'->'+action+'->'+nextState] == undefined) {
            this.logs[currentState+'->'+action+'->'+nextState] = rewardFromNextState;
        }

        if(this.transitionMatrix[currentState] == undefined) {
            this.transitionMatrix[currentState] = {};
        }

        var maxOfNextState = 0;

        for(var value in this.transitionMatrix[nextState]) {
            if(this.transitionMatrix[nextState][value] > maxOfNextState) {
                maxOfNextState = this.transitionMatrix[nextState][value];
            }
        }

        this.transitionMatrix[currentState][action] = this.rewardTable[nextState] + (this.learningRate*maxOfNextState);
    }

    this.getBestPolicy = function(state) {
        var actionPool = this.transitionMatrix[state];
        var action = 'undefined';
        var maxScore = -99999999;

        for(var key in actionPool) {
            var score = actionPool[key];

            if(score >= maxScore) {

                if(score == maxScore) {

                } else {
                    maxScore = score;
                    action = key;
                }
            }
        }

        if(this.display) {
        	console.log(action);
        }

        return action;
    }

    this.getTransitionMatrix = function() {
        return this.transitionMatrix;
    }

    this.converge = function() {

		var inititalTransition = JSON.stringify(this.getTransitionMatrix());
	    while (true) {
            for (var keys in this.logs) {
                var reward = this.logs[keys];
                var params = keys.split('->');
                this.addState(params[0], params[1], reward, params[2]);
            }

	        if (inititalTransition != JSON.stringify(this.getTransitionMatrix())) {
	            inititalTransition = JSON.stringify(this.getTransitionMatrix());
	        } else {
    			this.use = true;
	            break;
	        }
	    }
    }

};

var Qgame = new QLearn;
var game;
var FPS = 60;
var maxScore=0;
var images = {};
var di = 0;

var speed = function(fps){
	FPS = parseInt(fps);
}

var loadImages = function(sources, callback){
	var nb = 0;
	var loaded = 0;
	var imgs = {};
	for(var i in sources){
		nb++;
		imgs[i] = new Image();
		imgs[i].src = sources[i];
		imgs[i].onload = function(){
			loaded++;
			if(loaded == nb){
				callback(imgs);
			}
		}
	}
}

var Bird = function(json){
	this.x = 80;
	this.y = 250;
	this.width = 40;
	this.height = 30;

	this.alive = true;
	this.gravity = 0;
	this.velocity = 0.3;
	this.jump = -6;

	this.init(json);
}

Bird.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Bird.prototype.flap = function(){
	this.gravity = this.jump;
}

Bird.prototype.update = function(){
	this.gravity += this.velocity;
	this.y += this.gravity;
}

Bird.prototype.isDead = function(height, pipes){
	if(this.y >= height || this.y + this.height <= 0){
		return true;
	}
	for(var i in pipes){
		if(!(
			this.x > pipes[i].x + pipes[i].width ||
			this.x + this.width < pipes[i].x || 
			this.y > pipes[i].y + pipes[i].height ||
			this.y + this.height < pipes[i].y
			)){
			return true;
	}
}
}

var Pipe = function(json){
	this.x = 0;
	this.y = 0;
	this.width = 50;
	this.height = 40;
	this.speed = 3;

	this.init(json);
}

Pipe.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Pipe.prototype.update = function(){
	this.x -= this.speed;
}

Pipe.prototype.isOut = function(){
	if(this.x + this.width < 0){
		return true;
	}
}

var Game = function(){
	this.pipes = [];
	this.birds = [];
	this.score = 0;
	this.canvas = document.querySelector("#flappy");
	this.ctx = this.canvas.getContext("2d");
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	this.spawnInterval = 90;
	this.interval = 0;
	this.gen = [];
	this.alives = 0;
	this.generation = 0;
	this.backgroundSpeed = 0.5;
	this.backgroundx = 0;
	this.maxScore = 0;
}

Game.prototype.start = function(){
	this.interval = 0;
	this.score = 0;
	this.pipes = [];
	this.birds = [];

	for (var i = 100 - 1; i >= 0; i--) {
		var b = new Bird();
		this.birds.push(b);
	}

	this.generation++;
	this.alives = this.birds.length;
}

Game.prototype.update = function(){
	this.backgroundx += this.backgroundSpeed;
	var nextHoll = 0;
	if(this.birds.length > 0){
		for(var i = 0; i < this.pipes.length; i+=2){
			if(this.pipes[i].x + this.pipes[i].width > this.birds[0].x){
				nextHoll = this.pipes[i].height/this.height;
				break;
			}
		}
	}

	for(var i in this.birds){
		if(this.birds[i].alive){

			var inputs = [
				Math.floor(this.birds[i].y/this.height*100)/100,
				Math.floor(nextHoll*100)/100
			];

			if(Qgame.use) {
				var res = Qgame.getBestPolicy([
					inputs[1] - inputs[0]
				].join('-'));

				if(res == 'true') {
					this.birds[di].flap();
				}
			} else {
				var res = 0;
				if(res > 0.5){
					this.birds[i].flap();
				}
			}

			this.birds[i].update();
			if(this.birds[i].isDead(this.height, this.pipes)){
				this.birds[i].alive = false;
				this.alives--;
				if(this.isItEnd()){
					this.start();
				}
			}
		}
	}

	for(var i = 0; i < this.pipes.length; i++){
		this.pipes[i].update();
		if(this.pipes[i].isOut()){
			this.score++;
			this.pipes.splice(i, 1);
			i--;
		}
	}

	if(this.interval == 0){
		var deltaBord = 50;
		var pipeHoll = 120;
		var hollPosition = Math.round(Math.random() * (this.height - deltaBord * 2 - pipeHoll)) +  deltaBord;
		this.pipes.push(new Pipe({x:this.width, y:0, height:hollPosition}));
		this.pipes.push(new Pipe({x:this.width, y:hollPosition+pipeHoll, height:this.height}));
	}

	this.interval++;
	if(this.interval == this.spawnInterval){
		this.interval = 0;
	}

	this.maxScore = (this.score > this.maxScore) ? this.score : this.maxScore;
	var self = this;

	if(FPS == 0){
		setZeroTimeout(function(){
			self.update();
		});
	}else{
		setTimeout(function(){
			self.update();
		}, 1000/FPS);
	}
}


Game.prototype.isItEnd = function(){
	for(var i in this.birds){
		if(this.birds[i].alive){
			return false;
		}
	}
	return true;
}

Game.prototype.display = function(){
	this.ctx.clearRect(0, 0, this.width, this.height);
	for(var i = 0; i < Math.ceil(this.width / images.background.width) + 1; i++){
		this.ctx.drawImage(images.background, i * images.background.width - Math.floor(this.backgroundx%images.background.width), 0)
	}

	for(var i in this.pipes){
		if(i%2 == 0){
			this.ctx.drawImage(images.pipetop, this.pipes[i].x, this.pipes[i].y + this.pipes[i].height - images.pipetop.height, this.pipes[i].width, images.pipetop.height);
		}else{
			this.ctx.drawImage(images.pipebottom, this.pipes[i].x, this.pipes[i].y, this.pipes[i].width, images.pipetop.height);
		}
	}

	this.ctx.fillStyle = "#FFC600";
	this.ctx.strokeStyle = "#CE9E00";
	for(var i in this.birds){
		if(this.birds[i].alive){
			this.ctx.save(); 
			this.ctx.translate(this.birds[i].x + this.birds[i].width/2, this.birds[i].y + this.birds[i].height/2);
			this.ctx.rotate(Math.PI/2 * this.birds[i].gravity/20);
			this.ctx.drawImage(images.bird, -this.birds[i].width/2, -this.birds[i].height/2, this.birds[i].width, this.birds[i].height);
			this.ctx.restore();
		}
	}

	this.ctx.fillStyle = "white";
	this.ctx.font="20px Oswald, sans-serif";
	this.ctx.fillText("Score : "+ this.score, 10, 25);
	this.ctx.fillText("Max Score : "+this.maxScore, 10, 50);
	this.ctx.fillText("Generation : "+this.generation, 10, 75);
	this.ctx.fillText("Alive : "+this.alives+" / "+100, 10, 100);

	var self = this;
	requestAnimationFrame(function(){
		self.display();
	});
}

window.onload = function(){
	var sprites = {
		bird:"./img/bird.png",
		background:"./img/background.png",
		pipetop:"./img/pipetop.png",
		pipebottom:"./img/pipebottom.png"
	}

	var start = function(){
		game = new Game();
		game.start();
		game.update();
		game.display();
	}

	loadImages(sprites, function(imgs){
		images = imgs;
		start();
	})

}

var UseTransitionMatrixToCompute = function() {
	Qgame.converge();
	console.log('rough size:', JSON.stringify(Qgame.transitionMatrix).length);
}

$.get('./assets/logs.json', function(response) {
	logs = response;

	var textbased = [];

	for (var keys in logs) {
        var reward = logs[keys];
        var params = keys.split('->');
        textbased.push([params[0], params[1], reward, params[2]].join(' '));
    }

    Qgame.logs = logs;

	$('#inputs').val(textbased.join("\n"));
});
