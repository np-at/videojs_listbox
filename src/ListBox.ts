import videojs from "video.js";
import ListBoxItem from "./ListBoxItem";
import ListBoxButton from "./ListBoxButton";
const Component = videojs.getComponent("Component");

interface ListBoxOptions extends videojs.ComponentOptions {
  contentElType: string;
  menuButton: ListBoxButton;

}

class ListBox extends Component {
  focusedChild_: number | null = null;
  selectedChild_: number | null = null;
  menuButton_: ListBoxButton = null;
  options_: ListBoxOptions;
  player_: videojs.Player;
  contentEl_: HTMLElement;
  boundHandleBlur_: (event: Event) => void;
  boundHandleTapClick_: (event: Event) => void;
  boundsHandleMouseEnter_: (event: Event) => void;
  private originalInactivityTimeout_: number;


  /**
   * The Listbox component is used to build popup menus, including subtitle and
   * captions selection menus.
   *
   * @extends Component
   */
  constructor(player, options) {
    super(player, options);
    this.on("keydown", this.handleKeyDown);
    this.on("mouseover", this.handleMouseEnter);
    this.menuButton_ = options.menuButton;

    // All the menu item instances share the same blur handler provided by the menu container.

    this.boundHandleBlur_ = videojs.bind(this, this.handleBlur as never);
    this.boundHandleTapClick_ = videojs.bind(this, this.handleTapClick as never);
    this.boundsHandleMouseEnter_ = videojs.bind(this, this.handleMouseEnter as never);

  }
  disableTimeout() {

    this.originalInactivityTimeout_ = this.player_.options_.inactivityTimeout
    this.player_.options_.inactivityTimeout = 0;
    this.player_.userActive(true);
  }
  reEnableTimeout() {
    if (this.originalInactivityTimeout_ === undefined) {
      return;
    }
    this.player_.options_.inactivityTimeout = this.originalInactivityTimeout_;
    this.player_.userActive(false);
  }
  show() {
    this.removeClass("vjs-hidden");
    for (let i = 0; i < this.children().length; i++) {
      const child = (this.children()[i] as ListBoxItem);

      // if update is implemented, call it
      child.update(undefined);
      if (child.isSelected_) {
        this.selectedChild_ = i;
        break;
      }
    }
    if (this.selectedChild_) {
      this.focus(this.selectedChild_);
      return this.children()[this.selectedChild_] as ListBoxItem;
    }
    return undefined;
  }

  /**
   * Create the `ListBox``s DOM element.
   *
   * @return {Element}
   *         the element that was created
   */
  createEl() {
    const contentElType = this.options_.contentElType || "ul";

    this.contentEl_ = videojs.dom.createEl(contentElType,{
      className: "vjs-menu-content",
      tabindex: -1,
      id: this.id()
    },{
      role: "listbox",

    }) as HTMLElement;


    const el = super.createEl("div", {
      append: this.contentEl_,
      className: "vjs-menu"
    });

    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    videojs.on(el, "click", function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  }

  /**
   * Add a {@link ListBoxItem} to the menu.
   *
   * @param {Object|string} component
   *        The name or instance of the `ListBoxItem` to add.
   *
   */
  addItem(component) {
    const childComponent = this.addChild(component);

    if (childComponent) {
      this.addEventListenerForItem(childComponent);
    }
  }

  /**
   * Add event listeners to the {@link ListBoxItem}.
   *
   * @param {Object} component
   *        The instance of the `ListBoxItem` to add listeners to.
   *
   */
  addEventListenerForItem(component) {
    if (!(component instanceof Component)) {
      return;
    }

    this.on(component, "blur", this.boundHandleBlur_);
    this.on(component, "mouseenter", this.boundsHandleMouseEnter_);
    this.on(component, ["tap", "click"], this.boundHandleTapClick_);
  }

  select(triggerClose = false) {
    const idx = this.focusedChild_;
    const children = this.children() as ListBoxItem[];

    // Deselect all children
    for (const element of children) {
      const child = element;
      if (child) {
        child.selected(false);
      }
    }

    // Select the requested child
    children[idx].selected(true);

    // Update the selected child index
    this.selectedChild_ = idx;
    if (triggerClose) {
      this.menuButton_.handleSelection(children[idx]);
      this.menuButton_.unpressButton();
    }
    return children[idx];
  }

  /**
   * Remove event listeners from the {@link ListBoxItem}.
   *
   * @param {Object} component
   *        The instance of the `ListBoxItem` to remove listeners.
   *
   */
  removeEventListenerForItem(component) {
    if (!(component instanceof Component)) {
      return;
    }

    this.off(component, "blur", this.boundHandleBlur_);
    this.off(component, ["tap", "click"], this.boundHandleTapClick_);
  }

  /**
   * This method will be called indirectly when the component has been added
   * before the component adds to the new menu instance by `addItem`.
   * In this case, the original menu instance will remove the component
   * by calling `removeChild`.
   *
   * @param {Object} component
   *        The instance of the `ListBoxItem`
   */
  removeChild(component) {
    if (typeof component === "string") {
      component = this.getChild(component);
    }

    this.removeEventListenerForItem(component);
    super.removeChild(component);
  }

  dispose() {
    this.contentEl_ = null;
    this.boundHandleBlur_ = null;
    this.boundHandleTapClick_ = null;

    super.dispose();
  }

  /**
   * Called when a `ListBoxItem` loses focus.
   *
   * @param {EventTarget~Event} event
   *        The `blur` event that caused this function to be called.
   *
   * @listens blur
   */
  handleBlur(event: videojs.EventTarget.Event) {
    const relatedTarget = event.relatedTarget || document.activeElement;

    // Close menu popup when a user clicks outside the menu
    if (!this.children().some((element) => {
      return element.el() === relatedTarget;
    })) {
      const btn = this.menuButton_;

      if (btn && btn.buttonPressed_ && relatedTarget !== btn.el().firstChild) {
        btn.unpressButton();
      }
    }
  }


  /**
   * Called when a `ListBoxItem` gets clicked or tapped.
   *
   * @param {EventTarget~Event} event
   *        The `click` or `tap` event that caused this function to be called.
   *
   * @listens click,tap
   */
  handleTapClick(event: Event) {
    // Unpress the associated MenuButton, and move focus back to it
    if (this.menuButton_) {
      this.menuButton_.unpressButton();

      const childComponents = this.children();

      if (!Array.isArray(childComponents)) {
        return;
      }

      const foundComponent = childComponents.filter(component => component.el() === event.target)[0];

      if (!foundComponent) {
        return;
      }

      // don't focus menu button if item is a caption settings item
      // because focus will move elsewhere
      if (foundComponent.name() !== "CaptionSettingsListBoxItem") {
        this.menuButton_.focus();
      }
    }
  }

  /**
   * Handle a `keydown` event on this menu. This listener is added in the constructor.
   *
   * @param {EventTarget~Event} event
   *        A `keydown` event that happened on the ListBox.
   *
   * @listens keydown
   */
  handleKeyDown(event: videojs.EventTarget.Event) {
    switch (event.key) {
      case "Up":
      case "ArrowUp":
      case "Right":
      case "ArrowRight":
        event.preventDefault();
        event.stopPropagation();
        this.stepBack();
        break;

      case "Down":
      case "ArrowDown":
      case "Left":
      case "ArrowLeft":
        event.preventDefault();
        event.stopPropagation();
        this.stepForward();
        break;
      case "Return":
      case "Enter":
      case "Spacebar":
      case " ":
        event.preventDefault();
        event.stopPropagation();
        break;
      default:
        // debug
          if (__DEBUG__) console.log("key not handled from listbox", event.key);
        break;

    }

  }


  /**
   * Move to next (lower) menu item for keyboard users.
   */
  stepForward() {
    let stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ + 1;
    }
    return this.focus(stepChild);
  }

  /**
   * Move to previous (higher) menu item for keyboard users.
   */
  stepBack() {
    let stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ - 1;
    }
    return this.focus(stepChild);
  }


  /**
   * Set  a {@link ListBoxItem} as active in `ListBox`.
   *
   * @param {Object|string} [item=0]
   *        Index of child item set focus on.
   */
  focus(item = -1) {
    if (this.focusedChild_ && this.focusedChild_ === item) {
      // Don't do anything if the item is already focused
      return;
    }
    const children = (this.children() as ListBoxItem[]).slice();
    const haveTitle = children.length && children[0].hasClass("vjs-menu-title");

    if (haveTitle) {
      children.shift();
    }

    if (children.length > 0) {
      if (item < 0) {
        // If no item was specified and there was a previously focused item,
        // focus that item again.
        if (this.focusedChild_)
            item = this.focusedChild_;
        else
          item = 0;
      } else if (item >= children.length) {
        item = children.length - 1;
      }

      // If there was a child before, mark it as not active
      children[this.focusedChild_ || 0].active(false);


      this.focusedChild_ = item;
      children[item].active(true);
      this.menuButton_.updateActiveDescendant(children[item].id());
      return children[item].id();
    }
  }


  private handleMouseEnter(event: videojs.EventTarget.Event) {
    const childComponents = this.children();
    // identify the child component that was moused over
    const foundComponentIdx = childComponents.findIndex(
      (component) => (component.el() === event.target || component.el().parentNode === event.target)
    );
    if (foundComponentIdx === -1) {
      return;
    }
    // if the child component is found, set it as active
    this.focus(foundComponentIdx);
  }


}

videojs.registerComponent("ListBox", ListBox);
export default ListBox;
