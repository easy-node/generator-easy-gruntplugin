'use strict';

var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var npmName = require('npm-name');

var GruntpluginGenerator = module.exports = function GruntpluginGenerator(args, options) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({
      bower: false,
      skipInstall: options['skip-install']
    });
  });

  this.pkg = require(path.join(__dirname, '../package.json'));
};
util.inherits(GruntpluginGenerator, yeoman.generators.NamedBase);

GruntpluginGenerator.prototype.askFor = function askFor() {
  var cb = this.async();
  var log = this.log;

  console.log(
    this.yeoman +
    '\nFor more information about Grunt plugin best practices,' +
    '\nplease see the docs at http://gruntjs.com/creating-plugins');

  var prompts = [{
    name: 'name',
    message: 'Plugin Name',
    filter: function (value) {
      var done = this.async();
      var contribRegex = /^grunt-contrib/;

      if (contribRegex.test(value)) {
        log.error(
          'Removing "contrib" from your project\'s name. The grunt-contrib' +
          '\nnamespace would like to be reserved for tasks maintained by the grunt team.'
        );
        value = value.replace(contribRegex, 'grunt');
      }

      npmName(value, function (err, available) {
        if (!available) {
          log.info(chalk.yellow(value) + ' already exists on npm. You might want to use another name.');
        }

        done(value);
      });
    }
  }, {
    name: 'description',
    message: 'Description',
    default: 'The best Grunt plugin ever.'
  }, {
    name: 'version',
    message: 'Version',
    default: '0.0.1'
  }, {
    name: 'repository',
    message: 'Project git repository'
  }, {
    name: 'homepage',
    message: 'Project homepage'
  }, {
    name: 'license',
    message: 'License',
    default: 'MIT'
  }, {
    name: 'authorName',
    message: 'Author name'
  }, {
    name: 'authorEmail',
    message: 'Author email'
  }, {
    name: 'authorUrl',
    message: 'Author url'
  }];

  this.currentYear = (new Date()).getFullYear();

  this.prompt(prompts, function (props) {
    this.slugname = this._.slugify(props.name);

    this.shortName = props.name.replace(/^grunt[\-_]?/, '').replace(/[\W_]+/g, '_').replace(/^(\d)/, '_$1');
    this.authorOriginalName = props.authorName;
    this.authorName = props.authorName.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');

    if (!props.homepage) {
      props.homepage = this.repoUrl;
    }

    this.props = props;

    cb();
  }.bind(this));
};

GruntpluginGenerator.prototype.tasks = function tasks() {
  this.template('name.js', this.shortName + '.js');
};

GruntpluginGenerator.prototype.test = function test() {
  this.directory('test/expected');
  this.directory('test/fixtures');
  this.template('name_test.js', this.shortName + '_test.js');
};

GruntpluginGenerator.prototype.projectfiles = function projectfiles() {
  this.copy('jshintrc', '.jshintrc');
  this.copy('gitignore', '.gitignore');
  this.copy('editorconfig', '.editorconfig');

  this.template('_README.md', 'README.md');
  this.template('_Gruntfile.js', 'Gruntfile.js');

  this.template('_bower.json', 'bower.json');
  this.template('_component.json', 'component.json');
};

GruntpluginGenerator.prototype.packageFile = function packageFile() {
  var pkgFile = {
    name: this.slugname,
    version: this.props.version,
    description: this.props.description,
    homepage: this.props.homepage,
    repository: this.props.repository,
    author: {
      name: this.authorOriginalName,
      email: this.props.authorEmail,
      url: this.authorUrl
    },
    keywords: [
      'gruntplugin',
      this.slugname
    ],
    main: 'Gruntfile.js',
    engines: {
      node: '~0.11.13'
    },
    licenses: this.props.license,
    devDependencies: {
      'grunt-contrib-clean': '~0.5.0',
      'grunt-contrib-jshint': '~0.8.0',
      'grunt-contrib-nodeunit': '~0.3.0',
      'grunt': '~0.4.4',
      'jshint-stylish': '~0.1.5',
      'load-grunt-tasks': '~0.3.0'
    },
    scripts: {
      test: 'grunt test'
    }
  };

  if (this.props.authorUrl) {
    pkgFile.author.url = this.props.authorUrl;
  }

  this.writeFileFromString(JSON.stringify(pkgFile, null, 2), 'package.json');
};
