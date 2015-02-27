/**
 * Updates an array field
 * @param p
 * @return True if success, otherwise validation context error keys
 */
function collArrayUpdate(p) {
	var q = {},	m = {};
	if (_(p.data).isEmpty()) { // Delete
		m['$pull'] = {};
		m['$pull'][p.field] = p.before;
	} else {
		p.schema.clean(p.data);
		var validationContext = p.schema.namedContext(p.validationContextName);
		if (!validationContext.validate(p.data)) {
			return validationContext.invalidKeys();
		}

		if (_(p.before).isEmpty()) { // Insert
			m['$push'] = {};
			m['$push'][p.field] = p.data;
		} else { // Modify
			q[p.field] = { $elemMatch: p.before };
			var posField = p.field+'.$';
			m['$set'] = {};
			m['$set'][posField] = p.data;
		}
	}
	if (p.debug) {
		console.log(p.query, q, m);
	} else {
		p.collection.update(_.extend(p.query, q), m);
	}
	return true;
}

/**
 * Updates a single value field
 * @param p
 * @return True if success, otherwise validation context error keys
 */
function collValueUpdate(p) {
	p.schema.clean(p.data);
	var validationContext = p.schema.namedContext(p.validationContextName);
	if (!validationContext.validate(p.data)) {
		return validationContext.invalidKeys();
	}

	// Extend key with field
	if (p.field) {
		_.chain(p.data).keys().each(function(k){
			var nk = p.field + '.' + k;
			p.data[nk] = p.data[k];
			delete p.data[k];
		});
	}
	if (p.debug) {
		console.log(p.query, {$set: p.data});
	} else {
		p.collection.update(p.query, {$set: p.data});
	}
	return true;
}

// TODO putting this here for now
KRT.InPlace.Util = {};
KRT.InPlace.Util.collArrayUpdate = collArrayUpdate;
KRT.InPlace.Util.collValueUpdate = collValueUpdate;
