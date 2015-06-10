import _ from 'lodash';
import d3 from 'd3';

import {tileSize, rotationSpeed, repositionSpeed} from './config';
import * as tile from './tile';
import * as simulation from './simulation';
import * as particles from './particles';

export class Board {
  constructor(level, svg) {
    this.level = level;
    this.svg = svg;
    this.tileMatrix = [];
  }

  clearTiles() {
    // Create matrix filled with Vacuum
    this.tileMatrix = _.range(this.level.width).map((i) =>
        _.range(this.level.height).map((j) =>
            new tile.Tile(tile.Vacuum, 0, false, i, j)
        )
    );
    return this;
  }

  reset() {
    // Clear tiles
    this.clearTiles();

    // Fill board with proper tiles
    _.each(this.level.tileRecipes, (tileRecipe) => {
      if (!_.has(tile, tileRecipe.name)) {
        return;
      }
      this.tileMatrix[tileRecipe.i][tileRecipe.j] = new tile.Tile(
        tile[tileRecipe.name],
        tileRecipe.rotation || 0,
        !!tileRecipe.frozen,
        tileRecipe.i,
        tileRecipe.j
      );
    });

    // Initial drawing
    this.resizeSvg();
    this.drawBackground();
    this.drawBoard();
  }

  resizeSvg() {
    this.svg.attr({
      // top left width height
      viewBox: `${-tileSize} ${-tileSize} ${tileSize * (this.level.width + 2)} ${tileSize * (this.level.height + 2)}`
    });
  }

  /**
   * Draw background - a grid of squares.
   */
  drawBackground() {

    this.svg.select('.background').remove();

    this.svg
      .append('g')
      .attr('class', 'background')
      .selectAll('.tile')
      .data(_.flatten(this.tileMatrix))
      .enter()
      .append('rect')
      .attr({
        'class': (d) => {
          if (d.frozen) {
            return 'tile tile--frozen';
          } else {
            return 'tile';
          }
        },
        x: (d) => d.x,
        y: (d) => d.y,
        width: tileSize,
        height: tileSize,
      })
      // NOTE adding with double click only for dev mode
      .on('dblclick', (d) => {
        d3.select('#tile-selector').remove();

        const tileSelector = d3.select('body').append('div')
          .attr('id', 'tile-selector')
          .attr('class', 'item-selector');

        tileSelector.append('ul').attr('class', 'tile-item').selectAll('li')
          .data(_.keys(tile.nameToConst))
          .enter()
            .append('li')
              .attr('class', 'tile-item')
              .text((name) => name)
              .on('click', (name) => {
                this.addTile(name, d.i, d.j);
                window.console.log("dblclick added", d);
                tileSelector.remove();
              });
      });
  }

  /**
   * Draw board: tiles and their hitboxes.
   * Also, bind click and drag events.
   */
  drawBoard() {

    this.svg.select('.board').remove();
    this.boardGroup = this.svg
      .append('g')
      .attr('class', 'board');

    const tileSelection = this.spawnTiles();
    this.keepNodeReference(tileSelection);
    this.drawTiles(tileSelection);
    this.drawHitboxes(tileSelection);
    this.bindClick(tileSelection);
    this.bindDrag(tileSelection);
  }

  addTile(name, i, j) {
    this.addTileFromObj(tile.tileSimpler(name, i, j));
  }

  // NOTE maybe some better naming to distinguish: tile (as physics) from tile (physics + drawing) and library ('tile.js')
  addTileFromObj(tileObj) {
    this.removeTile(tileObj.i, tileObj.j);
    this.tileMatrix[tileObj.i][tileObj.j] = tileObj;

    const tileSelection = this.boardGroup
      .datum(tileObj)
      .append('g')
      .attr({
        'class': 'tile',
        transform: (d) => `translate(${d.x + tileSize / 2},${d.y + tileSize / 2})`
      });

    this.keepNodeReference(tileSelection);
    this.drawTiles(tileSelection);
    this.drawHitboxes(tileSelection);
    this.bindClick(tileSelection);
    this.bindDrag(tileSelection);
  }

  removeTile(i, j) {
    if (this.tileMatrix[i][j].node) {
      this.tileMatrix[i][j].node.remove();
    }
    this.tileMatrix[i][j] = new tile.Tile(tile.Vacuum, 0, false, i, j);
  }

  spawnTiles() {

    const tileList = _.chain(this.tileMatrix)
      .flatten()
      .filter((t) => t.type !== tile.Vacuum)
      .value();

    return this.boardGroup
      .selectAll('.tile')
      .data(tileList)
      .enter()
      .append('g')
      .attr({
        'class': 'tile',
        transform: (d) => `translate(${d.x + tileSize / 2},${d.y + tileSize / 2})`
      });
  }

  keepNodeReference(tileSelection) {
    tileSelection
      .each(function (d) {
        d.node = this;
      });
  }

  drawTiles(tileSelection) {
    tileSelection
      .append('use')
      .attr({
        'xlink:href': (d) => `#${d.type.name}`,
        'class': 'element',
        transform: (d) => `rotate(${-d.type.rotationAngle * d.rotation},0,0)`
      });
  }

  drawHitboxes(tileSelection) {
    tileSelection
      .append('use')
      .attr({
        'xlink:href': '#hitbox',
        'class': 'hitbox',
      });
  }

  bindClick(tileSelection) {
    tileSelection
      .select('.hitbox')
      .on('click', function (d) {
        // Avoid rotation when dragged
        if (d3.event.defaultPrevented) {
          return;
        }
        // Avoid rotation when frozen
        if (d.frozen) {
          return;
        }
        const element = d3.select(d.node).select('.element');
        d.rotation = (d.rotation + 1) % d.type.maxRotation;
        // Assure that rotation animation is clockwise
        const startAngle = d.type.rotationAngle * (d.rotation - 1);
        element
          .attr('transform', `rotate(${-startAngle},0,0)`);
        // Rotation animation
        const endAngle = d.type.rotationAngle * d.rotation;
        element
          .transition()
          .duration(rotationSpeed)
          .attr('transform', `rotate(${-endAngle},0,0)`);
      })
      // NOTE removing with double click only for dev mode
      .on('dblclick', (d) => {
        window.console.log("dblclick removed:", d);
        this.removeTile(d.i, d.j);
      });
  }

  bindDrag(tileSelection) {
    function reposition(data, elem) {
      delete data.newI;
      delete data.newJ;
      elem
        .transition()
        .duration(repositionSpeed)
        .attr(
          'transform',
          `translate(${data.x + tileSize / 2},${data.y + tileSize / 2})`
        );
    }

    const drag = d3.behavior.drag();
    drag
      .on('dragstart', (source) => {
        d3.event.sourceEvent.stopPropagation();
        source.top = false;
      })
      .on('drag', function (source) {
        // Move element to the top
        if (!source.top) {
          // TODO still there are problems in Safari
          source.node.parentNode.appendChild(source.node);
          source.top = true;
        }
        // Is it impossible to drag item?
        if (source.frozen) {
          return;
        }

        d3.select(this)
          .attr('transform', `translate(${d3.event.x},${d3.event.y})`);
        source.newI = Math.floor(d3.event.x / tileSize);
        source.newJ = Math.floor(d3.event.y / tileSize);
      })
      .on('dragend', (source) => {
        // No drag? Return.
        if (source.newI == null || source.newJ == null) {
          return;
        }

        // Find source element
        const sourceElem = d3.select(source.node);

        // Drag ended outside of board? Reposition source and return.
        if (
             source.newI < 0 || source.newI >= this.level.width
          || source.newJ < 0 || source.newJ >= this.level.height
        ) {
          reposition(source, sourceElem);
          return;
        }

        // Find target and target element
        const target = this.tileMatrix[source.newI][source.newJ];
        const targetElem = d3.select(target.node || null);

        // Is it impossible to swap items? Reposition source and return.
        if (source.frozen || target.frozen) {
          reposition(source, sourceElem);
          return;
        }

        // Swap items in matrix
        [this.tileMatrix[source.i][source.j], this.tileMatrix[target.i][target.j]] =
        [this.tileMatrix[target.i][target.j], this.tileMatrix[source.i][source.j]];

        // Swap items positions
        [source.i, source.j, target.i, target.j] =
        [target.i, target.j, source.i, source.j];

        // Reposition both elements
        reposition(source, sourceElem);
        reposition(target, targetElem);
      });

    tileSelection
      .call(drag);
  }

  /**
   * Generate history and play animation.
   */
  play() {

    this.simulation = new simulation.Simulation(this);

    this.simulation.initialize();
    this.simulation.propagateToEnd();

    if (this.particleAnimation) {
      this.particleAnimation.stop();
    }
    this.particleAnimation = new particles.SVGParticleAnimation(this, this.simulation.history, this.simulation.measurementHistory);
    this.particleAnimation.play();
  }

}
