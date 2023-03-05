/**
 * Standfirst - Utilities
 *
 * Copyright (c) 2023 Francesco Ugolini <contact@francescougolini.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

'use strict;';

export { countWords, getReadTime, getCurrentTime };

/**
 * Count the number of words in a given string, including emojis.
 *
 * @param {string} targetString The string to be processed.
 *
 * @return {number} The number of words in a string.
 */
const countWords = (targetString = '') => {
    const regex =
        /[\n\s]{0,}[a-zA-Z0-9\u00C0-\u017F\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]+[\n\s]{0,}/gu;
    const words = targetString.match(regex) || '';

    const wordNumber = words.length;

    return wordNumber;
};

/**
 * Get the time to (silently) read a text.
 *
 * The formula takes into consideration average value in English (silent reading it is 238, reading aloud it is 183).
 * NOTE: numbers are treated as words without being transliterated.
 *
 * @param {string} targetString The string to be processed.
 *
 * @return {number} The seconds required on average to silently read the string.
 */
const getReadTime = (targetString = '') => {
    const wordNumber = countWords(targetString);

    const timeToReadString = Math.ceil(wordNumber / (283 / 60));

    return timeToReadString;
};

/**
 * Get a string with the current time.
 *
 * @return {string} The time in the hh:mm:ss format.
 */
const getCurrentTime = () => {
    const date = new Date();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const time =
        (hours < 10 ? '0' + hours : hours) +
        ':' +
        (minutes < 10 ? '0' + minutes : minutes) +
        ':' +
        (seconds < 10 ? '0' + seconds : seconds);

    return time;
};