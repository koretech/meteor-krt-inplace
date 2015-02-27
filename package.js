var client = 'client', server = 'server', both = ['client', 'server'];

Package.describe({
	name: 'krt:inplace',
	summary: 'Koretech Inplace Editor Package',
	version: '0.1.2',
	git: 'https://github.com/koretech/meteor-krt-inplace.git',
	documentation: null
});

Package.onUse(function(api){

	api.versionsFrom('METEOR@1.0');

	api.use([
		'krt:core@0.1.2',
		'templating',
		'underscore',
		'less',
		'ejson',
		'nooitaf:semantic-ui@1.9.1',
		'mquandalle:bower@1.3.12_2',
		'aldeed:simple-schema@1.3.0'
	], both);

	api.imply([
		'krt:core',
		'nooitaf:semantic-ui@1.9.1'
	]);

	api.addFiles([
		'namespaces.js',
		'lib/util.js'
	], both);

	api.addFiles([
		'bower.json',
		'lib/inplace.js',
		'lib/inplace.less',
		'lib/inplace.html'
	], client);

});
