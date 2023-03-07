/**
 * Standfirst - Notepad
 *
 * Copyright (c) 2023 Francesco Ugolini <contact@francescougolini.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

'use strict';

import * as utilities from './utilities.js';

export { Notepad };

/** Class representing a notepad. */
class Notepad {
    #entryPoint;

    #headerContainer;
    #notesContainer;
    #footerContainer;
    #toolboxContainer;

    #notesIndex = new Map();

    #defaults = {
        notepadTitle: 'New notepad',
        noteTitle: 'New note',
        accentColors: ['', '#fde6e6', '#ebf2f9', '#fefbe6', '#feddc9', '#e5f4da'],
        branding: {
            name: 'Standfirst',
            logo: `<svg aria-label="Standfirst logo" xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" class="svg-icon logo" viewBox="0 0 244 255" focusable="false" >
                <!-- Copyright (c) 2023 Francesco Ugolini - All right reserved -->
                <path fill-rule="evenodd" d="m 139.774,0.381005 c -43.8,0 -87.6,10.401 -108.403,31.203 -41.605,41.604995 -41.605,175.203995 0,216.798995 41.605,41.595 175.204,41.595 216.799,0 41.595,-41.595 41.595,-175.194 0,-216.798995 -20.797,-20.802 -64.597,-31.203 -108.396,-31.203 z m -13.459,39.615 h 33.681 c 20.626,1.697 36.135,21.633995 36.766,41.089995 0,14.78801 0,14.36001 0,24.696 -8.645,0.024 -25.152,0.14501 -34.627,0.004 0,-5.59 0,-8.476 0,-14.35 -0.788,-6.868 -4.762,-14.311 -14.154,-14.488 h -9.84 c -12.304,-0.375 -18.776,14.495 -9.377,26.404 21.543,22.772 29.802,30.464 49.855,54.078 29.429,33.767 21.169,76.574 -18.619,82.57 h -33.681 c -12.166,-0.404 -38.052,-4.36899 -38.942,-45.754 0,-12.836 0.317,-2.308 -0.002,-17.324 11.299,0 24.704,-0.283 34.735,-0.283 0,0 -0.004,6.457 -0.004,11.289 0.599,8.519 2.926,13.819 10.369,14.836 l 13.088,-0.566 c 10.251,0.957 19.944,-11.531 4.267,-27.43 -13.929,-15.818 -44.279,-45.765 -49.445,-51.305 l 0.002,0.016 C 75.871,90.631 91.157,39.855005 126.319,39.996005 Z" transform="matrix(0.87392363,0,0,0.91332058,0.02108468,0.0330224)"/>
            </svg>`,
        },
        footerCredits: 'Created by <a href="http://standfirst.francescougolini.com" target="_blank">Francesco Ugolini</a>',
    };

    // Add default colors as initial accent colors. This allows to later include additional colors.
    #accentColors = [...this.#defaults.accentColors];

    /**
     * Create a new notepad.
     *
     * @param {String} entryPointID The DOM id of the element that will contain the notepad.
     */
    constructor(entryPointID) {
        this.#entryPoint = document.getElementById(entryPointID);

        // Add title
        this.#headerContainer = this.#addHeader(this.#defaults.notepadTitle, this.#entryPoint);

        // Add notes container
        this.#notesContainer = this.#addNotesContainer(this.#entryPoint);

        // Add footer
        this.#footerContainer = this.#addFooter(this.#defaults.footerCredits, this.#entryPoint);

        // Add toolbox
        this.#toolboxContainer = this.#addToolbox(this.#entryPoint);
    }

    // Note-related methods

    /**
     * Add a new note to the notepad.
     *
     * @param {Object} noteProperties The object containing the properties of the note.
     * @param {Element} parentElement The parent element where to insert the note.
     *
     * Note JSON format: see exportNotepad()
     */
    addNote(noteProperties = {}, parentElement = this.#notesContainer) {
        const index = this.#notesIndex.size + 1;

        const noteID = noteProperties.id ? noteProperties.id : 'note-' + Date.now() + index;
        const title = noteProperties.title ? noteProperties.title : this.#defaults.noteTitle;
        const content = noteProperties.content ? noteProperties.content : '';

        // Hex colors to customise note. Values are converted to lowercase.
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        const accentColor =
            noteProperties.accentColor && hexColorRegex.test(noteProperties.accentColor)
                ? noteProperties.accentColor.toLowerCase()
                : '';

        // Add color code if it's not already included in the list of accent colors.
        if (!this.#accentColors.includes(accentColor)) {
            this.#accentColors.push(accentColor);
        }

        // Create the note's html code.
        const newNote = this.#createNote(noteID, title, content, accentColor, index);

        // Add new note to the DOM.
        parentElement.insertAdjacentElement('beforeend', newNote);

        // Enable the counters for the note, e.g. word counter.
        this.#runNoteCounters(noteID);

        // Add the new note to the notes index.
        this.#notesIndex.set(this.#notesIndex.size + 1, noteID);

        // Re-index notes.
        this.#indexNotes();
    }

    /**
     * Rebuild the notes index map to ensure no gaps between keys.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     */
    deleteNote(noteID) {
        const note = document.getElementById(noteID);

        // Remove note from the DOM.
        note.remove();

        // Remove note from the index.
        const index = note.getAttribute('data-note-index');

        const originalNoteIndex = new Map(this.#notesIndex);

        this.#notesIndex.delete(parseInt(index));

        // Clear the notes index.
        this.#notesIndex.clear();

        for (let key = 1; key <= originalNoteIndex.size; key++) {
            if (originalNoteIndex.get(key) && key < index) {
                this.#notesIndex.set(key, originalNoteIndex.get(key));
            } else if (originalNoteIndex.get(key) && key > index) {
                this.#notesIndex.set(key - 1, originalNoteIndex.get(key));
            }
        }

        // Rebuild the notes index.
        this.#indexNotes();
    }

    /**
     * Change the position of the note in the notepad.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     * @param {Number} oldIndex The initial index (position) of the note.
     * @param {Number} newIndex The new index (position) of the note.
     */
    moveNote(noteID, oldIndex, newIndex) {
        const note = document.getElementById(noteID);

        if (note) {
            // Check if the new typed position is within min-max range.
            newIndex = newIndex <= this.#notesIndex.size ? newIndex : this.#notesIndex.size;

            const currentNote = this.#notesContainer.querySelector('[data-note-index="' + newIndex + '"]');

            // Remove the note from the index to ensure its correct repositioning.
            note.dataset.noteIndex = undefined;

            // Add the new index to the HTML element of the note.
            const noteIndexContainer = note.querySelector('.note-index');
            noteIndexContainer.value = newIndex;
            noteIndexContainer.defaultValue = newIndex;

            // Remove the note from the DOM.
            document.getElementById(note.id).remove();

            const cachedMovedNoteID = this.#notesIndex.get(oldIndex);
            const cachedNoteID = this.#notesIndex.get(newIndex);

            if (newIndex < oldIndex) {
                // Re-insert the note in its new position.
                this.#notesContainer.insertBefore(note, currentNote);

                const cachedNoteIDs = [this.#notesIndex.get(newIndex + 1)];

                this.#notesIndex.set(newIndex + 1, cachedNoteID);

                this.#notesIndex.set(newIndex, cachedMovedNoteID);

                for (const [index, id] of this.#notesIndex) {
                    if (index > newIndex + 1 && index <= oldIndex) {
                        cachedNoteIDs.push(this.#notesIndex.get(index));
                        this.#notesIndex.set(index, cachedNoteIDs[cachedNoteIDs.length - 2]);
                    }
                }
            } else {
                // Re-insert the note in its new position.
                this.#notesContainer.insertBefore(note, currentNote.nextSibling);

                for (const [index, id] of this.#notesIndex) {
                    if (index >= oldIndex && index < newIndex) {
                        this.#notesIndex.set(index, this.#notesIndex.get(index + 1));
                    } else if (index == newIndex) {
                        this.#notesIndex.set(index, cachedMovedNoteID);
                    }
                }
            }

            this.#indexNotes();
        }
    }

    /**
     * Change the accent color of the note from a list of available colors.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     */
    changeNoteAccentColor(noteID) {
        const note = document.getElementById(noteID);

        const noteTitleContainer = note.querySelector('.note-title-container');

        const currentColor = noteTitleContainer.getAttribute('data-accent-color')
            ? noteTitleContainer.getAttribute('data-accent-color').toLowerCase()
            : '';

        if (this.#accentColors.includes(currentColor)) {
            const currentColorIndex = this.#accentColors.indexOf(currentColor);

            if (currentColorIndex != this.#accentColors.length - 1) {
                const nextColor = this.#accentColors[currentColorIndex + 1];

                noteTitleContainer.style.backgroundColor = nextColor ? nextColor : 'inherit';
                noteTitleContainer.dataset.accentColor = nextColor ? nextColor : '';
            } else {
                const nextColor = this.#accentColors[0];

                noteTitleContainer.style.backgroundColor = nextColor ? nextColor : 'inherit';
                noteTitleContainer.dataset.accentColor = nextColor ? nextColor : '';
            }
        } else {
            // In case the color is not specified, start from the beginning.
            const nextColor = this.#accentColors[0];

            // Change colors to the container of the note title.
            noteTitleContainer.style.backgroundColor = nextColor ? nextColor : 'inherit';
            noteTitleContainer.dataset.accentColor = nextColor ? nextColor : '';
        }
    }

    /**
     * Count the number of characters and words in each note and measure the time to silently read the text.
     *
     * @param {String} noteID The DOM id of the object containing the properties of the note.
     */
    #runNoteCounters(noteID) {
        const note = document.getElementById(noteID);

        const noteText = note.querySelector('.note-text').textContent;

        const characterCounter = note.querySelector('.character-counter');
        const wordCounter = note.querySelector('.word-counter');

        const readTimeCounter = note.querySelector('.time-counter');

        // Count characters
        characterCounter.textContent = noteText.length;

        // Count words
        wordCounter.textContent = utilities.countWords(noteText);

        // Get read time
        readTimeCounter.textContent = utilities.getReadTime(noteText);
    }

    /**
     * Determine the index of each note and the min-max range.
     */
    #indexNotes() {
        for (const [index, id] of this.#notesIndex) {
            // Add the new index values to the note.
            const note = document.getElementById(this.#notesIndex.get(index));

            note.dataset.noteIndex = index;

            const noteIndexContainer = note.querySelector('.note-index');

            noteIndexContainer.value = index;
            noteIndexContainer.defaultValue = index;
            noteIndexContainer.max = this.#notesIndex.size;
        }
    }

    /**
     * Add the notes container to the DOM and include a new empty note.
     *
     * @param {Element} parentElement The parent element where to insert the notes container.
     *
     * @returns The HTML element representing the notes container.
     */
    #addNotesContainer(parentElement = this.#entryPoint) {
        const notesContainer = document.createElement('div');
        notesContainer.classList.add('notes-container');

        parentElement.insertAdjacentElement('beforeend', notesContainer);

        // Add a new empty note.
        this.addNote(undefined, notesContainer);

        return notesContainer;
    }

    // Notepad-related methods

    /**
     * Add notepad's controls in the DOM.
     *
     * @param {Element} parentElement The parent element where to insert the controls.
     *
     * @returns The HTML element representing the toolbox.
     */
    #addToolbox(parentElement = this.#entryPoint) {
        const toolbox = this.#createToolbox();
        toolbox.classList.add('toolbox');

        parentElement.insertAdjacentElement('beforeend', toolbox);

        return toolbox;
    }

    /**
     * Export the notepad content (title and notes) as a JSON file.
     *
     * JSON file format:
     *
     * {
     *      notepadTitle: {String},
     *      notes: [
     *          {
     *              id: {String},
     *              title: {String},
     *              content: {String},
     *              accentColor: {string} - Hex color code.
     *          }
     *      ]
     * }
     */
    exportNotepad() {
        const notes = this.#notesContainer.querySelectorAll('.note');

        const notepadTitle = this.#headerContainer.querySelector('.notepad-title').innerText;

        const notepadObject = {
            notepadTitle: notepadTitle,
            notes: [],
        };

        for (const note of notes) {
            const noteObject = {
                id: note.id || '',
                title: note.querySelector('.note-title').textContent || '',
                content: note.querySelector('.note-text').textContent || '',
                accentColor: note.querySelector('.note-title-container').getAttribute('data-accent-color') || '',
            };

            notepadObject.notes.push(noteObject);
        }

        const encodedUri = encodeURIComponent(JSON.stringify(notepadObject));

        const temporaryLink = document.createElement('a');

        temporaryLink.setAttribute('href', 'data:application/json;charset=utf-8,' + encodedUri);

        const filename = notepadTitle.replace(/[^\p{L}^\p{N}^\s]+/gu, '') + '.json';

        temporaryLink.setAttribute('download', filename);

        temporaryLink.click();

        temporaryLink.remove();
    }

    /**
     * Import an existing notepad from a JSON file.
     *
     * JSON file format: see exportNotepad()
     */
    importNotepad() {
        const temporaryInput = document.createElement('input');

        temporaryInput.type = 'file';
        temporaryInput.accept = 'application/json';

        // Add event listener to the temporary input
        temporaryInput.onchange = (event) => {
            const file = temporaryInput.files.item(0);

            var reader = new FileReader();

            reader.addEventListener('load', () => {
                const importedNotepad = reader.result;

                if (importedNotepad) {
                    // Clear the notepad.
                    this.clear();

                    // Parse the imported JSON data.
                    const importedNotepadObject = JSON.parse(importedNotepad);

                    // Notepad title
                    if (importedNotepadObject && importedNotepadObject.notepadTitle) {
                        this.#updateNotepadTitle(importedNotepadObject.notepadTitle, this.#headerContainer);
                    }

                    // Notes
                    if (importedNotepadObject && importedNotepadObject.notes && importedNotepadObject.notes.length > 0) {
                        // Add the imported notes.
                        importedNotepadObject.notes.forEach((noteProperties) => {
                            this.addNote(noteProperties, this.#notesContainer);
                        });
                    }
                }
            });

            reader.readAsText(file);
        };

        temporaryInput.click();

        temporaryInput.remove();
    }

    /**
     * Clear the notepad to its original state.
     *
     * @param {Boolean} addNewNote If true, add a new empty note to the cleared notepad.
     */
    clear(addNewNote = false) {
        // Empty the notepad container.
        this.#notesContainer.replaceChildren();

        // Reset the notes index.
        this.#notesIndex.clear();

        // If specified, add a new empty note.
        if (addNewNote) {
            this.addNote(undefined, this.#notesContainer);
        }

        // Reset the notepad title to the default one.
        this.#updateNotepadTitle(undefined, this.#headerContainer);

        // Restore accent colors to the default ones.
        this.#accentColors = [...this.#defaults.accentColors];
    }

    // Header-related methods

    /**
     * Add the header to the notepad.
     *
     * @param {String} notepadTitle The text to be used as notepad's title.
     * @param {Element} parentElement The parent element containing the header.
     *
     * @returns The HTML element representing the header.
     */
    #addHeader(notepadTitle, parentElement = this.#entryPoint) {
        const header = this.#createHeader(notepadTitle);
        header.classList.add('header');

        parentElement.insertAdjacentElement('beforeend', header);

        return header;
    }

    /**
     * Update the notepad's title.
     *
     * @param {String} notepadTitle The text to be used as the new notepad's title.
     * @param {Element} parentElement The parent element containing the notepad's title.
     */
    #updateNotepadTitle(notepadTitle = this.#defaults.notepadTitle, parentElement = this.#headerContainer) {
        const title = parentElement.querySelector('.notepad-title');
        title.innerText = notepadTitle;
    }

    // Footer-related methods

    /**
     * Add the footer to the notepad.
     *
     * @param {String} footerContent The new text to be used in the footer.
     * @param {Element} parentElement The parent element containing the footer.
     *
     * @return The HTML element representing the footer
     */
    #addFooter(footerContent, parentElement = this.#entryPoint) {
        const footer = this.#createFooter(footerContent);
        footer.classList.add('footer');

        parentElement.insertAdjacentElement('beforeend', footer);

        return footer;
    }

    // Dialog-related methods

    /**
     * Add a dialog element to the DOM.
     *
     * @param {Element} parentElement The parent element where to insert the dialog.
     */
    #addConfirmationDialog(action, actionLabel, message, customClasses, parentElement = document.body) {
        const dialog = this.#createConfirmationDialog(action, actionLabel, message, customClasses);
        parentElement.insertAdjacentElement('beforeend', dialog);
    }

    // Notepad's HTML elements

    /**
     * Create the HTML element representing the note.
     *
     * @param {string} noteID The DOM id to be assigned to the note.
     * @param {string} noteTitle The title of the note.
     * @param {string} noteText The text of the note.
     * @param {string} noteAccentColor The color to be used to style the note's title container.
     * @param {number} noteIndex The position of the note in the notepad.
     *
     * @returns The HTML element representing the note.
     */
    #createNote(noteID, noteTitle, noteText, noteAccentColor, noteIndex = 0) {
        const note = document.createElement('div');
        note.id = noteID;
        note.classList.add('note');

        // Note title
        const titleContainer = document.createElement('div');
        titleContainer.classList.add('note-title-container');
        titleContainer.dataset.accentColor = noteAccentColor;
        titleContainer.style.backgroundColor = noteAccentColor;

        const title = document.createElement('h3');
        title.contentEditable = 'plaintext-only';
        title.classList.add('note-title', 'editable');
        title.innerText = noteTitle;
        titleContainer.insertAdjacentElement('beforeend', title);

        note.insertAdjacentElement('beforeend', titleContainer);

        // Note text
        const textContainer = document.createElement('div');
        textContainer.classList.add('note-text-container');

        const text = document.createElement('div');
        text.contentEditable = 'plaintext-only';
        text.classList.add('note-text');
        text.innerText = noteText;
        textContainer.insertAdjacentElement('beforeend', text);

        note.insertAdjacentElement('beforeend', textContainer);

        // Note toolbox
        const toolbox = document.createElement('div');
        toolbox.classList.add('note-toolbox-container');

        // Note toolbox - Insights
        const insights = document.createElement('div');
        insights.classList.add('note-insights');

        // Note toolbox - Insights - Character counter
        const characterCounterContainer = document.createElement('div');
        characterCounterContainer.classList.add('insight-container');

        const characterCounter = document.createElement('div');
        characterCounter.classList.add('insight-content', 'hovering-label');
        characterCounter.ariaLabel = 'Characters';

        const characterCounterLabel = document.createElement('span');
        characterCounterLabel.innerText = 'C: ';
        characterCounter.insertAdjacentElement('beforeend', characterCounterLabel);

        const characterCounterValue = document.createElement('span');
        characterCounterValue.classList.add('character-counter');
        characterCounter.insertAdjacentElement('beforeend', characterCounterValue);

        characterCounterContainer.insertAdjacentElement('beforeend', characterCounter);

        insights.insertAdjacentElement('beforeend', characterCounterContainer);

        // Note toolbox - Insights - Word counter
        const wordCounterContainer = document.createElement('div');
        wordCounterContainer.classList.add('insight-container');

        const wordCounter = document.createElement('div');
        wordCounter.classList.add('insight-content', 'hovering-label');
        wordCounter.ariaLabel = 'Words';

        const wordCounterLabel = document.createElement('span');
        wordCounterLabel.innerText = 'W: ';
        wordCounter.insertAdjacentElement('beforeend', wordCounterLabel);

        const wordCounterValue = document.createElement('span');
        wordCounterValue.classList.add('word-counter');
        wordCounter.insertAdjacentElement('beforeend', wordCounterValue);

        wordCounterContainer.insertAdjacentElement('beforeend', wordCounter);

        insights.insertAdjacentElement('beforeend', wordCounterContainer);

        // Note toolbox - Insights - Time counter
        const timeCounterContainer = document.createElement('div');
        timeCounterContainer.classList.add('insight-container');

        const timeCounter = document.createElement('div');
        timeCounter.classList.add('insight-content', 'hovering-label');
        timeCounter.ariaLabel = 'Time (sec)';

        const timeCounterLabel = document.createElement('span');
        timeCounterLabel.innerText = 'T: ';
        timeCounter.insertAdjacentElement('beforeend', timeCounterLabel);

        const timeCounterValue = document.createElement('span');
        timeCounterValue.classList.add('time-counter');
        timeCounter.insertAdjacentElement('beforeend', timeCounterValue);

        timeCounterContainer.insertAdjacentElement('beforeend', timeCounter);

        insights.insertAdjacentElement('beforeend', timeCounterContainer);

        // Note toolbox - Controls
        const controls = document.createElement('div');
        controls.classList.add('note-controls');

        // Note toolbox - Controls - Copy text
        const copyTextContainer = document.createElement('div');
        copyTextContainer.classList.add('note-control-container');

        const copyTextControl = document.createElement('button');
        copyTextControl.type = 'button';
        copyTextControl.classList.add('note-control', 'hovering-label', 'copy-text');
        copyTextControl.ariaLabel = 'Copy text';
        copyTextControl.innerHTML = ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
        </svg>`;
        copyTextContainer.insertAdjacentElement('beforeend', copyTextControl);

        controls.insertAdjacentElement('beforeend', copyTextContainer);

        // Note toolbox - Controls - Download note
        const downloadNoteContainer = document.createElement('div');
        downloadNoteContainer.classList.add('note-control-container');

        const downloadNoteControl = document.createElement('button');
        downloadNoteControl.type = 'button';
        downloadNoteControl.classList.add('note-control', 'hovering-label', 'downloadNote');
        downloadNoteControl.ariaLabel = 'Download note';
        downloadNoteControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z"/>
            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
        </svg>
        `;
        downloadNoteContainer.insertAdjacentElement('beforeend', downloadNoteControl);

        controls.insertAdjacentElement('beforeend', downloadNoteContainer);

        // Note toolbox - Controls - Change accent color
        const changeAccentColorContainer = document.createElement('div');
        changeAccentColorContainer.classList.add('note-control-container');

        const changeAccentColorControl = document.createElement('button');
        changeAccentColorControl.type = 'button';
        changeAccentColorControl.classList.add('note-control', 'hovering-label', 'change-accent-color');
        changeAccentColorControl.ariaLabel = 'Accent color';
        changeAccentColorControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path fill-rule="evenodd" d="M7.21.8C7.69.295 8 0 8 0c.109.363.234.708.371 1.038.812 1.946 2.073 3.35 3.197 4.6C12.878 7.096 14 8.345 14 10a6 6 0 0 1-12 0C2 6.668 5.58 2.517 7.21.8zm.413 1.021A31.25 31.25 0 0 0 5.794 3.99c-.726.95-1.436 2.008-1.96 3.07C3.304 8.133 3 9.138 3 10a5 5 0 0 0 10 0c0-1.201-.796-2.157-2.181-3.7l-.03-.032C9.75 5.11 8.5 3.72 7.623 1.82z"/>
            <path fill-rule="evenodd" d="M4.553 7.776c.82-1.641 1.717-2.753 2.093-3.13l.708.708c-.29.29-1.128 1.311-1.907 2.87l-.894-.448z"/>
        </svg>`;
        changeAccentColorContainer.insertAdjacentElement('beforeend', changeAccentColorControl);

        controls.insertAdjacentElement('beforeend', changeAccentColorContainer);

        // Note toolbox - Controls - Delete note
        const deleteNoteContainer = document.createElement('div');
        deleteNoteContainer.classList.add('note-control-container');

        const deleteNoteControl = document.createElement('button');
        deleteNoteControl.type = 'button';
        deleteNoteControl.classList.add('note-control', 'hovering-label', 'delete-note');
        deleteNoteControl.ariaLabel = 'Delete note';
        deleteNoteControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
        </svg>`;
        deleteNoteContainer.insertAdjacentElement('beforeend', deleteNoteControl);

        controls.insertAdjacentElement('beforeend', deleteNoteContainer);

        // Note toolbox - Controls - Move note
        const moveNoteContainer = document.createElement('div');
        moveNoteContainer.classList.add('note-control-container');

        const moveNoteWrap = document.createElement('div');
        moveNoteWrap.classList.add('note-control', 'hovering-label', 'move-note');
        moveNoteWrap.ariaLabel = 'Move note';

        const moveNoteControl = document.createElement('input');
        moveNoteControl.type = 'number';
        moveNoteControl.min = 1;
        moveNoteControl.max = noteIndex;
        moveNoteControl.classList.add('note-index', 'editable');
        moveNoteControl.ariaLabel = 'Note index';
        moveNoteWrap.insertAdjacentElement('beforeend', moveNoteControl);

        moveNoteContainer.insertAdjacentElement('beforeend', moveNoteWrap);

        controls.insertAdjacentElement('beforeend', moveNoteContainer);

        toolbox.insertAdjacentElement('beforeend', insights);
        toolbox.insertAdjacentElement('beforeend', controls);

        note.insertAdjacentElement('beforeend', toolbox);

        // Event listeners

        // Input events
        text.addEventListener(
            'input',
            (event) => {
                const noteID = event.target.closest('.note').id;
                this.#runNoteCounters(noteID);
            },
            false
        );

        // Event listeners - Copy text
        copyTextControl.addEventListener('click', (event) => {
            this.#copyNoteText(event.target);
        });

        // Event listeners - Download note
        downloadNoteControl.addEventListener('click', (event) => {
            this.#downloadNote(event.target);
        });

        // Event listeners - Change accent color
        changeAccentColorControl.addEventListener('click', (event) => {
            const noteID = event.target.closest('.note').id;
            this.changeNoteAccentColor(noteID);
        });

        // Event listeners - Delete note
        deleteNoteControl.addEventListener('click', (event) => {
            const deleteNoteDialog = event.target.closest('.note').querySelector('.delete-note-dialog');
            deleteNoteDialog.showModal();
        });

        // Add delete note's confirmation dialog.
        const deleteNote = () => {
            if (noteID) {
                this.deleteNote(noteID);
            }
        };

        this.#addConfirmationDialog(deleteNote, 'Delete', 'Delete note?', ['delete-note-dialog'], note);

        // Event listener - Move note
        moveNoteControl.addEventListener(
            'change',
            (event) => {
                // Update the notes index when the position of the note is changed.
                const isNoteIndex = event.target.classList.contains('note-index');

                if (isNoteIndex && event.target.value) {
                    const oldIndex = parseInt(event.target.defaultValue);
                    const noteID = this.#notesContainer.querySelector('[data-note-index="' + oldIndex + '"]').id;
                    const newIndex = parseInt(event.target.value);

                    this.moveNote(noteID, oldIndex, newIndex);
                }
            },
            false
        );

        return note;
    }

    /**
     * Add the toolbox to the DOM and enable event listeners.
     *
     * @returns The HTML element representing the toolbox.
     */
    #createToolbox() {
        const notepadControls = document.createElement('div');
        notepadControls.classList.add('notepad-controls');

        // Notepad controls - New note
        const newNoteControlContainer = document.createElement('div');
        newNoteControlContainer.classList.add('toolbox-control-container');

        const newNoteControl = document.createElement('button');
        newNoteControl.type = 'button';
        newNoteControl.classList.add('toolbox-control', 'hovering-label', 'add-note');
        newNoteControl.ariaLabel = 'Add new note';
        newNoteControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
        </svg>`;
        newNoteControlContainer.insertAdjacentElement('beforeend', newNoteControl);

        notepadControls.insertAdjacentElement('beforeend', newNoteControlContainer);

        // Notepad controls - Import notepad
        const importNotepadControlContainer = document.createElement('div');
        importNotepadControlContainer.classList.add('toolbox-control-container');

        const importNotepadControl = document.createElement('button');
        importNotepadControl.type = 'button';
        importNotepadControl.classList.add('toolbox-control', 'hovering-label', 'import-notepad');
        importNotepadControl.ariaLabel = 'Import notepad';
        importNotepadControl.innerHTML = ` <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v.64c.57.265.94.876.856 1.546l-.64 5.124A2.5 2.5 0 0 1 12.733 15H3.266a2.5 2.5 0 0 1-2.481-2.19l-.64-5.124A1.5 1.5 0 0 1 1 6.14V3.5zM2 6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3H2.5a.5.5 0 0 0-.5.5V6zm-.367 1a.5.5 0 0 0-.496.562l.64 5.124A1.5 1.5 0 0 0 3.266 14h9.468a1.5 1.5 0 0 0 1.489-1.314l.64-5.124A.5.5 0 0 0 14.367 7H1.633z" />
        </svg>`;
        importNotepadControlContainer.insertAdjacentElement('beforeend', importNotepadControl);

        notepadControls.insertAdjacentElement('beforeend', importNotepadControlContainer);

        // Notepad controls - Export notepad
        const exportNotepadControlContainer = document.createElement('div');
        exportNotepadControlContainer.classList.add('toolbox-control-container');

        const exportNotepadControl = document.createElement('button');
        exportNotepadControl.type = 'button';
        exportNotepadControl.classList.add('toolbox-control', 'hovering-label', 'export-notepad');
        exportNotepadControl.ariaLabel = 'Export notepad';
        exportNotepadControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path fill-rule="evenodd" d="M8 5a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5A.5.5 0 0 1 8 5z" />
            <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z" />
            <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z" />
        </svg>`;
        exportNotepadControlContainer.insertAdjacentElement('beforeend', exportNotepadControl);

        notepadControls.insertAdjacentElement('beforeend', exportNotepadControlContainer);

        // Notepad controls - Close notepad
        const closeNotepadControlContainer = document.createElement('div');
        closeNotepadControlContainer.classList.add('toolbox-control-container');

        const closeNotepadControl = document.createElement('button');
        closeNotepadControl.type = 'button';
        closeNotepadControl.classList.add('toolbox-control', 'hovering-label', 'close-notepad');
        closeNotepadControl.ariaLabel = 'Close notepad';
        closeNotepadControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="svg-icon" viewBox="0 0 16 16" focusable="false">
            <!-- Copyright (c) 2019-2021 The Bootstrap Authors - Licensed under the MIT License -->
            <path d="M4.54.146A.5.5 0 0 1 4.893 0h6.214a.5.5 0 0 1 .353.146l4.394 4.394a.5.5 0 0 1 .146.353v6.214a.5.5 0 0 1-.146.353l-4.394 4.394a.5.5 0 0 1-.353.146H4.893a.5.5 0 0 1-.353-.146L.146 11.46A.5.5 0 0 1 0 11.107V4.893a.5.5 0 0 1 .146-.353L4.54.146zM5.1 1 1 5.1v5.8L5.1 15h5.8l4.1-4.1V5.1L10.9 1H5.1z"/>
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>`;
        closeNotepadControlContainer.insertAdjacentElement('beforeend', closeNotepadControl);

        notepadControls.insertAdjacentElement('beforeend', closeNotepadControlContainer);

        // Notepad controls - Close notepad - Confirmation dialog
        const closeNotepad = () => {
            this.clear(true);
        };

        this.#addConfirmationDialog(closeNotepad, 'Close', 'Close notepad?', ['close-notepad-dialog'], document.body);

        // Notepad controls - Event listeners

        // Event listeners - Add note
        newNoteControl.addEventListener('click', (event) => {
            this.addNote(undefined, this.#notesContainer);
        });

        // Event listeners - Import notepad
        importNotepadControl.addEventListener('click', (event) => {
            this.importNotepad();
        });

        // Event listeners - Export notepad
        exportNotepadControl.addEventListener('click', (event) => {
            this.exportNotepad();
        });

        // Event listeners - Close notepad - Confirmation dialog
        closeNotepadControl.addEventListener('click', (event) => {
            const closeNotepadDialog = document.body.querySelector('.close-notepad-dialog');
            closeNotepadDialog.showModal();
        });

        return notepadControls;
    }

    /**
     * Add the header to the DOM and enable event listeners.
     *
     * @param {String} notepadTitle The name of the notepad.
     * @param {Boolean} showTime If true, display the current time in the header.
     *
     * @returns The HTML element representing the header.
     */
    #createHeader(notepadTitle = this.#defaults.notepadTitle, showTime = true) {
        const header = document.createElement('header');

        // Header - Branding
        const branding = document.createElement('div');
        branding.classList.add('header-element', 'branding');
        branding.innerHTML = this.#defaults.branding.logo;

        header.insertAdjacentElement('beforeend', branding);

        // Header - Notepad title
        const title = document.createElement('h1');
        title.contentEditable = 'plaintext-only';
        title.classList.add('editable', 'notepad-title');
        title.innerText = notepadTitle;

        header.insertAdjacentElement('beforeend', title);

        // Header - Notepad title - Update document's title
        this.#updateDocumentTitle(title.innerText);

        // ... Update document's title when the notepad title's textContent changes.
        const observerOptions = { characterData: false, attributes: false, childList: true, subtree: false };
        const observer = new MutationObserver(() => {
            this.#updateDocumentTitle(title.innerText);
        });
        observer.observe(title, observerOptions);

        // ... Update document's title when new text is typed in the notepad title.
        title.addEventListener('input', (event) => {
            document.title = event.target.innerText + ' \u002D ' + this.#defaults.branding.name;
        });

        // Header - Time
        const time = document.createElement('div');
        time.classList.add('header-element', 'time');

        header.insertAdjacentElement('beforeend', time);

        // Show current time (update every second).
        if (showTime) {
            setInterval(() => {
                time.textContent = utilities.getCurrentTime();
            }, 1000);
        }

        return header;
    }

    /**
     * Add the footer to the DOM and enable event listeners.
     *
     * @param {String} footerContent The text to be displayed in the footer.
     *
     * @returns The HTML element representing the footer.
     */
    #createFooter(footerContent = this.#defaults.footerCredits) {
        const footer = document.createElement('footer');
        footer.innerHTML = footerContent;

        return footer;
    }

    /**
     * Create a dialog to confirm and action before taking it.
     *
     * @param {Element} targetElement The element where to insert the element representing the dialog.
     * @param {Function} action The action to be triggered when it is confirmed by the user.
     * @param {String} actionLabel The label to be use in the control.
     * @param {String} message A message to explain the action.
     * @param {Array} customClasses Classes to be used to customise the dialog.
     *
     * @returns The HTML element representing the dialog.
     */
    #createConfirmationDialog(action, actionLabel = 'OK', message = 'Action confirmation', customClasses = []) {
        // Add dialog to the DOM.
        const dialog = document.createElement('dialog');
        dialog.classList.add('notepad-dialog');
        dialog.classList.add(...customClasses);

        // Dialog header
        const dialogHeader = document.createElement('header');
        dialogHeader.classList.add('dialog-header');

        const dialogHeaderBody = document.createElement('h3');
        dialogHeaderBody.innerText = message;
        dialogHeader.insertAdjacentElement('beforeend', dialogHeaderBody);

        dialog.insertAdjacentElement('beforeend', dialogHeader);

        // Dialog footer
        const dialogFooter = document.createElement('footer');
        dialogFooter.classList.add('dialog-footer');

        const confirmButton = document.createElement('button');
        confirmButton.innerText = actionLabel;
        confirmButton.classList.add('dialog-button', 'dialog-button-confirm');
        dialogFooter.insertAdjacentElement('beforeend', confirmButton);

        const cancelButton = document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.classList.add('dialog-button', 'dialog-button-cancel');
        dialogFooter.insertAdjacentElement('beforeend', cancelButton);

        dialog.insertAdjacentElement('beforeend', dialogFooter);

        // Close notepad
        confirmButton.addEventListener('click', (event) => {
            action();
            dialog.close();
        });

        // Cancel
        cancelButton.addEventListener('click', (event) => {
            dialog.close();
        });

        return dialog;
    }

    // Notepad utilities

    /**
     * Copy the content of a note.
     *
     * @param {Element} control The element triggering the action.
     */
    #copyNoteText(control) {
        const note = control.closest('.note');
        const noteText = note.querySelector('.note-text');

        navigator.clipboard.writeText(noteText.textContent).then(
            () => {
                // Successfully copied: change color and show a message.
                const originalColor = control.style.color;
                control.style.color = '#00ad43';

                const originalAriaLabel = control.getAttribute('aria-label');
                control.setAttribute('aria-label', 'Text copied!');

                // Change color and message back to the original.
                setTimeout(() => {
                    control.style.color = originalColor;
                    control.setAttribute('aria-label', originalAriaLabel);
                }, 1000);
            },
            () => {
                // Not copied: change color and show a message.
                const originalColor = control.style.color;
                control.style.color = '#ae0b0b';

                const originalAriaLabel = control.getAttribute('aria-label');
                control.setAttribute('aria-label', 'Text NOT copied');

                // Change color and message back to the original.
                setTimeout(() => {
                    control.style.color = originalColor;
                    control.setAttribute('aria-label', originalAriaLabel);
                }, 1000);
            }
        );
    }

    /**
     * Download the note as a text file.
     *
     * @param {Element} control The element triggering the action.
     */
    #downloadNote(control) {
        const note = control.closest('.note');

        const noteText = note.querySelector('.note-text').textContent;
        const noteTitle = note.querySelector('.note-title').textContent;

        const encodedUri = encodeURI(noteTitle + '\n\n' + noteText);

        const temporaryLink = document.createElement('a');

        temporaryLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodedUri);

        const filename = noteTitle.replace(/[^\p{L}^\p{N}^\s]+/gu, '') + '.txt';

        temporaryLink.setAttribute('download', filename);

        temporaryLink.click();

        temporaryLink.remove();
    }

    /**
     * Change the document's title with a newly formatted string.
     *
     * @param {String} text The content to be included in the document's title.
     */
    #updateDocumentTitle(text) {
        document.title = text + ' \u002D ' + this.#defaults.branding.name;
    }
}
