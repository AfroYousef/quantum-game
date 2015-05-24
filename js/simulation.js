/*global window:false*/
import _ from 'lodash';

import {EPSILON, velocityI, velocityJ} from './const';
import {maxIterations} from './config';
import * as print from './print';

export class Simulation {

  constructor(board) {
    this.board = board;
    this.history = [];
  }

  /**
   * Clear history and make it one-element list
   * containing initial particles state.
   */
  initialize() {
    const initialState =
      _.reduce(_.range(this.board.level.width), (accI, i) => {
        return _.reduce(_.range(this.board.level.height), (accJ, j) => {
          // Recognize generating tiles by having 'generation' method
          if (!this.board.tileMatrix[i][j].type.generation) {
            return accJ;
          }
          const emissions =
            this.board.tileMatrix[i][j].type.generation(
              this.board.tileMatrix[i][j].rotation
            );
          _.forEach(emissions, (emission) => {
            accJ.push({i:  i,
                       j:  j,
                       to: emission.to,
                       re: emission.re,
                       im: emission.im});
          });
          return accJ;
        }, accI);
      }, []);
    this.history = [initialState];
  }

  /**
   * Make one propagation step and save it in history.
   * Additionally, return it.
   */
  propagate() {
    const lastState = _.last(this.history);
    const displacedState = this.displace(lastState);
    this.absorb(displacedState);
    const newState = this.interact(displacedState);
    this.history.push(newState);

    // debugging purpose
    window.console.log(print.stateToStr(newState));

    return newState;
  }

  /**
   * Creates a new state basing on input state, with particles
   * moved according to their directions.
   */
  // WARNING: creating may be slower than just modifying i and j
  displace(state) {
    return _.map(state, (entry) => {
      // 'to' value = direction + polarization
      const dir = entry.to[0];
      const newI = entry.i + velocityI[dir];
      const newJ = entry.j + velocityJ[dir];
      return {i:  newI,
              j:  newJ,
              to: entry.to,
              re: entry.re,
              im: entry.im};
    });
  }

 absorb(state) {

    // Calculate all absorption probabilites.
    const bins = _.map(state, (entry) => {

      let a = entry.re*entry.re + entry.im*entry.im;

      // Check if particle is out of bound
      if (
           entry.i < 0 || entry.i >= this.board.level.width
        || entry.j < 0 || entry.j >= this.board.level.height
      ) {
        a = a * 1;
      } else {

        const transitionAmps = this.board.tileMatrix[entry.i][entry.j].transitionAmplitudes[entry.to];
        const transmitted = _.chain(transitionAmps)
        .map((change) => change.re * change.re + change.re * change.re)
        .sum();

        a = (1 - transmitted) * a;

      }

      return {i:           entry.i,
              j:           entry.j,
              to:          entry.to,
              probability: a};

    })
    .filter((entry) =>
      entry.probability > EPSILON
    );

    console.log("absorbed", bins);

  }

  /**
   * Creates a new state basing on input state, applying probability
   * function changes from tiles' interactions.
   */
  interact(state) {
    // Collect all transitions into bins. Each bin will be labeled
    // with position (i, j) and momentum direction.
    const bins = _.reduce(state, (acc, entry) => {
      // Check if particle is out of bound
      if (
           entry.i < 0 || entry.i >= this.board.level.width
        || entry.j < 0 || entry.j >= this.board.level.height
      ) {
        return acc;
      }
      const tile = this.board.tileMatrix[entry.i][entry.j];

      // debugging
      if (tile.type.name !== "vacuum") {
        console.log(tile);
      }
      
      const transition = tile.transitionAmplitudes;
      _.each(transition[entry.to], (change) => {
        const binKey = [entry.i, entry.j, change.to].join('_');
        // (a + bi)(c + di) = (ac - bd) + i(ad + bc)
        const re = entry.re * change.re - entry.im * change.im;
        const im = entry.re * change.im + entry.im * change.re;
        // Add to bin
        if (_.has(acc, binKey)) {
          acc[binKey].re += re;
          acc[binKey].im += im;
        } else {
          acc[binKey] = {i:  entry.i,
                         j:  entry.j,
                         to: change.to,
                         re: re,
                         im: im};
        }
      });
      return acc;
    }, {});
    // Remove keys; filter out zeroes
    return _.values(bins).filter((entry) =>
      entry.re * entry.re + entry.im * entry.im > EPSILON
    );
  }

  /**
   * Propagate until:
   * - all probabilities go to 0
   * - iteration limit is reached
   */
  propagateToEnd() {
    let stepNo, lastStep;
    for (stepNo = 0; stepNo < maxIterations; ++stepNo) {
      lastStep = this.propagate();
      if (!lastStep.length) {
        break;
      }
    }
  }

}
