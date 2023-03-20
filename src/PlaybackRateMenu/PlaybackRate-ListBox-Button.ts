import ListBoxButton from "../ListBoxButton";
import videojs from "video.js";
import ListBox from "../ListBox";
import PlaybackRateListBoxItem from "./PlaybackRate-ListBox-Item";

class PlaybackRateListBoxButton extends ListBoxButton {
  constructor(player, options) {
    super(
      player,
      videojs.mergeOptions(options, {
        valueElementClass: "vjs-playback-rate-value",
      })
    );

    this.updateVisibility();

    this.on(player, "loadstart", this.updateVisibility);
    this.on(player, "ratechange", this.updateRate);
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  override buildCSSClass() {
    return `vjs-playback-rate ${super.buildCSSClass()}`;
  }

  override buildWrapperCSSClass() {
    return `vjs-playback-rate ${super.buildWrapperCSSClass()}`;
  }

  /**
   * Create the playback rate menu
   *
   * @return {Menu}
   *         Menu object populated with {@link PlaybackRateListBoxItem}s
   */
  override createMenu() {
    const menu = new ListBox(
      this.player(),
      videojs.mergeOptions(this.options_, { menuButton: this })
    );
    const rates = this.playbackRates();

    if (rates) {
      for (let i = rates.length - 1; i >= 0; i--) {
        menu.addChild(
          new PlaybackRateListBoxItem(this.player(), { rate: rates[i] + "x" })
        );
      }
    }

    return menu;
  }

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
    return (
      this.player().tech(true) &&
      this.player().tech(true).featuresPlaybackRate &&
      this.playbackRates() &&
      this.playbackRates().length > 0
    );
  }

  /**
   * Hide playback rate controls when they're no playback rate options to select
   *
   *
   * @listens Player#loadstart
   */
  updateVisibility() {
    if (this.playbackRateSupported()) {
      this.removeClass("vjs-hidden");

      // load the current playback rate
      // into the menu button's visible text
      this.updateRate();
    } else {
      this.addClass("vjs-hidden");
    }
  }

  /**
   * Update button value when rate changed
   *
   * @listens Player#ratechange
   */
  updateRate() {
    if (this.playbackRateSupported()) {
      this.updateValue(this.player().playbackRate() + "x");
    }
  }

  override handleSelection(listBoxItem) {
    this.player().playbackRate(parseFloat(listBoxItem.options_.rate));
  }
}

PlaybackRateListBoxButton.prototype.controlText_ = "Playback Rate";

videojs.registerComponent(
  "PlaybackRateListBoxButton",
  PlaybackRateListBoxButton
);

export default PlaybackRateListBoxButton;
