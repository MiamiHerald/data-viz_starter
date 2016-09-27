import $ from 'jquery';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { TweenLite } from 'gsap';
import numeral from 'numeral';
window.$ = $;

class Choropleth {
  constructor(el, dataUrl) {
    this.el = el;
    this.dataUrl = dataUrl;
    this.rateById = d3.map();
    this.aspectRatio = 0.6667;
    this.width = $(this.el).width();
    this.height = Math.ceil(this.aspectRatio * this.width);
    this.mapWidth = this.width;
    this.shapeUrl = `data/florida-counties.json`;
    this.rateById = d3.map();
    this.quantize = d3.scaleQuantize()
      .domain([-25, 15])
      .range(d3.range(9).map((i) => `q${i}-9` ));
  }

  render() {
    this.svg = d3.select(this.el).append(`svg`)
        .attr(`width`, `100%`)
        .attr(`class`, `choropleth__svg`)
        .append(`g`);

    this.loadData();
    this.resizeBubbleMap();
    $(window).on(`resize`, this.resizeBubbleMap.bind(this));
  }

  resizeBubbleMap() {
    window.requestAnimationFrame(() => {
      const chart = $(this.el).find(`g`);

      this.width = $(this.el).width();
      this.height = Math.ceil(this.aspectRatio * this.width);

      TweenLite.set(chart, { scale: this.width / this.mapWidth });
      d3.select(`.choropleth__svg`).attr(`height`, this.height);
    });
  }

  loadData() {
    d3.queue()
      .defer(d3.json, this.shapeUrl)
      .defer(d3.tsv, this.dataUrl, (d) => this.rateById.set(d.Counties, d[`Average wages per employee by county from 2007-2015`]))
      .await(this.drawMap.bind(this));
  }

  drawMap(error, shapeData) {
    this.draWTooltip();

    this.projection = d3.geoEquirectangular()
      .fitSize([this.width, this.height], topojson.feature(shapeData, shapeData.objects[`florida-counties`]));
    this.path = d3.geoPath()
      .projection(this.projection);

    this.svg.selectAll(`path`)
        .data(topojson.feature(shapeData, shapeData.objects[`florida-counties`]).features)
      .enter().append(`path`)
        .attr(`class`, (d) => `${this.quantize(this.rateById.get(d.properties.county))} ${d.properties.county} county`)
        .attr(`d`, this.path)
        .on(`mouseover`, (d) => {
          this.tooltip
            .html(`${d.properties.county}: ${this.rateById.get(d.properties.county)}%`)
            .classed(`is-active`, true);
        })
        .on(`mousemove`, () => {
          this.tooltip
            .style(`top`, `${d3.event.pageY}px`)
            .style(`left`, `${d3.event.pageX}px`);
        })
        .on(`mouseout`, () => {
          this.tooltip
            .classed(`is-active`, false);
        });
  }

  draWTooltip() {
    this.tooltip = d3.select(this.el)
      .append(`div`)
      .attr(`class`, `choropleth__tooltip`);
  }
}

const loadChoropleth = () => {
  const $choropleth = $(`.js-choropleth`);

  $choropleth.each((index) => {
    const $this = $choropleth.eq(index);
    const id = $this.attr(`id`);
    const url = $this.data(`url`);

    new Choropleth(`#${id}`, url).render();
  });
}

export { loadChoropleth };
