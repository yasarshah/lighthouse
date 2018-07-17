/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const LHError = require('../lib/errors');

class FinalScreenshot extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'final-screenshot',
      scoreDisplayMode: Audit.SCORING_MODES.INFORMATIVE,
      title: 'Final Screenshot',
      description: 'The last screenshot captured of the pageload.',
      requiredArtifacts: ['traces'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const traceOfTab = await artifacts.requestTraceOfTab(trace);
    const screenshotTraceCategory = 'disabled-by-default-devtools.screenshot';

    const ssEvents = trace.traceEvents.filter(e => e.cat === screenshotTraceCategory);
    const finalScreenshot = ssEvents[ssEvents.length - 1];

    if (!finalScreenshot) {
      throw new LHError(LHError.errors.NO_SCREENSHOTS);
    }

    // The timing isn't too important, so don't fail the audit if there's no navigationStart found
    // We'll just fall back to a less accurate timing
    const timing = traceOfTab.navigationStartEvt
      ? finalScreenshot.ts - traceOfTab.navigationStartEvt.ts
      : finalScreenshot.ts - ssEvents[0].ts;

    return {
      rawValue: true,
      details: {
        type: 'screenshot',
        items: [
          {
            timestamp: finalScreenshot.ts,
            timing: Math.round(timing / 1000),
            data: finalScreenshot.args.snapshot,
          },
        ],
      },
    };
  }
}

module.exports = FinalScreenshot;
