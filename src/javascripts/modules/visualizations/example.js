import $ from 'jquery';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import TweenLite from 'gsap';
import ScrollMagic from 'scrollmagic';
import 'imports?define=>false!scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap';
import 'imports?define=>false!scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators';
import pym from 'pym.js'

const loadExample = () => {
  console.log(`
    jQuery: ${$},
    d3: ${d3},
    topojson: ${topojson},
    TweenLite: ${TweenLite},
    ScrollMagic: ${ScrollMagic},
    pym: ${pym}
  `);
}

export { loadExample };
