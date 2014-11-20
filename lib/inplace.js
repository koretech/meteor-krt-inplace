/* TODO
 *  add/remove items
 *  saving
 *  consume rendered functions
 */

/**
 * Params
 *   template - Template of list. Must contain a ".ui.list" element. Must be already displayed.
 *   items - Array of editable item definitions of different types
 *     selectTemplate - Template of one type of selectable items. Must have a ".select.item" element. Must be already displayed.
 *     editorTemplate - Template of item editor. Must have a ".item" element. Instances will be created as needed.
 *     schema - SimpleSchema of item. Used for data cleaning and validation.
 *     method - A meteor method that will update/insert/delete. Params are (data, before).
 * @param params
 * @returns {*}
 * @constructor
 */
List = function(params) {
	if (!(this instanceof List)) return new List(params);

	var self = this;

	// Don't initiate InPlace List if no template is given
	this._template = params.template;
	if (!this._template) return {};

	// TODO consume the rendered function
	// Add the "inplace" class to the list when first rendered
	this._template.rendered = function() {
		self._$list = this.$('.ui.list');
		self._$list.addClass('inplace');
	};

	self._items = {};

	// Process each item given
	_(params.items || []).each(function(item){
		var selectName = item.selectTemplate.viewName;
		var editorName = item.editorTemplate.viewName;

		item.selectName = selectName;
		item.editorName = editorName;

		// key
		// selectTemplate
		// editorTemplate
		// schema
		// method
		self._items[selectName] = item;
		self._items[editorName] = item;

		// Select Item Events
		item.selectTemplate.events({
			'click .select.item': onSelectItemClick
		});

		// Editor Render function
		item.editorTemplate.created = onEditorCreate;
		item.editorTemplate.rendered = onEditorRender;

		// Editor Helper
		item.editorTemplate.helpers({
			validationError: function() {
				return (Blaze.currentView._item.validationContext.isValid()) ? null : 'error';
			}
		});

		// Editor Events
		item.editorTemplate.events({
			'click .negative.button': closeEditor,
			'click .positive.button': modify,
			'click .ui.delete': remove
		});

	}); // end each params.items

	function onSelectItemClick(ev, tmpl) {
		// Discover the item element
		var selectItem = tmpl.$('.item');

		if (self.createEditor(self._items[tmpl.view.name], this, selectItem)) {
			// Hide the selectable item
			selectItem.hide();
		}
	}

	/**
	 *
	 * @param item
	 * @param data
	 * @param selectElement
	 * @returns {boolean}
	 */
	self.createEditor = function(item, data, selectElement) {
		if (self._$list.hasClass('editing')) return false; // Don't create an editor if one is already open
		self._$list.addClass('editing');

		// Create the validation context
		item.validationContext = (item.schema) ? item.schema.namedContext(item.editorName) : null;
		if (item.validationContext) item.validationContext.resetValidation();

		item.selectElement = selectElement;

		var context = _.extend({
			_item: item
		}, data);

		var nextElement = null;
		if (selectElement) {
			nextElement = selectElement.get(0);
		} else {
			nextElement = self._$list.find('.select.item').last().next().get(0);
		}

		// Render the editor template
		item.view = Blaze.renderWithData(item.editorTemplate, context, self._$list.get(0), nextElement);

		return true;
	};

	/**
	 *
	 */
	function onEditorCreate() {
		Blaze.currentView._item = this.data._item;
		delete this.data._item;
	}

	/**
	 *
	 */
	function onEditorRender() {
		// Grab the validation context
		var validationContext = Blaze.currentView._item.validationContext;

		// Add the "editor" class
		this.$('.item').addClass('editor');

		// Discover the form element
		var $form = this.$('form');

		// Render the form error message template for validation
		// Template is parented to the editor view
		Blaze.renderWithData(Template.krtInPlaceFormError, function(){
			if (!validationContext) return null;
			// Reactive data returns the validation context error messages
			return {
				messages: _(validationContext.invalidKeys()).map(function(key){
					return validationContext.keyErrorMessage(key.name);
				})
			};
		}, $form.get(0), $form.children().get(0), this.view);

		// Focus the form
		this.$('form:not(.filter) :input:visible:enabled:first').focus();
	}

	/**
	 *
	 * @param ev
	 */
	function closeEditor(ev) {
		ev.preventDefault();

		// Grab the item
		var item = Blaze.currentView._item;

		// Remove the created view item
		Blaze.remove(item.view);

		// Hide the select element if any
		if (item.selectElement) {
			item.selectElement.show();
			delete item.selectElement;
		}

		// Remove the editing class
		self._$list.removeClass('editing');

		// Remove the 'current' variables from the item
		delete item.view;
		delete item.validationContext;
	}

	/**
	 *
	 * @param ev
	 * @param tmpl
	 */
	function modify(ev, tmpl) {
		ev.preventDefault();

		// Grab the item and make sure it has a schema and validationContext
		var item = Blaze.currentView._item;
		if (!item.schema || !item.validationContext) return;

		// Grab the form data & clean it
		var data = tmpl.$('form').serializeJSON();
		item.schema.clean(data);

		// Remove any error classes on any fields
		tmpl.$('.field').removeClass('error');

		// Validate the data
		var validated = item.validationContext.validate(data);
		if (validated) {

			// Save and close the editor
			Meteor.call(item.method, data, this);
			closeEditor(ev);

		} else {

			// Add error classes to invalid fields
			_(item.validationContext.invalidKeys()).each(function(key){
				tmpl.$('*[name="'+key.name+'"]').parent('.field').addClass('error');
			});

		}
	}

	function remove(ev, tmpl) {
		ev.preventDefault();

		var item = Blaze.currentView._item;
		Meteor.call(item.method, null, this);
		closeEditor(ev);
	}

};

/**
 *
 * @param template
 */
List.prototype.add = function(template) {
	var item = this._items[template.viewName];
	this.createEditor(item, {});

};

KRT.InPlace.List = List;
