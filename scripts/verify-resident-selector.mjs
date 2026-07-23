#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ResidentSelector,
  filterResidentSelectorCandidates,
  normalizeResidentSelectorData,
  resolveResidentSelectorLoad,
} from '../dist/ui/ResidentSelector.js';

const active = {
  residentId: '90001',
  name: '利用者1',
  kana: 'りようしゃ1',
  room: '201',
  episodeId: '90001-第1期',
  spineStatus: '入所中',
  episodeOpen: true,
  createAllowed: true,
  locationUnknown: false,
};
const retired = {
  residentId: '90002',
  name: '利用者2',
  kana: 'りようしゃ2',
  room: '202',
  episodeId: '90002-第1期',
  spineStatus: '退所',
  episodeOpen: false,
  createAllowed: false,
  locationUnknown: true,
};
const optionalSearch = {
  residentId: '90005',
  name: '利用者3',
  kana: 'りようしゃ3',
  episodeId: '90005-第1期',
  spineStatus: '退所',
  episodeOpen: false,
  createAllowed: false,
};

const residents = normalizeResidentSelectorData({
  residents: [
    active,
    retired,
    { ...active, residentId: 'resident-001' },
    { ...active, residentId: '90003', episodeOpen: 'true' },
    { ...active, residentId: '90004', kana: '' },
    optionalSearch,
    { ...active, residentId: '90006', room: 203 },
    { ...active, residentId: '90007', locationUnknown: 'false' },
  ],
});
assert.deepEqual(residents.map((resident) => resident.residentId), ['90001', '90002', '90005']);
assert.equal(residents.find((resident) => resident.residentId === '90005')?.room, '');
assert.equal(residents.find((resident) => resident.residentId === '90005')?.locationUnknown, undefined);
assert.equal(normalizeResidentSelectorData([{ ...active, room: '' }])[0]?.room, '');
assert.deepEqual(normalizeResidentSelectorData({ candidates: [active] }), []);

const search = filterResidentSelectorCandidates(residents, 'search');
assert.deepEqual(search.map((resident) => resident.residentId), ['90001', '90002', '90005']);
assert.equal(search.find((resident) => resident.residentId === '90002')?.createAllowed, false);
assert.equal(search.find((resident) => resident.residentId === '90002')?.episodeOpen, false);

const create = filterResidentSelectorCandidates(residents, 'create');
assert.deepEqual(create.map((resident) => resident.residentId), ['90001']);
const createWithoutLocationUnknown = normalizeResidentSelectorData([{ ...active, locationUnknown: undefined }]);
assert.deepEqual(createWithoutLocationUnknown.map((resident) => resident.residentId), ['90001']);
assert.deepEqual(filterResidentSelectorCandidates(createWithoutLocationUnknown, 'search').map((resident) => resident.residentId), ['90001']);
assert.deepEqual(filterResidentSelectorCandidates(createWithoutLocationUnknown, 'create'), []);
assert.deepEqual(filterResidentSelectorCandidates(residents, 'search', '', false), []);
assert.deepEqual(filterResidentSelectorCandidates(residents, 'search', 'りようしゃ2').map((resident) => resident.residentId), ['90002']);
assert.deepEqual(filterResidentSelectorCandidates(residents, 'search', '202').map((resident) => resident.residentId), ['90002']);
assert.deepEqual(filterResidentSelectorCandidates(residents, 'invalid', ''), []);

const failedLoad = await resolveResidentSelectorLoad(async () => {
  throw new Error('upstream detail must not escape');
});
assert.deepEqual(failedLoad, { residents: [], failed: true });
const successfulLoad = await resolveResidentSelectorLoad(async () => ({ residents: [active] }));
assert.deepEqual(successfulLoad, { residents: [active], failed: false });

const html = renderToStaticMarkup(createElement(ResidentSelector, {
  mode: 'search',
  data: { residents: [active, retired, optionalSearch, { ...active, residentId: 'bad' }] },
  onSelect: () => undefined,
}));
assert.match(html, /90001/);
assert.match(html, /90002/);
assert.match(html, /90005/);
assert.match(html, /居室未設定/);
assert.doesNotMatch(html, /resident-001/);
assert.match(html, /利用者候補/);

console.log('ResidentSelector verification passed: B2 optional fields, source removal clearing, search/create separation, fail-closed input');
