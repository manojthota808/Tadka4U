import {describe,it,expect} from 'vitest';
import {filterShows,shows} from '@/lib/catalog';
describe('Catalog browsing',()=>{
 it('limits romance results to romance shows',()=>{const results=filterShows(shows,'Romance');expect(results.map(s=>s.id)).toEqual(['midnight-promise','ishq-again']);});
 it('searches titles without case or surrounding space sensitivity',()=>{expect(filterShows(shows,'All','  SHADOW  ').map(s=>s.id)).toEqual(['shadow-files']);});
 it('combines genre and title search',()=>{expect(filterShows(shows,'Romance','Shadow')).toEqual([]);});
 it('keeps every show to four episodes',()=>{expect(shows.every(s=>s.episodes===4)).toBe(true);});
});
