import videojs from "video.js";
import ListBox from "./ListBox";
import ListBoxItem from "./ListBoxItem";

const Component = videojs.getComponent("Component");
const Button = videojs.getComponent("Button");

export type ListBoxButtonOptions = videojs.ComponentOptions & {
  inline?: boolean;
  title?: string;
  valueElementClass?: string; // class to add to span containing the value
};

class ListBoxButton extends Component {
  menuButton_: videojs.Button;
  controlText_: string;
  private enabled_: boolean;
  hideThreshold_: number;
  options_: ListBoxButtonOptions;
  private menu: ListBox;
  private items: ListBoxItem[];
  buttonPressed_ = false;
  public activeDescendant: string | null;

  toTitleCase = function (string) {
    if (typeof string !== "string") {
      return string;
    }

    return string.replace(/./, (w) => w.toUpperCase());
  };
  labelEl_: HTMLElement;
  valueEl_: HTMLElement;
  valueText_: string;

  constructor(player: videojs.Player, options: ListBoxButtonOptions) {
    super(player, options);
    this.menuButton_ = new Button(player, options);

    this.menuButton_.el().setAttribute("aria-haspopup", "listbox");
    this.menuButton_.el().setAttribute("role", "combobox");
    this.menuButton_.el().setAttribute("aria-labelledby", this.labelEl_.id);
    if (this.options_.valueElementClass) {
      this.labelEl_.className += " " + this.options_.valueElementClass;
    }
    // Add buildCSSClass values to the button, not the wrapper
    const buttonClass = Button.prototype.buildCSSClass();

    this.menuButton_.el().className = this.buildCSSClass() + " " + buttonClass;
    this.menuButton_.removeClass("vjs-control");

    this.addChild(this.menuButton_);

    // Add value element to the button
    this.menuButton_.el().appendChild(this.valueEl_);

    this.update();

    this.enabled_ = true;

    this.on(this.menuButton_, "tap", this.handleClick);
    this.on(this.menuButton_, "click", this.handleClick);
    this.on(this.menuButton_, "keydown", this.handleKeyDown);
    this.on(this.menuButton_, "mouseenter", () => {
      this.addClass("vjs-hover");
      this.pressButton();
      videojs.on(
        document as never,
        "keyup",
        videojs.bind(this, this.handleMenuKeyUp as never)
      );
    });
    this.on("mouseleave", this.handleMouseLeave);
    this.on("keydown", this.handleSubmenuKeyDown);
  }

  /**
   * Create the menu and add all items to it.
   *
   * @return {ListBox}
   *         The constructed menu
   */
  createMenu() {
    const menu: ListBox = new ListBox(this.player_, { menuButton: this });

    /**
     * Hide the menu if the number of items is less than or equal to this threshold. This defaults
     * to 0 and whenever we add items which can be hidden to the menu we'll increment it. We list
     * it here because every time we run `createMenu` we need to reset the value.
     *
     * @protected
     * @type {Number}
     */
    this.hideThreshold_ = 0;

    // Add a title list item to the top
    if (this.options_.title) {
      const titleEl = videojs.dom.createEl("li", {
        className: "vjs-menu-title",
        innerHTML: this.toTitleCase(this.options_.title),
        tabIndex: -1,
      }) as HTMLElement;

      this.hideThreshold_ += 1;

      const titleComponent = new Component(this.player_, { el: titleEl });

      menu.addItem(titleComponent);
    }

    this.items = this.createItems();

    if (this.items) {
      // Add menu items to the menu
      for (const element of this.items) {
        menu.addItem(element);
      }
    }

    return menu;
  }

  /**
   * Handler for a  selection event on a menu item.
   * @param {ListBoxItem} selectedItem The item that was selected.
   * @abstract
   */
  handleSelection(selectedItem: ListBoxItem) {
    console.error(
      "handleSelection not implemented for ListBoxButton",
      selectedItem
    );
  }

  /**
   * Update the menu based on the current state of its items.
   */
  update() {
    const menu = this.createMenu();

    if (this.menu) {
      this.menu.dispose();
      this.removeChild(this.menu);
    }

    this.menu = menu;
    this.addChild(menu);

    /**
     * Track the state of the menu button
     *
     * @type {Boolean}
     * @private
     */
    this.buttonPressed_ = false;
    this.menuButton_.el().setAttribute("aria-expanded", "false");

    if (this.items && this.items.length <= this.hideThreshold_) {
      this.hide();
    } else {
      this.show();
    }

    this.menuButton_.el().setAttribute("aria-controls", this.menu.id());
  }

  /**
   * Create the list of menu items. Specific to each subclass.
   *
   * @abstract
   */
  createItems(): ListBoxItem[] {
    return [];
  }

  /**
   * Create the `MenuButtons`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  override createEl(
    tagName?: string,
    properties?: Record<string, string>,
    attributes?: Record<string, string>
  ) {
    const el = super.createEl(
      "div",
      Object.assign(
        {
          className: this.buildWrapperCSSClass(),
        },
        properties
      ),
      attributes
    );

    this.labelEl_ = videojs.dom.createEl("label", {
      className: "vjs-control-text",
      innerHTML: this.controlText_,
    }) as HTMLElement;
    this.labelEl_.setAttribute("for", this.id());
    this.labelEl_.setAttribute("id", this.id() + "_label");

    el.appendChild(this.labelEl_);

    this.valueEl_ = videojs.dom.createEl("span", {
      className: "vjs-control-value",
      innerHTML: this.valueText_ || "",
    }) as HTMLElement;
    return el;
  }

  /**
   * Allow sub components to stack CSS class names for the wrapper element
   *
   * @return {string}
   *         The constructed wrapper DOM `className`
   */
  buildWrapperCSSClass() {
    let menuButtonClass = "vjs-menu-button";

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += "-inline";
    } else {
      menuButtonClass += "-popup";
    }

    // TODO: Fix the CSS so that this isn't necessary
    const buttonClass = Button.prototype.buildCSSClass();

    return `vjs-menu-button ${menuButtonClass} ${buttonClass} ${super.buildCSSClass()}`;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  override buildCSSClass() {
    let menuButtonClass = "vjs-menu-button";

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += "-inline";
    } else {
      menuButtonClass += "-popup";
    }

    return `vjs-menu-button ${menuButtonClass} ${super.buildCSSClass()}`;
  }

  updateValue(newValue: string) {
    this.valueEl_.innerHTML = newValue;
  }

  /**
   * Get or set the localized control text that will be used for accessibility.
   *
   * > NOTE: This will come from the internal `menuButton_` element.
   *
   * @param {string} [text]
   *        Control text for element.
   *
   * @return {string}
   *         - The control text getting
   */
  override controlText(text) {
    this.controlText_ = text;
    this.labelEl_.innerHTML = this.controlText_;

    return this.controlText_;
  }

  /**
   * Dispose of the `menu-button` and all child components.
   */
  override dispose() {
    this.handleMouseLeave(undefined);
    super.dispose();
  }

  /**
   * Handle a click on a `MenuButton`.
   * See {@link ClickableComponent#handleClick} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens click
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleClick(event) {
    if (this.buttonPressed_) {
      this.unpressButton();
    } else {
      this.pressButton();
    }
  }

  /**
   * Handle `mouseleave` for `ListBoxButton`.
   *
   * @param {EventTarget~Event} event
   *        The `mouseleave` event that caused this function to be called.
   *
   * @listens mouseleave
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseLeave(event) {
    this.removeClass("vjs-hover");
    this.unpressButton(true);

    videojs.off(
      document as never,
      "keyup",
      videojs.bind(this, this.handleMenuKeyUp as never)
    );
  }

  /**
   * Set the focus to the actual button, not to this element
   */
  override focus() {
    this.menuButton_.focus();
  }

  /**
   * Remove the focus from the actual button, not this element
   */
  override blur() {
    this.menuButton_.blur();
  }

  /**
   * Handle tab, escape, down arrow, and up arrow keys for `MenuButton`. See
   * {@link ClickableComponent#handleKeyDown} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event: videojs.EventTarget.Event) {
    switch (event.key) {
      // Escape or Tab unpress the 'button'
      case "Tab":
        if (this.buttonPressed_) {
          this.unpressButton();
        }
        break;
      // Set focus to the menu
      case "Escape":
      case "Esc":
        if (this.buttonPressed_) {
          this.unpressButton();
        }
        event.preventDefault();
        this.menuButton_.focus();
        break;
      case "ArrowDown":
      case "Down":
        event.preventDefault();
        if (!this.buttonPressed_) {
          this.pressButton();
        }
        this.activeDescendant = this.menu.stepForward();
        this.updateActiveDescendant(this.activeDescendant);
        break;
      case "ArrowUp":
      case "Up":
        event.preventDefault();
        if (!this.buttonPressed_) {
          this.pressButton();
        }
        this.activeDescendant = this.menu.stepBack();
        this.updateActiveDescendant(this.activeDescendant);
        break;
      case " ":
      case "Spacebar":
      case "Enter":
        event.preventDefault();
        if (!this.buttonPressed_) {
          this.pressButton();
        } else {
          const selectedChild = this.menu.select();
          this.handleSelection(selectedChild);
          this.unpressButton();
        }
        break;
      default:
        if (__DEBUG__)
          console.debug("Key not handled from ListboxButton: " + event.key);

        break;
    }
  }

  /**
   * Handle a `keyup` event on a `MenuButton`. The listener for this is added in
   * the constructor.
   *
   *        Key press event
   *
   * @listens keyup
   * @param event {KeyboardEvent} The keyup event that caused this function to be called.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMenuKeyUp(event: KeyboardEvent) {
    // Escape or Tab unpresses the 'button'
    if (event.key === "Tab" || event.key === "Escape" || event.key === "Esc") {
      this.unpressButton(true);

      // Unbind the keyup listener
      // Not sure if this is necessary
      // It doesn't seem to double up in practice, but better safe than sorry
      videojs.off(
        document as never,
        "keyup",
        videojs.bind(this, this.handleMenuKeyUp as never)
      );
    }
  }

  /**
   * This method name now delegates to `handleSubmenuKeyDown`. This means
   * anyone calling `handleSubmenuKeyPress` will not see their method calls
   * stop working.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to be called.
   */
  handleSubmenuKeyPress(event) {
    this.handleSubmenuKeyDown(event);
  }

  /**
   * Handle a `keydown` event on a sub-menu. The listener for this is added in
   * the constructor.
   *
   * @param {EventTarget~Event} event
   *        Key press event
   *
   * @listens keydown
   */
  handleSubmenuKeyDown(event) {
    switch (event.key) {
      // Escape or Tab unpress the 'button'
      case "Tab":
        if (this.buttonPressed_) {
          this.unpressButton(true);
        }
        break;
      case "Escape":
      case "Esc":
        if (this.buttonPressed_) {
          this.unpressButton();
        }
        event.preventDefault();
        this.menuButton_.focus();
        break;
      default:
        // NOTE: This is a special case where we don't pass unhandled
        //  keydown events up to the Component handler, because it is
        //  just entending the keydown handling of the `MenuItem`
        //  in the `Menu` which already passes unused keys up.
        break;
    }
  }

  /**
   * Put the current `MenuButton` into a pressed state.
   */
  pressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = true;
      const active = this.menu.show();
      if (active) {
        this.updateActiveDescendant(active.id());
      }
      this.menu.lockShowing();
      this.menuButton_.el().setAttribute("aria-expanded", "true");

      // set the focus into the submenu, except on iOS where it is resulting in
      // undesired scrolling behavior when the player is in an iframe
      if (videojs.browser.IS_IOS && videojs.dom.isInFrame()) {
        // Return early so that the menu isn't focused
        return;
      }
      // Keep controlBar visible when this Listbox is expanded
      this.menu.disableTimeout();
    }
  }

  /**
   * Take the current `MenuButton` out of a pressed state.
   * @param skipFocus - If true, do not push focus back to the menu button
   */
  unpressButton(skipFocus = false) {
    if (this.enabled_) {
      this.buttonPressed_ = false;
      this.menu.unlockShowing();
      this.menu.hide();
      this.menuButton_.el().setAttribute("aria-expanded", "false");
      this.updateActiveDescendant(null);

      // Release visibility lock on controlBar when this Listbox is collapsed
      this.menu.reEnableTimeout();
      if (!skipFocus) {
        this.menuButton_.focus();
      }
    }
  }

  /**
   * Disable the `MenuButton`. Don't allow it to be clicked.
   */
  disable() {
    this.unpressButton();

    this.enabled_ = false;
    this.addClass("vjs-disabled");

    this.menuButton_.disable();
  }

  /**
   * Enable the `MenuButton`. Allow it to be clicked.
   */
  enable() {
    this.enabled_ = true;
    this.removeClass("vjs-disabled");

    this.menuButton_.enable();
  }

  updateActiveDescendant(id) {
    if (id) this.menuButton_.el().setAttribute("aria-activedescendant", id);
    else this.menuButton_.el().removeAttribute("aria-activedescendant");
  }
}

videojs.registerComponent("ListBoxButton", ListBoxButton);
export default ListBoxButton;
