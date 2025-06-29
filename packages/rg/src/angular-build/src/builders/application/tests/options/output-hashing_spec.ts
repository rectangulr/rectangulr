/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { buildApplication } from '../../index';
import { OutputHashing } from '../../schema';
import { APPLICATION_BUILDER_INFO, BASE_OPTIONS, describeBuilder } from '../setup';

describeBuilder(buildApplication, APPLICATION_BUILDER_INFO, (harness) => {
  describe('Option: "outputHashing"', () => {
    beforeEach(async () => {
      // Application code is not needed for asset tests
      await harness.writeFile('src/main.ts', 'console.log("TEST");');
      await harness.writeFile('src/polyfills.ts', 'console.log("TEST-POLYFILLS");');
    });

    it('hashes all filenames when set to "all"', async () => {
      await harness.writeFile('src/styles.css', `h1 { background: url('./spectrum.png')}`);

      harness.useTarget('build', {
        ...BASE_OPTIONS,
        styles: ['src/styles.css'],
        polyfills: ['src/polyfills.ts'],
        outputHashing: OutputHashing.All,
      });

      const { result } = await harness.executeOnce();
      expect(result?.success).toBe(true);

      expect(harness.hasFileMatch('dist/browser', /main-[0-9A-Z]{8}\.js$/)).toBeTrue();
      expect(harness.hasFileMatch('dist/browser', /polyfills-[0-9A-Z]{8}\.js$/)).toBeTrue();
      expect(harness.hasFileMatch('dist/browser', /styles-[0-9A-Z]{8}\.css$/)).toBeTrue();
      expect(harness.hasFileMatch('dist/browser/media', /spectrum-[0-9A-Z]{8}\.png$/)).toBeTrue();
    });

    it(`doesn't hash any filenames when not set`, async () => {
      await harness.writeFile('src/styles.css', `h1 { background: url('./spectrum.png')}`);

      harness.useTarget('build', {
        ...BASE_OPTIONS,
        polyfills: ['src/polyfills.ts'],
        styles: ['src/styles.css'],
      });

      const { result } = await harness.executeOnce();
      expect(result?.success).toBe(true);

      expect(harness.hasFileMatch('dist/browser', /main-[0-9A-Z]{8}\.js$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser', /polyfills-[0-9A-Z]{8}\.js$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser', /styles-[0-9A-Z]{8}\.css$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser/media', /spectrum-[0-9A-Z]{8}\.png$/)).toBeFalse();
    });

    it(`doesn't hash any filenames when set to "none"`, async () => {
      await harness.writeFile('src/styles.css', `h1 { background: url('./spectrum.png')}`);

      harness.useTarget('build', {
        ...BASE_OPTIONS,
        styles: ['src/styles.css'],
        polyfills: ['src/polyfills.ts'],
        outputHashing: OutputHashing.None,
      });

      const { result } = await harness.executeOnce();
      expect(result?.success).toBe(true);

      expect(harness.hasFileMatch('dist/browser', /main-[0-9A-Z]{8}\.js$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser', /polyfills-[0-9A-Z]{8}\.js$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser', /styles-[0-9A-Z]{8}\.css$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser/media', /spectrum-[0-9A-Z]{8}\.png$/)).toBeFalse();
    });

    it(`hashes CSS resources filenames only when set to "media"`, async () => {
      await harness.writeFile('src/styles.css', `h1 { background: url('./spectrum.png')}`);

      harness.useTarget('build', {
        ...BASE_OPTIONS,
        styles: ['src/styles.css'],
        polyfills: ['src/polyfills.ts'],
        outputHashing: OutputHashing.Media,
      });

      const { result } = await harness.executeOnce();
      expect(result?.success).toBe(true);

      expect(harness.hasFileMatch('dist/browser', /main-[0-9A-Z]{8}\.js$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser', /polyfills-[0-9A-Z]{8}\.js$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser', /styles-[0-9A-Z]{8}\.css$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser/media', /spectrum-[0-9A-Z]{8}\.png$/)).toBeTrue();
    });

    it(`hashes bundles filenames only when set to "bundles"`, async () => {
      await harness.writeFile('src/styles.css', `h1 { background: url('./spectrum.png')}`);

      harness.useTarget('build', {
        ...BASE_OPTIONS,
        styles: ['src/styles.css'],
        polyfills: ['src/polyfills.ts'],
        outputHashing: OutputHashing.Bundles,
      });

      const { result } = await harness.executeOnce();
      expect(result?.success).toBe(true);

      expect(harness.hasFileMatch('dist/browser', /main-[0-9A-Z]{8}\.js$/)).toBeTrue();
      expect(harness.hasFileMatch('dist/browser', /polyfills-[0-9A-Z]{8}\.js$/)).toBeTrue();
      expect(harness.hasFileMatch('dist/browser', /styles-[0-9A-Z]{8}\.css$/)).toBeTrue();
      expect(harness.hasFileMatch('dist/browser/media', /spectrum-[0-9A-Z]{8}\.png$/)).toBeFalse();
    });

    it('does not hash non injected styles', async () => {
      harness.useTarget('build', {
        ...BASE_OPTIONS,
        outputHashing: OutputHashing.All,
        sourceMap: true,
        styles: [
          {
            input: 'src/styles.css',
            inject: false,
          },
        ],
      });

      const { result } = await harness.executeOnce();
      expect(result?.success).toBe(true);

      expect(harness.hasFileMatch('dist/browser', /styles-[0-9A-Z]{8}\.css$/)).toBeFalse();
      expect(harness.hasFileMatch('dist/browser', /styles-[0-9A-Z]{8}\.css.map$/)).toBeFalse();
      harness.expectFile('dist/browser/styles.css').toExist();
      harness.expectFile('dist/browser/styles.css.map').toExist();
    });

    // TODO: Re-enable once implemented in the esbuild builder
    xit('does not override different files which has the same filenames when hashing is "none"', async () => {
      await harness.writeFiles({
        'src/styles.css': `
        h1 { background: url('./test.svg')}
        h2 { background: url('./small/test.svg')}
      `,
        './src/test.svg': `<svg xmlns="http://www.w3.org/2000/svg">
        <text x="20" y="20" font-size="20" fill="red">Hello World</text>
      </svg>`,
        './src/small/test.svg': `<svg xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="10" font-size="10" fill="red">Hello World</text>
      </svg>`,
      });

      harness.useTarget('build', {
        ...BASE_OPTIONS,
        styles: ['src/styles.css'],
        outputHashing: OutputHashing.None,
      });

      const { result } = await harness.executeOnce();
      expect(result?.success).toBe(true);

      harness.expectFile('dist/browser/media/test.svg').toExist();
      harness.expectFile('dist/browser/media/small-test.svg').toExist();
    });
  });
});
