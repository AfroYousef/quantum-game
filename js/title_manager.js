/*global window:false*/
import {displayMessageTimeout} from './config';

export class TitleManager {
  constructor(titleElem, subtitleElem) {
    this.titleElem = titleElem;
    this.subtitleElem = subtitleElem;
    this.classChangeTimeout = null;
  }

  setTitle(title) {
    this.titleElem.html(title);
  }

  setDescription(description) {
    this.subtitleElem.select('.top-bar__subtitle__description')
      .html(description);
  }

  displayMessage(message, type, timeout = displayMessageTimeout) {
    this.subtitleElem.select('.top-bar__subtitle__message')
      .html(message)
      .classed('top-bar__subtitle__message--success', type === 'success')
      .classed('top-bar__subtitle__message--failure', type === 'failure')
      .classed('top-bar__subtitle__message--progress', type === 'progress');
    this.subtitleElem.classed('top-bar__subtitle--message', true);
    if (this.classChangeTimeout) {
      window.clearTimeout(this.classChangeTimeout);
    }
    if (timeout > 0) {
      this.classChangeTimeout = setTimeout(() => {
        this.subtitleElem.classed('top-bar__subtitle--message', false);
      }, timeout);
    }
  }
}
