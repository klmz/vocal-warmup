const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {Keys} = require('./constants');
const Logger = require('./logger');

/**
 * Store a key value pair for a specific user in a firebase RTDB
 * 
 * @param  {User} user  [User object]
 * @param  {String} key   
 * @param  {Any Stringable} value 
 * @return  {void}
 */
exports.store = (user, key, value) => {
    admin.database().ref(`/userprefs/${user.userId}/${key}`).set(value);
}

/**
 * Add a value to a list specified by key for a specific user
 * @param  {User} user  [User object]
 * @param  {String} key [Key should point to a list]
 * @param  {Any Stringable} value 
 * @return  {void}
 */
exports.add = (user, key, value) => {
    admin.database().ref(`/userprefs/${user.userId}/${key}`).push().set(value);
}

/**
 * Request a value from firebase
 * @param  {User} user         
 * @param  {String} key         
 * @param  {Any} defaultValue 
 * @return {Promise}              [Promise resolve with the value of the specified key]
 */
exports.get = (user, key, defaultValue) => {
    return admin.database().ref(`/userprefs/${user.userId}/${key}`).once('value')
        .then(snapshot => {
            if (snapshot.val() === null) return defaultValue;
            return snapshot.val();
        });
}

/**
 * Request the user prefs object from firbase
 * @param  {User} user 
 * @return {Promise} The promise resolve with the user preferences belonging to the specified user id
 */
const getUserPrefs = (user) => {
    //TODO might want to try and cache this in memory.
    let userData = {}
    //Set up defaults
    userData[Keys.GUIDER] = 'man';
    userData[Keys.LAST_EXERCISE] = '0';
    userData[Keys.EXERCISES_BY_DAY] = {};
    userData[Keys.TEMPO] = 120;

    return admin.database().ref(`/userprefs/${user.userId}`).once('value')
        .then(snapshot => {
            let value = snapshot.val();
            if (value == null) return Promise.resolve(userData);

            //Overwrite defaults with values from firebase
            for (let key in value) {
                userData[key] = value[key]
            }


            if (value[Keys.EXERCISES_BY_DAY] === null) {
                //Setup defaults values for actions done today in userData
                userData[Keys.EXERCISES_BY_DAY] = {};
                userData[Keys.EXERCISES_BY_DAY][Utils.today()] = [];
            } else {
                //Copy values for actions done today to userData object
                for (let key in value[Keys.EXERCISES_BY_DAY]) {
                    let v = value[Keys.EXERCISES_BY_DAY][key];
                    userData[Keys.EXERCISES_BY_DAY][key] = [];

                    for (let item in v) {
                        userData[Keys.EXERCISES_BY_DAY][key].push(v[item])
                    }
                }
            }
            return Promise.resolve(userData);
        })
}

/**
 * Inject user preferences into actionMapHandler
 * @param  {Function} handler 
 */
exports.inject = handler => app => {
    Logger.log("[INJECT] Injecting user prefs");
    getUserPrefs(app.getUser()).then(userPrefs => {
        Logger.log(userPrefs);
        handler(app, userPrefs)
    });
}