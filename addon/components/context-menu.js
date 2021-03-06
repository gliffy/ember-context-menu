import layout from '../templates/components/context-menu';

import invokeAction from 'ember-invoke-action';

import Component from 'ember-component';
import service   from 'ember-service/inject';
import { htmlSafe } from 'ember-string';
import computed, { reads } from 'ember-computed';
import get from 'ember-metal/get';
import $ from 'jquery';

export default Component.extend({
  layout,

  contextMenu: service('context-menu'),

  isActive:   reads('contextMenu.isActive'),
  renderLeft: reads('contextMenu.renderLeft'),
  renderUp:   reads('contextMenu.renderUp'),
  items:      reads('contextMenu.items'),
  _selection: reads('contextMenu.selection'),
  details:    reads('contextMenu.details'),
  clickEvent: reads('contextMenu.event'),

  selection: computed('_selection.[]', function() {
    return [].concat(get(this, '_selection'));
  }),

  didInsertElement() {
    this._super(...arguments);
    this.setWormholeTarget();
    window.addEventListener('mousedown', this.closeOnClickOutside.bind(this));
  },

  closeOnClickOutside(event) {
    /* quit early on clicks inside context-menu-container */
    /* https://stackoverflow.com/a/36696086/2041765 */
    let container = $('.context-menu-container').get(0);
    let targetInsideContainer = container && container.contains(event.target);
    if (!targetInsideContainer && !this.isDestroyed) {
      get(this, 'contextMenu.deactivate')();
    }
  },

  setWormholeTarget() {
    let id = 'wormhole-context-menu';
    let $target = $(`#${id}`);
    if ($target.length === 0) {
      $('body').append(`<div id="${id}"></div>`);
    }
  },

  position: computed('contextMenu.position.{left,top}', function() {
    let { left, top } = get(this, 'contextMenu.position') || {};
    return htmlSafe(`left: ${left}px; top: ${top}px;`);
  }),

  itemIsDisabled: computed('selection.[]', 'details', function() {
    let selection = get(this, 'selection') || [];
    let details   = get(this, 'details');

    return function(item) {
      let disabled  = get(item, 'disabled');

      if (!get(item, 'action') && !get(item, 'subActions')) {
        return true;
      }

      if (typeof disabled === 'function') {
        return disabled(selection, details);
      }

      return disabled;
    };
  }),

  clickAction: computed('selection.[]', 'details', function() {
    let selection = get(this, 'selection');
    let details   = get(this, 'details');
    let event     = get(this, 'clickEvent');

    return function(item) {
      invokeAction(item, 'action', selection, details, event);
    };
  }),

  actions: {
    deactivate() {
      get(this, 'contextMenu.deactivate')();
    }
  }
});
