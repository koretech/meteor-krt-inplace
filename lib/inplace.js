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
		// item already has the following members TODO check for them
		// selectTemplate
		// editorTemplate
		// schema
		// method

		// Create a key name based on editorTemplate.viewName
		item.name = item.editorTemplate.viewName.replace('.','');

		// Select Item Events
		item.selectTemplate.events({
			'click .select.item': onSelectItemClick
		});

		// Editor Created && Render function (consumed)
		//if (_(item.editorTemplate.created).isFunction()) {
		//	var createdBackup = item.editorTemplate.created;
		//	item.editorTemplate.created = function() {
		//		createdBackup.call(this);
		//		onEditorCreate.call(this);
		//	}
		//} else {
		//	item.editorTemplate.created = onEditorCreate;
		//}

		if (_(item.editorTemplate.rendered).isFunction()) {
			var renderedBackup = item.editorTemplate.rendered;
			item.editorTemplate.rendered = function() {
				renderedBackup.call(this);
				onEditorRender.call(this);
			}
		} else {
			item.editorTemplate.rendered = onEditorRender;
		}

		// Editor Helper
		item.editorTemplate.helpers({
			validationError: function() {
				//var item = Blaze.currentView._item;
				return (item.schema.namedContext(name).isValid()) ? null : 'error';
			}
		});

		// Editor Events
		item.editorTemplate.events({
			'click .negative.button': closeEditor,
			'click .positive.button': modify,
			'click .ui.delete': remove
		});

		// Add to array TODO get rid of
		self._items[item.name] = item;

		// Store items in templates for easier access
		item.selectTemplate._item = item;
		item.editorTemplate._item = item;

	}); // end each params.items

	function onSelectItemClick(ev, tmpl) {
		// Discover the item element
		var selectItem = tmpl.$('.item');

		var item = tmpl.view.template._item; // retrieve item from template
		if (self.createEditor(item, this, selectItem)) {
			// Hide the selectable item
			selectItem.hide();
		}
	}

	/**
	 *
	 * @param item
	 * @param data
	 * @param selectElement
	 * @returns {boolean} True if an editor was created, otherwise false.
	 */
	self.createEditor = function(item, data, selectElement) {
		if (self._$list.hasClass('editing')) return false; // Don't create an editor if one is already open
		self._$list.addClass('editing');

		// Create the validation context and reset it
		item.schema.namedContext(item.name).resetValidation();

		// Temporarily store the selectElement
		item.selectElement = selectElement;

		// Buid a context that contains the item and any data we pass to it.
		// This is the only way to pass the item to the render method.
		//var context = _.extend({
		//	_item: item
		//}, data);

		// TODO this is potentially faulty if the last item is a .select.item
		// The next element is either the selectElement or the item after the last .select.item
		var nextElement = null;
		if (selectElement) {
			nextElement = selectElement.get(0);
		} else {
			nextElement = self._$list.find('.select.item').last().next().get(0);
		}

		// Render the editor template
		// Store the rendered view in the item but don't assume that this is there during the created() or rendered() methods
		item.view = Blaze.renderWithData(item.editorTemplate, data, self._$list.get(0), nextElement);

		return true;
	};

	/**
	 * When the editor is created, store the item in the current view instead of in the data.
	 */
	//function onEditorCreate() {
	//	console.log(Blaze.currentView);
	//	Blaze.currentView._item = this.data._item;
	//	delete this.data._item;
	//}

	/**
	 *
	*/
	function onEditorRender() {
		// Grab the validation context
		var item = Blaze.currentView.template._item;

		// Add the "editor" class
		this.$('.item').addClass('editor');

		// Discover the form element
		var $form = this.$('form');

		// Render the form error message template for validation
		// Template is parented to the editor view
		Blaze.renderWithData(Template.krtInPlaceFormError, function(){
			var validationContext = item.schema.namedContext(item.name);
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
	function closeEditor(ev, tmpl) {
		ev.preventDefault();

		// Grab the item
		var item = tmpl.view.template._item;

		// Remove the created view item
		Blaze.remove(item.view);

		// Hide the select element if any
		if (item.selectElement) {
			item.selectElement.show();
			delete item.selectElement;
		}

		// Remove the editing class on the list
		self._$list.removeClass('editing');

		// Remove the 'current' variables from the item
		delete item.view;
	}

	/**
	 *
	 * @param ev
	 * @param tmpl
	 */
	function modify(ev, tmpl) {
		ev.preventDefault();

		var item = Blaze.currentView.template._item;

		var data = tmpl.$('form').serializeJSON();
		tmpl.$('.field').removeClass('error');
		Meteor.call(item.method, data, this, item.name, function(err, res){
			if (err) {
				// pop up error
				closeEditor(ev, tmpl);
				return;
			}

			if (!res) {
				tmpl.$('form').addClass('error');
				_(item.schema.namedContext(item.name).invalidKeys()).each(function(key){
					tmpl.$('*[name="'+key.name+'"]').parent('.field').addClass('error');
				});
				return;
			}

			if (res == 'delay') {
				console.log('showing waiting...');
				return;
			}

			closeEditor(ev, tmpl);
		});
	}

	/**
	 *
	 * @param ev
	 * @param tmpl
	 */
	function remove(ev, tmpl) {
		ev.preventDefault();

		if (_(this).isEmpty()) return;

		var item = Blaze.currentView.template._item;
		Meteor.call(item.method, null, this, item.name, function(err, res){
			if (!!res) closeEditor(ev, tmpl);
		});
	}

};

/**
 *
 * @param template
 */
List.prototype.add = function(template) {
	var item = this._items[template.viewName.replace('.','')];
	this.createEditor(item, {});
};

KRT.InPlace.List = List;
