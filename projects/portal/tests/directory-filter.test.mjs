import assert from 'node:assert/strict';
import test from 'node:test';
import {matchesRow, resultLabel} from '../public/directory-filter.mjs';

test('matches title and topic without case or surrounding-space sensitivity', () => {
  assert.equal(matchesRow('Game', 'Shepherd Maze / Navigation & memory', 'All', '  MEMORY '), true);
  assert.equal(matchesRow('Game', 'Shepherd Maze / Navigation & memory', 'All', 'missing'), false);
});

test('requires both category and search to match', () => {
  assert.equal(matchesRow('Game', 'Shepherd Maze', 'Game', 'shepherd'), true);
  assert.equal(matchesRow('Game', 'Shepherd Maze', 'Media', 'shepherd'), false);
  assert.equal(matchesRow('Game', 'Shepherd Maze', 'Game', 'crowd'), false);
  assert.equal(matchesRow('Game', 'Shepherd Maze', 'All', '  '), true);
});

test('labels the empty, singular, and plural result states', () => {
  assert.equal(resultLabel(0, 'asset'), '0 assets');
  assert.equal(resultLabel(1, 'prototype'), '1 prototype');
  assert.equal(resultLabel(29, 'asset'), '29 assets');
});
