// Explainer content reflects each site's own calculation.
import { describe, it, expect } from 'vitest';
import { earthVsMoon, libration } from '../src/explainers.js';
import { analyse } from '../src/core/analysis.js';
import { loadSite, D } from './helpers.js';

const view = (id) => { const s = loadSite(id); return { ...s, a: analyse(s.site, s.horizon, D('2027-01-01'), 30, 30) }; };

describe('Moon vs Earth', () => {
  it('says Earth never rises on the far side', () => { const v = view('change4'); expect(earthVsMoon(v.site, v.a).html).toContain('Earth never rises'); });
  it('says Earth never sets at Apollo 11', () => { const v = view('apollo11'); expect(earthVsMoon(v.site, v.a).html).toContain('never sets'); });
  it('reports no daylight on the crater floor', () => { const v = view('shackleton-floor'); expect(earthVsMoon(v.site, v.a).html).toContain('No daylight at all'); });
});

describe('libration explainer', () => {
  it('draws Earth\'s path as an SVG with the site name', () => {
    const v = view('malapert');
    const out = libration(v.site, v.a, D('2027-01-10'));
    expect(out.html).toContain('<svg');
    expect(out.html).toContain('Malapert Massif');
    expect(out.html).toMatch(/\d+(\.\d)?° side to side/);
  });
});
