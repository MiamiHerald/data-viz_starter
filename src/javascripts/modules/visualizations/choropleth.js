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
    this.quantizePositive = d3.scaleQuantize()
      .domain([-25, 15])
      .range(d3.range(9).map((i) => `p${i}-9` ));
    this.quantizeNegative = d3.scaleQuantize()
      .domain([-25, 15])
      .range(d3.range(9).map((i) => `n${i}-9` ));
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

    // https://github.com/wbkd/d3-extended
    d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

    this.projection = d3.geoEquirectangular()
      .fitSize([this.width, this.height], topojson.feature(shapeData, shapeData.objects[`florida-counties`]));
    this.path = d3.geoPath()
      .projection(this.projection);

    this.svg.selectAll(`path`)
        .data(topojson.feature(shapeData, shapeData.objects[`florida-counties`]).features)
      .enter().append(`path`)
        .attr(`class`, (d) => {
          if (this.rateById.get(d.properties.county) >= 0) {
            return `${this.quantizePositive(this.rateById.get(d.properties.county))} county county--${d.id}`
          } else if (this.rateById.get(d.properties.county) < 0) {
            return `${this.quantizeNegative(this.rateById.get(d.properties.county))} county county--${d.id}`
          }
        })
        .attr(`d`, this.path)
        .on(`mouseover`, (d) => {
          d3.select(`.county--${d.id}`)
              .moveToFront()
              .classed(`is-active`, true);

          this.tooltip
            .html(`${d.properties.county}: ${this.rateById.get(d.properties.county)}%`)
            .classed(`is-active`, true);
        })
        .on(`mousemove`, () => {
          this.tooltip
            .style(`top`, `${d3.event.pageY}px`)
            .style(`left`, `${d3.event.pageX}px`);
        })
        .on(`mouseout`, (d) => {
          d3.select(`.county--${d.id}`)
              .moveToBack()
              .classed(`is-active`, false);

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
