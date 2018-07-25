#!/usr/bin/env node
/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-disable no-console, max-len */

const fs = require('fs');
const path = require('path');

const LH_ROOT = path.join(__dirname, '../../../');

const ignoredPathComponents = [
  '/.git',
  '/scripts',
  '/node_modules',
  '/test/',
  '-test.js',
  '-renderer.js',
];

/**
 * @param {string} dir
 * @param {Record<string, string>} strings
 */
function collectAllStringsInDir(dir, strings = {}) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const relativePath = path.relative(LH_ROOT, fullPath);
    if (ignoredPathComponents.some(p => fullPath.includes(p))) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      collectAllStringsInDir(fullPath, strings);
    } else {
      if (name.endsWith('.js')) {
        console.log('Collecting from', relativePath);
        const mod = require(fullPath);
        if (!mod.UIStrings) continue;
        for (const [key, value] of Object.entries(mod.UIStrings)) {
          strings[`${relativePath} | ${key}`] = value;
        }
      }
    }
  }

  return strings;
}

/**
 * @param {LH.Locale} locale
 * @param {Record<string, string>} strings
 */
function writeStringsToLocaleFormat(locale, strings) {
  const fullPath = path.join(LH_ROOT, `lighthouse-core/lib/locales/${locale}.json`);
  const output = {};
  for (const [key, message] of Object.entries(strings)) {
    output[key] = {message};
  }

  fs.writeFileSync(fullPath, JSON.stringify(output, null, 2) + '\n');
}

const strings = collectAllStringsInDir(path.join(LH_ROOT, 'lighthouse-core'));
console.log('Collected!');

writeStringsToLocaleFormat('en-US', strings);
console.log('Written to disk!');
