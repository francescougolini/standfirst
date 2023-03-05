/**
 * Standfirst - Init
 *
 * Copyright (c) 2023 Francesco Ugolini <contact@francescougolini.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

'use strict';

import * as notepad from './notepad.js';

window.addEventListener('load', (event) => {
    // Create a new Notepad.
    const newNotepad = new notepad.Notepad('notepad-entry-point');
});
