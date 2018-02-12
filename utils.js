let Prompts = require('./prompts.js');
let Constants = require('./constants.js');
let sprintf = require('sprintf-js').sprintf;

const getRandomNumber = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.getRandomNumber = getRandomNumber;

const getRandomItem = function(arr) {
    return arr[getRandomNumber(0, arr.length - 1)];
}
/**
 * Gets a random prompt from the supplied array
 * @Deprecated
 */
exports.getRandomPrompt = getRandomItem;
/**
 * Gets a random item from the supplied array
 */
exports.getRandomItem = getRandomItem;


exports.today = () => {
    return new Date().toISOString().split("T")[0];
}