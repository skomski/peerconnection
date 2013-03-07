module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      options: {
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        forin: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        noempty: true,
        nonew: true,
        quotmark: 'single',
        regexp: true,
        undef: true,
        unused: true,
        strict: true,
        trailing: true,
        maxlen: 80,
        browser: true,
        globalstrict: true,
        globals: {
          require: true,
          module: true
        }
      },
      with_overrides: {
        options: {
          nonew: false,
          globals: {
            describe: true,
            expect: true,
            it: true,
            module: true,
            process: true,
            waits: true,
            runs: true,
            require: true,
            afterEach: true,
            beforeEach: true,
            jasmine: true,
            waitsFor: true
          }
        },
        files: {
          src: ['test/*.js']
        },
      },
      uses_defaults: ['index.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint']);
};
