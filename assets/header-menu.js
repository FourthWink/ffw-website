import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

const ACTIVATE_DELAY = 0;
const DEACTIVATE_DELAY = 350;

/**
 * A custom element that manages a header menu.
 *
 * @typedef {Object} State
 * @property {HTMLElement | null} activeItem - The currently active menu item.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} overflowMenu - The overflow menu.
 * @property {HTMLElement[]} [submenu] - The submenu in each respective menu item.
 *
 * @extends {Component<Refs>}
 */
class HeaderMenu extends Component {
  requiredRefs = ['overflowMenu'];

  #abortController = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    this.#syncOverflowLinks();
    requestAnimationFrame(this.#syncOverflowLinks);

    this.overflowMenu?.addEventListener('pointerleave', () => this.#debouncedDeactivate(), {
      signal: this.#abortController.signal,
    });

    onDocumentLoaded(this.#preloadImages);
    onDocumentLoaded(this.#syncOverflowLinks);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
  }

  /**
   * @type {State}
   */
  #state = {
    activeItem: null,
  };

  /**
   * Time to allow for a closing animation between initiating a deactivation and actually deactivating the active item.
   * @returns {number}
   */
  get animationDelay() {
    const value = this.dataset.animationDelay;
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Get the overflow menu
   */
  get overflowMenu() {
    return /** @type {HTMLElement | null} */ (this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow"]'));
  }

  /**
   * Whether the overflow menu is hovered
   * @returns {boolean}
   */
  get overflowHovered() {
    return this.refs.overflowMenu?.matches(':hover') ?? false;
  }

  /**
   * Activate the selected menu item immediately
   * @param {PointerEvent | FocusEvent} event
   */
  activate = (event) => {
    this.#debouncedDeactivate.cancel();
    this.#debouncedActivateHandler.cancel();

    this.#debouncedActivateHandler(event);
  };

  /**
   * Activate the selected menu item with a delay
   * @param {PointerEvent | FocusEvent} event
   */
  #activateHandler = (event) => {
    this.#debouncedDeactivate.cancel();

    this.dispatchEvent(new MegaMenuHoverEvent());

    this.removeAttribute('data-animating');

    if (!(event.target instanceof Element)) return;

    let item = findMenuItem(event.target);

    if (!item || item == this.#state.activeItem) return;

    const isDefaultSlot = event.target.slot === '';

    this.dataset.overflowExpanded = (!isDefaultSlot).toString();
    this.#syncOverflowLinks();

    const previouslyActiveItem = this.#state.activeItem;

    if (previouslyActiveItem) {
      previouslyActiveItem.ariaExpanded = 'false';
    }

    this.#state.activeItem = item;
    this.ariaExpanded = 'true';
    item.ariaExpanded = 'true';

    let submenu = findSubmenu(item);

    if (!submenu && !isDefaultSlot) {
      submenu = this.overflowMenu;
    }

    // Mark submenu as active for content-visibility optimization
    if (submenu) {
      submenu.dataset.active = '';
    }

    const submenuHeight = submenu ? submenu.offsetHeight : 0;

    this.style.setProperty('--submenu-height', `${submenuHeight}px`);
    this.style.setProperty('--submenu-opacity', '1');
  };

  #debouncedActivateHandler = debounce(this.#activateHandler, ACTIVATE_DELAY);

  /**
   * Deactivate the active item after a delay
   * @param {PointerEvent | FocusEvent} event
   */
  deactivate(event) {
    this.#debouncedActivateHandler.cancel();

    if (!(event.target instanceof Element)) return;

    const item = findMenuItem(event.target);

    // Make sure the item to be deactivated is still the active one. Ideally
    // we cancelled the debounce before the item was changed, but just in case.
    if (item === this.#state.activeItem) {
      this.#debouncedDeactivate();
    }
  }

  /**
   * Deactivate the active item immediately
   * @param {HTMLElement | null} [item]
   */
  #deactivate = (item = this.#state.activeItem) => {
    if (!item || item != this.#state.activeItem) return;
    if (this.overflowHovered) return;

    this.style.setProperty('--submenu-height', '0px');
    this.style.setProperty('--submenu-opacity', '0');
    this.dataset.overflowExpanded = 'false';
    this.#syncOverflowLinks();

    const submenu = findSubmenu(item);

    this.#state.activeItem = null;
    this.ariaExpanded = 'false';
    item.ariaExpanded = 'false';
    item.setAttribute('data-animating', '');

    setTimeout(() => {
      item.removeAttribute('data-animating');
      // Remove active state from submenu after animation completes
      if (submenu) {
        delete submenu.dataset.active;
      }
    }, Math.max(0, this.animationDelay - 150)); // Start header transition 150ms before submenu finishes
  };

  /**
   * Deactivate the active item after a delay
   * @param {PointerEvent | FocusEvent} event
   */
  #debouncedDeactivate = debounce(this.#deactivate, DEACTIVATE_DELAY);

  /**
   * Preload images that are set to load lazily.
   */
  #preloadImages = () => {
    const images = this.querySelectorAll('img[loading="lazy"]');
    images?.forEach((image) => image.removeAttribute('loading'));
  };

  /**
   * Keep overflow links out of the tablet layout until the More menu is active.
   */
  #syncOverflowLinks = () => {
    const isExpanded = this.dataset.overflowExpanded === 'true';
    const links = this.querySelectorAll('.menu-list__list-item[slot="overflow"] > .menu-list__link');

    links.forEach((link) => {
      if (!(link instanceof HTMLElement)) return;

      link.toggleAttribute('aria-hidden', !isExpanded);

      if (isExpanded) {
        link.removeAttribute('tabindex');
        link.style.removeProperty('opacity');
        link.style.removeProperty('visibility');
        link.style.removeProperty('pointer-events');
        return;
      }

      link.setAttribute('tabindex', '-1');
      link.style.setProperty('opacity', '0', 'important');
      link.style.setProperty('visibility', 'hidden', 'important');
      link.style.setProperty('pointer-events', 'none', 'important');
    });
  };
}

if (!customElements.get('header-menu')) {
  customElements.define('header-menu', HeaderMenu);
}

/**
 * Find the closest menu item.
 * @param {Element | null | undefined} element
 * @returns {HTMLElement | null}
 */
function findMenuItem(element) {
  if (!(element instanceof Element)) return null;

  if (element?.matches('[slot="more"')) {
    // Select the first overflowing menu item when hovering over the "More" item
    return findMenuItem(element.parentElement?.querySelector('[slot="overflow"]'));
  }

  return element?.querySelector('[ref="menuitem"]');
}

/**
 * Find the closest submenu.
 * @param {Element | null | undefined} element
 * @returns {HTMLElement | null}
 */
function findSubmenu(element) {
  const submenu = element?.parentElement?.querySelector('[ref="submenu[]"]');
  return submenu instanceof HTMLElement ? submenu : null;
}
