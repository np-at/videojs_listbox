import videojs from "video.js";
import ListBoxItem from "~videojs_components/ListBoxItem";
import Player = videojs.Player;


class PlaybackRateListBoxItem extends ListBoxItem {
  contentElType: string;
  label: any;
  rate: number;
  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player: Player, options) {
    const label = options.rate;
    const rate = parseFloat(label);

    // Modify options for parent MenuItem class's init.
    options.label = label;
    options.selected = rate === 1;
    options.selectable = true;

    super(player, options);

    this.label = label;
    this.rate = rate;

    this.on(player, 'ratechange', this.update);
  }

  /**
   * This gets called when an `PlaybackRateMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    super.handleClick(event);
    this.player().playbackRate(this.rate);

  }
  /**
   * Update the PlaybackRateMenuItem when the playbackrate changes.
   *
   * @param {EventTarget~Event} [event]
   *        The `ratechange` event that caused this function to run.
   *
   * @listens Player#ratechange
   */
  update(event) {
    this.selected(this.player().playbackRate() === this.rate);
  }
}
PlaybackRateListBoxItem.prototype.contentElType = 'button';

videojs.registerComponent("PlaybackRateListBoxItem", PlaybackRateListBoxItem);

export default PlaybackRateListBoxItem;
