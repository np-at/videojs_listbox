import ListBoxButton from "../ListBoxButton";
import videojs from "video.js";
import ListBox from "~videojs_components/ListBox";
import PlaybackRateListBoxItem from "~videojs_components/PlaybackRateMenu/PlaybackRate-ListBox-Item";


class PlaybackRateListBoxButton extends ListBoxButton {
  labelEl_: HTMLElement;
  constructor(player, options) {
    super(player, options);

    this.updateVisibility();
    this.updateLabel(undefined);

    this.on(player, 'loadstart', this.updateVisibility);
    this.on(player, 'ratechange', this.updateLabel);
  }

  createEl() {
    const el = super.createEl();

    this.labelEl_ = videojs.dom.createEl('div', {
      className: 'vjs-playback-rate-value',
      innerHTML: '1x'
    }) as HTMLElement;

    el.appendChild(this.labelEl_);

    return el;
  }

  dispose() {
    this.labelEl_ = null;

    super.dispose();
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-playback-rate ${super.buildCSSClass()}`;
  }

  buildWrapperCSSClass() {
    return `vjs-playback-rate ${super.buildWrapperCSSClass()}`;
  }


  /**
   * Create the playback rate menu
   *
   * @return {Menu}
   *         Menu object populated with {@link PlaybackRateListBoxItem}s
   */
  createMenu() {
    const menu = new ListBox(this.player(), videojs.mergeOptions(this.options_,{menuButton: this}));
    const rates = this.playbackRates();

    if (rates) {
      for (let i = rates.length - 1; i >= 0; i--) {
        menu.addChild(new PlaybackRateListBoxItem(this.player(), {rate: rates[i] + 'x'}));
      }
    }

    return menu;
  }


  /**
   * Updates ARIA accessibility attributes
   */
  updateARIAAttributes() {
    // Current playback rate
    this.el().setAttribute('aria-valuenow', this.player().playbackRate().toString(10));
  }



  /**
   * This gets called when an `PlaybackRateMenuButton` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  // handleClick(event) {
  //   // select next rate option
  //   const currentRate = this.player().playbackRate();
  //   const rates = this.playbackRates();
  //
  //   // this will select first one if the last one currently selected
  //   let newRate = rates[0];
  //
  //   for (let i = 0; i < rates.length; i++) {
  //     if (rates[i] > currentRate) {
  //       newRate = rates[i];
  //       break;
  //     }
  //   }
  //   this.player().playbackRate(newRate);
  //   if (super)
  // }

  /**
   * Get possible playback rates
   *
   * @return {Array}
   *         All possible playback rates
   */
  playbackRates() {
    return this.player().options_.playbackRates;
  }

  /**
   * Get whether playback rates is supported by the tech
   * and an array of playback rates exists
   *
   * @return {boolean}
   *         Whether changing playback rate is supported
   */
  playbackRateSupported() {
    return this.player().tech(true) &&
      this.player().tech(true).featuresPlaybackRate &&
      this.playbackRates() &&
      this.playbackRates().length > 0
      ;
  }



  /**
   * Hide playback rate controls when they're no playback rate options to select
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#loadstart
   */
  updateVisibility() {
    if (this.playbackRateSupported()) {
      this.removeClass('vjs-hidden');
    } else {
      this.addClass('vjs-hidden');
    }
  }

  /**
   * Update button label when rate changed
   *
   * @param {EventTarget~Event|undefined} [_event?]
   *        The event that caused this function to run.
   *
   * @listens Player#ratechange
   */
  updateLabel(_event) {
    if (this.playbackRateSupported()) {
      this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
    }
  }
  handleSelection(listBoxItem) {
    this.player().playbackRate(parseFloat(listBoxItem.options_.rate));
  }
}

PlaybackRateListBoxButton.prototype.controlText_ = 'Playback Rate';

videojs.registerComponent('PlaybackRateListBoxButton', PlaybackRateListBoxButton);
