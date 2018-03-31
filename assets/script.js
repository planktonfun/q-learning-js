// Add scalable states, save logs to for testing
/**
 * From one input make at least 3-2 dimensions to get immediate reward rather than more
 * dimensions that will never converge
 * 
 * Q[x,y,action] = 10
 * Q[x,y,time,action] = 10
 * R[x,y] = 100
 * R[x,y,time] = 100
 */


// Ideal Questions:
// What is your current state delimited by space (place, coordinates, time ...)
// x1 y1

// What action did you do (up, down, left, right, jump, crawl ...)
// up

// How much reward did you get (integer only sorry)
// 100

// What is your current state now (place you end up, coordinates, time ...)
// x1 x2
// 

/**
 * Test Script
 * 
    x2-y2 up -100 x2-y1
    x2-y2 left 0 x1-y2
    x1-y2 up 1000 x1-y1
    x2-y2 left 0 x1-y2
    x1-y2 right 0 x2-y2
    x2-y2 up -100 x2-y1
    x2-y1 down 0 x2-y2
    x2-y2 left 0 x1-y2
    x1-y2 up 1000 x1-y1
    x1-y1 right -100 x2-y1
    x2-y1 down 0 x2-y2
    { 'x2-y2': { up: -100, down: 0, left: 100, right: 0 },
      'x2-y1': { up: 0, down: 10, left: 0, right: 0 },
      'x1-y2': { up: 1000, down: 0, left: 0, right: 10 },
      'x1-y1': { up: 0, down: 0, left: 0, right: -99 } }

 */

var QLearn = function() {
    this.logs = {};
    this.rewardTable = {};
    this.transitionMatrix = {};
    this.learningRate = 0.1;

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

        // console.log(currentState, action, this.rewardTable[nextState], nextState, this.learningRate, maxOfNextState);

        this.transitionMatrix[currentState][action] = this.rewardTable[nextState] + (this.learningRate*maxOfNextState);

        // console.log(this.transitionMatrix[currentState]);
    }

    this.getBestPolicy = function(state) {
        var actionPool = this.transitionMatrix[state];
        var action = 'undefined';
        var maxScore = -99999999;

        for(var key in actionPool) {
            var score = actionPool[key];

            if(score >= maxScore) {

                if(score == maxScore) {
                    action = action + ' or ' + key + ':' + score;
                } else {
                    maxScore = score;
                    action = key + ':' + score;
                }
            }
        }

        return action;
    }

    this.getTransitionMatrix = function() {
        return this.transitionMatrix;
    }
}


