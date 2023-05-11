/*! DSFR v1.6.0 | SPDX-License-Identifier: MIT | License-Filename: LICENSE.md | restricted use (see terms and conditions) */

const config = {
  prefix: 'fr',
  namespace: 'dsfr',
  organisation: '@gouvfr',
  version: '1.6.0'
};

const api = window[config.namespace];

/**
  * TabButton correspond au bouton cliquable qui change le panel
  * TabButton étend de DisclosureButton qui ajoute/enelve l'attribut aria-selected,
  * Et change l'attributte tabindex a 0 si le boutton est actif (value=true), -1 s'il n'est pas actif (value=false)
 */
class TabButton extends api.core.DisclosureButton {
  constructor () {
    super(api.core.DisclosureType.SELECT);
  }

  static get instanceClassName () {
    return 'TabButton';
  }

  apply (value) {
    super.apply(value);
    if (this.isPrimary) {
      this.setAttribute('tabindex', value ? '0' : '-1');
      if (value) {
        if (this.list) this.list.focalize(this);
      }
    }
  }

  get list () {
    return this.element.getAscendantInstance('TabsList', 'TabsGroup');
  }
}

const TabSelector = {
  TAB: api.internals.ns.selector('tabs__tab'),
  GROUP: api.internals.ns.selector('tabs'),
  PANEL: api.internals.ns.selector('tabs__panel'),
  LIST: api.internals.ns.selector('tabs__list'),
  SHADOW: api.internals.ns.selector('tabs__shadow'),
  SHADOW_LEFT: api.internals.ns.selector('tabs__shadow--left'),
  SHADOW_RIGHT: api.internals.ns.selector('tabs__shadow--right'),
  PANEL_START: api.internals.ns.selector('tabs__panel--direction-start'),
  PANEL_END: api.internals.ns.selector('tabs__panel--direction-end')
};

const TabPanelDirection = {
  START: 'direction-start',
  END: 'direction-end',
  NONE: 'none'
};

/**
  * Tab coorespond au panel d'un élement Tabs (tab panel)
  * Tab étend disclosure qui ajoute/enleve le modifier --selected,
  * et ajoute/eleve l'attribut hidden, sur le panel
  */
class TabPanel extends api.core.Disclosure {
  constructor () {
    super(api.core.DisclosureType.SELECT, TabSelector.PANEL, TabButton, 'TabsGroup');
    this._direction = TabPanelDirection.NONE;
    this._isPreventingTransition = false;
  }

  static get instanceClassName () {
    return 'TabPanel';
  }

  get direction () {
    return this._direction;
  }

  set direction (value) {
    if (value === this._direction) return;
    switch (this._direction) {
      case TabPanelDirection.START:
        this.removeClass(TabSelector.PANEL_START);
        break;

      case TabPanelDirection.END:
        this.removeClass(TabSelector.PANEL_END);
        break;

      case TabPanelDirection.NONE:
        break;

      default:
        return;
    }

    this._direction = value;

    switch (this._direction) {
      case TabPanelDirection.START:
        this.addClass(TabSelector.PANEL_START);
        break;

      case TabPanelDirection.END:
        this.addClass(TabSelector.PANEL_END);
        break;
    }
  }

  get isPreventingTransition () {
    return this._isPreventingTransition;
  }

  set isPreventingTransition (value) {
    if (this._isPreventingTransition === value) return;
    if (value) this.addClass(api.internals.motion.TransitionSelector.NONE);
    else this.removeClass(api.internals.motion.TransitionSelector.NONE);
    this._isPreventingTransition = value === true;
  }

  translate (direction, initial) {
    this.isPreventingTransition = initial;
    this.direction = direction;
  }

  reset () {
    this.group.index = 0;
  }
}

/**
* TabGroup est la classe étendue de DiscosuresGroup
* Correspond à un objet Tabs avec plusieurs tab-button & Tab (panel)
*/
class TabsGroup extends api.core.DisclosuresGroup {
  constructor () {
    super('TabPanel');
  }

  static get instanceClassName () {
    return 'TabsGroup';
  }

  init () {
    super.init();
    this.listen('transitionend', this.transitionend.bind(this));
    this.listenKey(api.core.KeyCodes.RIGHT, this.pressRight.bind(this), true, true);
    this.listenKey(api.core.KeyCodes.LEFT, this.pressLeft.bind(this), true, true);
    this.listenKey(api.core.KeyCodes.HOME, this.pressHome.bind(this), true, true);
    this.listenKey(api.core.KeyCodes.END, this.pressEnd.bind(this), true, true);
    this.isRendering = true;

    if (this.list) this.list.apply();
  }

  get list () {
    return this.element.getDescendantInstances('TabsList', 'TabsGroup', true)[0];
  }

  transitionend (e) {
    this.isPreventingTransition = true;
  }

  get buttonHasFocus () {
    return this.members.some(member => member.buttonHasFocus);
  }

  /**
   * Selectionne l'element suivant de la liste si on est sur un bouton
   * Si on est à la fin on retourne au début
   */
  pressRight () {
    if (this.buttonHasFocus) {
      if (this.index < this.length - 1) {
        this.index++;
      } else {
        this.index = 0;
      }

      this.focus();
    }
  };

  /**
   * Selectionne l'element précédent de la liste si on est sur un bouton
   * Si on est au debut retourne a la fin
   */
  pressLeft () {
    if (this.buttonHasFocus) {
      if (this.index > 0) {
        this.index--;
      } else {
        this.index = this.length - 1;
      }

      this.focus();
    }
  };

  /**
   * Selectionne le permier element de la liste si on est sur un bouton
   */
  pressHome () {
    if (this.buttonHasFocus) {
      this.index = 0;
      this.focus();
    }
  };

  /**
   * Selectionne le dernier element de la liste si on est sur un bouton
   */
  pressEnd () {
    if (this.buttonHasFocus) {
      this.index = this.length - 1;
      this.focus();
    }
  };

  focus () {
    if (this.current) {
      this.current.focus();
    }
  }

  apply () {
    for (let i = 0; i < this._index; i++) this.members[i].translate(TabPanelDirection.START);
    this.current.translate(TabPanelDirection.NONE);
    for (let i = this._index + 1; i < this.length; i++) this.members[i].translate(TabPanelDirection.END);
    this.isPreventingTransition = false;
  }

  get isPreventingTransition () {
    return this._isPreventingTransition;
  }

  set isPreventingTransition (value) {
    if (this._isPreventingTransition === value) return;
    if (value) this.addClass(api.internals.motion.TransitionSelector.NONE);
    else this.removeClass(api.internals.motion.TransitionSelector.NONE);
    this._isPreventingTransition = value === true;
  }

  render () {
    if (this.current === null) return;
    const paneHeight = Math.round(this.current.node.offsetHeight);
    if (this.panelHeight === paneHeight) return;
    this.panelHeight = paneHeight;
    let listHeight = 0;
    if (this.list) listHeight = this.list.node.offsetHeight;
    this.style.setProperty('--tabs-height', (this.panelHeight + listHeight) + 'px');
  }
}

const FOCALIZE_OFFSET = 16;
const SCROLL_OFFSET = 16; // valeur en px du scroll avant laquelle le shadow s'active ou se desactive

class TabsList extends api.core.Instance {
  static get instanceClassName () {
    return 'TabsList';
  }

  init () {
    this.listen('scroll', this.scroll.bind(this));
    this.isResizing = true;
  }

  get group () {
    return this.element.getAscendantInstance('TabsGroup', 'TabsList');
  }

  focalize (btn) {
    const btnRect = btn.getRect();
    const listRect = this.getRect();
    const actualScroll = this.node.scrollLeft;
    if (btnRect.left < listRect.left) this.node.scrollTo(actualScroll - listRect.left + btnRect.left - FOCALIZE_OFFSET, 0);
    else if (btnRect.right > listRect.right) this.node.scrollTo(actualScroll - listRect.right + btnRect.right + FOCALIZE_OFFSET, 0);
  }

  get isScrolling () {
    return this._isScrolling;
  }

  set isScrolling (value) {
    if (this._isScrolling === value) return;
    this._isScrolling = value;
    this.apply();
  }

  apply () {
    if (!this.group) return;
    if (this._isScrolling) {
      this.group.addClass(TabSelector.SHADOW);
      this.scroll();
    } else {
      this.group.removeClass(TabSelector.SHADOW_RIGHT);
      this.group.removeClass(TabSelector.SHADOW_LEFT);
      this.group.removeClass(TabSelector.SHADOW);
    }
  }

  /* ajoute la classe fr-table__shadow-left ou fr-table__shadow-right sur fr-table en fonction d'une valeur de scroll et du sens (right, left) */
  scroll () {
    if (!this.group) return;
    const scrollLeft = this.node.scrollLeft;
    const isMin = scrollLeft <= SCROLL_OFFSET;
    const max = this.node.scrollWidth - this.node.clientWidth - SCROLL_OFFSET;

    const isMax = Math.abs(scrollLeft) >= max;
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
    const minSelector = isRtl ? TabSelector.SHADOW_RIGHT : TabSelector.SHADOW_LEFT;
    const maxSelector = isRtl ? TabSelector.SHADOW_LEFT : TabSelector.SHADOW_RIGHT;

    if (isMin) {
      this.group.removeClass(minSelector);
    } else {
      this.group.addClass(minSelector);
    }

    if (isMax) {
      this.group.removeClass(maxSelector);
    } else {
      this.group.addClass(maxSelector);
    }
  }

  resize () {
    this.isScrolling = this.node.scrollWidth > this.node.clientWidth + SCROLL_OFFSET;
    this.setProperty('--tab-list-height', `${this.getRect().height}px`);
  }

  dispose () {
    this.isScrolling = false;
  }
}

api.tab = {
  TabPanel: TabPanel,
  TabButton: TabButton,
  TabsGroup: TabsGroup,
  TabsList: TabsList,
  TabSelector: TabSelector
};

api.internals.register(api.tab.TabSelector.PANEL, api.tab.TabPanel);
api.internals.register(api.tab.TabSelector.GROUP, api.tab.TabsGroup);
api.internals.register(api.tab.TabSelector.LIST, api.tab.TabsList);
//# sourceMappingURL=tab.module.js.map
