const Optional = require('optional-js');
const Utils = require('./utils');
const Logger = require('./logger');
const Keys = require('./constants').Keys;
const Prompts = require('./prompts');
const UserPreferences = require('./user-preferences');

const bucketRoot = "https://storage.googleapis.com/vocal-warmup-71de9.appspot.com";

const Categories = {
    'BASIC': 'basic',
    'ALL': 'all'
}
exports.Categories = Categories;

const exercises = [
    {
        'number': '9a',
        'title': 'Beginning warm-up, Vowels. 9A',
        'tempi': [120, 130, 140, 150],
        'category': Categories.BASIC
    },
    {
        'number': '9c',
        'title': 'Beginning warm-up, Vowels. 9C',
        'tempi': [120, 130, 140, 150],
        'category': Categories.BASIC
    }
]
exports.exercises = exercises;

/**
 * Get the exercise  by number
 * @param  {String} exercise Supplied the string identifying the exercise
 * @return {Optional}        Returns an Optional that might hold the exercise if it exists.
 */
exports.getExercise = (number) => {
    let results = exercises.filter((item) => item.number === number);
    if (results.length === 0) return Optional.empty();
    return Optional.of(results[0]);
}

const matchesCategories = (item, categories) => {
    return (categories === Categories.ALL)
        || categories.includes(item.category)
}

const isSkipped = (exercise, skip) => {
    return skip.includes(exercise.number);
}
exports.getRandomExercise = (skip = [], categories = Categories.ALL) => {
    //Prepare parameters
    let cats = [...categories]
    let exerciseSet = this.exercises
        .filter((item) => matchesCategories(item, categories)
            && !isSkipped(item, skip));
    if (exerciseSet.length === 0) return Optional.empty();
    let pickedE = Utils.getRandomItem(exerciseSet);
    Logger.log(pickedE)
    return Optional.of(pickedE);
}

const getAudioTag = (exercise, tempo = 120) => {
    let tag = `<audio src="${bucketRoot}/${exercise.category}/${exercise.number}/tempo-${tempo}.mp3">Playing '${exercise.title}'</audio>`;
    Logger.log(tag);
    return tag;
}
exports.getAudioTag = getAudioTag;

exports.playExercise = (exercise, app, userPrefs) => {
    Logger.log(Prompts);
    //Build the ssml
    let ssml = `<speak>
          ${Utils.getRandomPrompt(Prompts.EXERCISES.START_EXCERCISE)}
          ${getAudioTag(exercise, userPrefs[Keys.TEMPO])}
        </speak>`;
    app.ask(ssml);
}



