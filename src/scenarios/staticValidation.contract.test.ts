import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('static scene validation command', () => {
  it('is exposed as a project script', () => {
    const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

    expect(packageJson.scripts['test:static-scenes']).toBe('node scripts/validate-static-scenes.mjs');
  });

  it('validates the same six scene ids shown by the application', () => {
    const validator = readFileSync(resolve(root, 'scripts/validate-static-scenes.mjs'), 'utf8');

    for (const sceneId of ['demo01', 'demo02', 'demo03', 'demo04', 'demo05', 'demo06']) {
      expect(validator).toContain(`"${sceneId}"`);
    }
  });

  it('does not write tendon actuator values into joint qpos slots', () => {
    const validator = readFileSync(resolve(root, 'scripts/validate-static-scenes.mjs'), 'utf8');

    expect(validator).toContain('model.actuator_trntype[actuatorId]');
    expect(validator).toContain('transmissionType === 0 || transmissionType === 1');
  });

  it('rejects visible penetration above one tenth of a millimeter', () => {
    const validator = readFileSync(resolve(root, 'scripts/validate-static-scenes.mjs'), 'utf8');

    expect(validator).toContain('const penetrationTolerance = -0.0001');
  });
});
