import videojs from "video.js";
var Event = videojs.EventTarget.Event;

const MenuKeys = [
  "Tab",
  "Esc",
  "Escape",
  "Up",
  "ArrowUp",

  "Down",
  "ArrowDown",
  "Right",
  "ArrowRight",
  "Left",
  "ArrowLeft",
  "Enter",
  "Return",
  "Space",
  " ",
];

const Component = videojs.getComponent("Component");
const ClickableComponent = videojs.getComponent("ClickableComponent");

class ListBoxItem extends ClickableComponent {
  constructor(player, options) {
    super(player, options);

    this.selectable = options.selectable;
    this.isSelected_ = options.selected || false;
    this.idx_ = options.idx;

    this.selected(this.isSelected_);

    if (this.selectable) {
      this.el().setAttribute("role", "option");
    }
  }
  /**
   * Create the `OptionItem's DOM element
   *
   * @param {string} [type=li]
   *        Element's node type, not actually used, always set to `li`.
   *
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element
   *
   * @param {Object} [attrs={}]
   *        An object of attributes that should be set on the element
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl(type, props, attrs) {
    // The control is textual, not just an icon
    this.nonIconControl = true;
    return super.createEl(
      "li",
      videojs.mergeOptions(
        {
          className: "vjs-menu-item",
          innerHTML: `<span class="vjs-menu-item-text">${this.localize(
            this.options_.label
          )}</span>`,
          id: this.id(),
        },
        props,
        {
          // Force the control to be a non-tabbable element
          // this is the easiest way to do this - it will otherwise
          // default to 0 and be tabbable
          tabIndex: -1,
        }
      ),
      attrs
    );
  }
  handleClick(event) {
    this.selected(true);
    // @ts-ignore
    this.parentComponent_.focus(this.idx_);
    // @ts-ignore
    this.parentComponent_.select(true);
  }
  active(isActive = this.isActive) {
    if (isActive) {
      this.addClass("vjs-active");
    } else {
      this.removeClass("vjs-active");
    }
  }
  selected(selected) {
    if (this.selectable) {
      if (selected) {
        this.addClass("vjs-selected");
        this.el().setAttribute("aria-selected", "true");
        this.isSelected_ = true;
      } else {
        this.removeClass("vjs-selected");
        this.el().setAttribute("aria-selected", "false");
        this.isSelected_ = false;
      }
    }
  }

  /**
   * Ignore keys which are used by the menu, but pass any other ones up. See
   * {@link ClickableComponent#handleKeyDown} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  // handleKeyDown(event: Event) {
  //   if (!MenuKeys.some((key) => event.key === key)) {
  //     // Pass keydown handling up for unused keys
  //     super.handleKeyPress(event);
  //
  //   }
  // }

  /**
   * Update the state of the menu item.
   * @param event
   * @abstract
   */
  update(event) {
    // abstract
  }
}

videojs.registerComponent("ListBoxItem", ListBoxItem);
export default ListBoxItem;
