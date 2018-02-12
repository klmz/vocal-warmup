'use strict';
const {ApiAiApp} = require('actions-on-google');
const functions = require('firebase-functions');
const {sprintf} = require('sprintf-js');
const Utils = require('./utils');
const Prompts = require('./prompts');
const strings = require('./strings');
const admin = require('firebase-admin');
const Keys = require('./constants').Keys;
const Actions = require('./constants').Actions;
const Context = require('./constants').Context;
const UserPreferences = require('./user-preferences');
const Exercises = require('./exercises');
const Logger = require('./logger');

process.env.DEBUG = 'actions-on-google:*';

//Initialise firebase admin
admin.initializeApp(functions.config().firebase);

/**
 *  Handler for actions.select-guidance
 *   
 *  This stores the user preference to be guided by a woman or a man.
 *
**/
const selectGuidance = app => {
    Logger.log("[HANDLER] Select Guidance");
    let guidance = app.getArgument('guidance');

    UserPreferences.store(app.getUser(), Keys.GUIDER, guidance);
    let context = {
        guider: guidance,
    }

    return app.tell(sprintf(Utils.getRandomPrompt(Prompts.VOICE_GUIDANCE.OK), context));
}

/**
 *  Handler for actions.ask-guider
 *
 *  This tells the user what his guider preference is.
**/
const askGuider = (app, userPrefs) => {
    Logger.log("[HANDLER] Ask guider");
    app.tell(sprintf(Utils.getRandomPrompt(Prompts.VOICE_GUIDANCE.YOUR_GUIDER), {
        guider: userPrefs[Keys.GUIDER]
    }))
}

/**
 *  Handler for actions.start-exercising
 *
 *  This will playback an exercise for the user.
 */
const startExercising = (app, userPrefs) => {
    Logger.log("[HANDLER] Start Exercising");
    // Get the exercises the user has already done today and remove them from the possible list of exercises.
    let done_exercises = userPrefs[Keys.EXERCISES_BY_DAY][Utils.today()]
    // Select a random exercise and play it to the user.
    let exercise = Exercises.getRandomExercise(done_exercises);
    // If there are no exercises left, ask if the user wnats to purchase more exercises.
    if (exercise.isPresent()) {
        exercise = exercise.get();
        Logger.log("[START_EXCERCISE] Exercise present", exercise);
        Exercises.playExercise(exercise, app, userPrefs);

        Logger.log("Exercise dispatched", exercise);
        //Save the exercise we did
        UserPreferences.add(app.getUser(), `${Keys.EXERCISES_BY_DAY}/${Utils.today()}`, exercise.number);
    } else {
        Logger.log("[START_EXCERCISE] No exercise present");
        //TODO ask for purchase
        // If the answer is no ask the user to redo other exercises
        app.setContext(Context.Q_DO_EXERCISE_AGAIN)
        app.ask(Utils.getRandomPrompt(Prompts.EXERCISES.Q_DO_EXERCISE_AGAIN))
    }
}

/**
 *  Handler for answer the question to erase the exercises we did today
 *  
 */
const doExercisesAgain = (app, userPrefs) => {
    Logger.log("[HANDLER] Do exercise again");
    //Store that we are redoing the exercises
    UserPreferences.store(app.getUser(), `${Keys.EXERCISES_BY_DAY}/${Utils.today()}`, {});
    //Remove it from memory as well
    userPrefs[Keys.EXERCISES_BY_DAY][Utils.today()] = [];
    startExercising(app, userPrefs);
}

/**
 *  Handler for skipping an exercise
 *  
 */
const nextOrPreviousExercise = (app, userPrefs) => {
    switch (app.getIntent()) {
    case Actions.NEXT_EXERCISE:
        startExercising(app, userPrefs);
        break;
    case Actions.PREVIOUS_EXERCISE:
        //Get previous exercise
        let done_exercises = userPrefs[Keys.EXERCISES_BY_DAY][Utils.today()]
        let exerciseNumber = done_exercises[done_exercises.length - 1];
        let exercise = Exercises.getExercise(exerciseNumber);
        Exercises.playExercise(exercise.get(), app, userPrefs);
        break;
    }
}
Logger.log("Initialising..");
Logger.log(Actions);
/** @type {Map<string, function(ApiAiApp): void>} */
const actionMap = new Map();
actionMap.set(Actions.SELECT_GUIDANCE, selectGuidance);
actionMap.set(Actions.ASK_GUIDER, UserPreferences.inject(askGuider));
actionMap.set(Actions.START_EXCERCISING, UserPreferences.inject(startExercising))
actionMap.set(Actions.START_EXCERCISING_YES, UserPreferences.inject(doExercisesAgain))
actionMap.set(Actions.NEXT_EXERCISE, UserPreferences.inject(nextOrPreviousExercise))
actionMap.set(Actions.PREVIOUS_EXERCISE, UserPreferences.inject(nextOrPreviousExercise))

/**
 * The entry point to handle a http request
 * @param {Request} request An Express like Request object of the HTTP request
 * @param {Response} response An Express like Response object to send back data
 */
const vocalWarmUp = functions.https.onRequest((request, response) => {
    const app = new ApiAiApp({
        request,
        response
    });
    app.handleRequest(actionMap);
});

module.exports = {
    vocalWarmUp
};
