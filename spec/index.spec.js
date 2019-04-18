/* eslint-env jasmine */
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const webpack = require('webpack');
const rimraf = require('rimraf');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('../');

const OUTPUT_DIR = path.join(__dirname, '../dist');

const FIXTURES_PATH = path.join(__dirname, './fixtures');

describe('HtmlWebpackIncludeAssetsPlugin', () => {
  beforeEach(done => {
    rimraf(OUTPUT_DIR, done);
  });

  describe('option validation', () => {
    it('should throw an error if no options are provided', done => {
      const theFunction = () => {
        return new HtmlWebpackIncludeAssetsPlugin();
      };

      expect(theFunction).toThrowError(/(options should be an object)/);
      done();
    });

    it('should throw an error if the options are not an object', done => {
      const theFunction = () => {
        return new HtmlWebpackIncludeAssetsPlugin('hello');
      };

      expect(theFunction).toThrowError(/(options should be an object)/);
      done();
    });

    it('should not throw an error if the options is empty', done => {
      const theFunction = () => {
        return new HtmlWebpackIncludeAssetsPlugin({ });
      };

      expect(theFunction).not.toThrowError();
      done();
    });

    const testAssetType = type => {
      it(`should throw an error if the ${type} are not an array or string or object`, done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ [type]: 123 });
        };

        expect(theFunction).toThrowError(new RegExp(`(options.${type} should be a string, object, or array)`));
        done();
      });

      it(`should throw an error if the ${type} contains objects and a boolean`, done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, false, { path: 'b.css' }] });
        };

        expect(theFunction).toThrowError(new RegExp(`(options.${type} items must be an object or string)`));
        done();
      });

      it(`should throw an error if the ${type} contains string and a boolean`, done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ [type]: ['foo.js', true, 'bar.css'] });
        };

        expect(theFunction).toThrowError(new RegExp(`(options.${type} items must be an object or string)`));
        done();
      });

      it(`should not throw an error if the ${type} contains strings and objects`, done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ [type]: ['foo.js', { path: 'file.js' }, 'bar.css'] });
        };

        expect(theFunction).not.toThrowError();
        done();
      });

      describe(`options.${type} path`, () => {
        it(`should throw an error if the ${type} contains an element that is an empty object`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, {}, { path: 'b.css' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object must have a string path property)`));
          done();
        });

        it(`should throw an error if the ${type} contains an element that is an object with a non string path`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 123, type: 'js' }, { path: 'c.css' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object must have a string path property)`));
          done();
        });

        it(`should not throw an error if the ${type} contains elements that are all objects that have a path`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css' }, { path: 'c.js' }] });
          };

          expect(theFunction).not.toThrowError();
          done();
        });
      });

      describe(`options.${type} publicPath`, () => {
        it(`should throw an error if the ${type} contains an element that is an object with publicPath set to string`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', publicPath: 'string' }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object publicPath should be a boolean or function)`));
          done();
        });

        it(`should throw an error if the ${type} contains an element that is an object with publicPath set to object`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', publicPath: {} }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object publicPath should be a boolean or function)`));
          done();
        });

        it(`should throw an error if the ${type} contains an element that is an object with publicPath set to number`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', publicPath: 0 }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object publicPath should be a boolean or function)`));
          done();
        });

        it(`should throw an error if the ${type} contains an element that is an object with publicPath set to array`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', publicPath: [] }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object publicPath should be a boolean or function)`));
          done();
        });

        it(`should not throw an error if the ${type} contains an element that is an object with publicPath set to true`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js', publicPath: true }, { path: 'b.css' }, { path: 'c.js' }] });
          };

          expect(theFunction).not.toThrowError();
          done();
        });

        it(`should not throw an error if the ${type} contains an element that is an object with asset set to false`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js', asset: false }, { path: 'b.css' }, { path: 'c.js' }] });
          };

          expect(theFunction).not.toThrowError();
          done();
        });
      });

      describe(`options.${type} attributes`, () => {
        it(`should throw an error if the ${type} contains an element that is an object with non object string attributes`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', attributes: '' }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have an object attributes property)`));
          done();
        });

        it(`should throw an error if the ${type} contains an element that is an object with array attributes`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', attributes: [] }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have an object attributes property)`));
          done();
        });

        it(`should throw an error if the ${type} contains an element that is an object with number attributes`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', attributes: 0 }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have an object attributes property)`));
          done();
        });

        it(`should throw an error if the ${type} contains an element that is an object with boolean attributes`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', attributes: true }, { path: 'c.js' }] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have an object attributes property)`));
          done();
        });

        it(`should not throw an error if the ${type} contains an element that is an object with empty object attributes`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'a.js' }, { path: 'b.css', attributes: {} }, { path: 'c.js' }] });
          };

          expect(theFunction).not.toThrowError();
          done();
        });

        // TODO
        it('should throw an error if any of the asset options are objects with an attributes property that is not an object', done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'pathWithExtension.js', attributes: 'foobar' }, 'bar.css'] });
          };
          expect(theFunction).toThrowError(/(options\.assets object should have an object attributes property)/);
          done();
        });

        it('should throw an error if any of the asset options are objects with an attributes property with non string or boolean values', done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'pathWithExtension.js', attributes: { crossorigin: 'crossorigin', id: null, enabled: true } }, 'bar.css'] });
          };
          expect(theFunction).toThrowError(/(options\.assets object attribute values should strings, booleans or numbers)/);
          done();
        });

        it('should not throw an error if any of the asset options are objects with an attributes property with string or boolean values', done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'pathWithExtension.js', attributes: { crossorigin: 'crossorigin', id: 'test', enabled: true } }, 'bar.css'] });
          };
          expect(theFunction).not.toThrowError();
          done();
        });

        it('should not throw an error if any of the asset options are objects without an attributes property', done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'pathWithExtension.js' }, 'bar.css'] });
          };
          expect(theFunction).not.toThrowError();
          done();
        });
      });

      describe(`options.${type} glob`, () => {
        it(`should throw an error if any of the ${type} options are objects with a glob property that is not a string`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: ['foo.js', { path: 'a.js', glob: 123, type: 'js' }, 'bar.css'] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have a string glob property)`));
          done();
        });

        it(`should throw an error if any of the ${type} options are objects with glob specified but globPath missing`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: ['foo.js', { path: 'pathWithExtension.js', glob: 'withoutExtensions*' }, 'bar.css'], append: false });
          };
          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have a string globPath property)`));
          done();
        });

        it(`should throw an error if any of the ${type} options are objects with globPath specified but glob missing`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: ['foo.js', { path: 'pathWithExtension.js', globPath: 'withoutExtensions*' }, 'bar.css'], append: false });
          };
          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have a string glob property)`));
          done();
        });

        it(`should throw an error if any of the ${type} options are objects with glob that does not match any files`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: [{ path: 'assets/', globPath: FIXTURES_PATH, glob: 'nonexistant*.js' }, { path: 'assets/', globPath: FIXTURES_PATH, glob: 'nonexistant*.css' }], append: true });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object glob found no files)`));
          done();
        });
      });

      describe(`options.${type} assetPath`, () => {
        it(`should throw an error if any of the ${type} options are objects with an assetPath property that is not a string`, done => {
          const theFunction = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ [type]: ['foo.js', { path: 'a.js', assetPath: 123, type: 'js' }, 'bar.css'] });
          };

          expect(theFunction).toThrowError(new RegExp(`(options.${type} object should have a string assetPath property)`));
          done();
        });
      });
    };

    testAssetType('assets');
    testAssetType('links');
    testAssetType('scripts');

    describe(`options.assets type`, () => {
      it('should throw an error if any of the asset options are objects with an invalid type property', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'baz.js', type: 'foo' }, 'bar.css'], append: false });
        };
        expect(theFunction).toThrowError(/(options\.assets type must be css or js \(foo\))/);
        done();
      });

      it('should throw an error if any of the assets options do not end with .css or .js', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.css', 'bad.txt', 'bar.js'], append: false });
        };
        expect(theFunction).toThrowError(/(options\.assets could not determine asset type for \(bad\.txt\))/);
        done();
      });

      it('should throw an error if any of the asset options are objects without a type property that cannot be inferred from the path', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'pathWithoutExtension' }, 'bar.css'], append: false });
        };
        expect(theFunction).toThrowError(/(options\.assets could not determine asset type for \(pathWithoutExtension\))/);
        done();
      });

      it('should not throw an error if any of the asset options are objects without a type property that can be inferred from the path', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'pathWithExtension.js' }, 'bar.css'], append: false });
        };
        expect(theFunction).not.toThrowError();
        done();
      });

      it('should not throw an error if any of the asset options are objects without a type property that can be inferred from the glob', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', { path: 'pathWithoutExtension', globPath: FIXTURES_PATH, glob: 'glo*.js' }, 'bar.css'], append: false });
        };
        expect(theFunction).not.toThrowError();
        done();
      });
    });

    describe('options.jsExtensions', () => {
      it('should throw an error if the jsExtensions is not an array or string', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: false, jsExtensions: 123 });
        };
        expect(theFunction).toThrowError(/(options\.jsExtensions should be a string or array of strings)/);
        done();
      });

      it('should throw an error if any of the jsExtensions are not a string', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: false, jsExtensions: ['a', 123, 'b'] });
        };
        expect(theFunction).toThrowError(/(options\.jsExtensions array should only contain strings)/);
        done();
      });
    });

    describe('options.cssExtensions', () => {
      it('should throw an error if the cssExtensions is not an array or string', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: false, cssExtensions: 123 });
        };
        expect(theFunction).toThrowError(/(options\.cssExtensions should be a string or array of strings)/);
        done();
      });

      it('should throw an error if any of the cssExtensions are not a string', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: false, cssExtensions: ['a', 123, 'b'] });
        };
        expect(theFunction).toThrowError(/(options\.cssExtensions array should only contain strings)/);
        done();
      });
    });

    describe('options.append', () => {
      it('should not throw an error if the append flag is not provided', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: [] });
        };

        expect(theFunction).not.toThrowError();
        done();
      });

      it('should throw an error if the append flag is not a boolean', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: 'hello' });
        };

        expect(theFunction).toThrowError(/(options.append should be a boolean)/);
        done();
      });
    });

    describe('options.publicPath', () => {
      it('should throw an error if the publicPath flag is not a boolean or string or a function', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ publicPath: 123 });
        };

        expect(theFunction).toThrowError(/(options should specify a publicPath that is either a boolean or a string)/);
        done();
      });
    });

    describe('options.files', () => {
      it('should throw an error if the files option is not a string', done => {
        const nonStringCheck = [123, true, /regex/, {}];

        nonStringCheck.forEach(val => {
          const theCheck = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: true, publicPath: true, files: val });
          };

          expect(theCheck).toThrowError(/(options\.files should be a string or array)/);
        });

        done();
      });

      it('should throw an error if any of the files options are not strings', done => {
        const theFunction = () => {
          return new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', 'bar.css'], append: false, files: ['abc', true, 'def'] });
        };
        expect(theFunction).toThrowError(/(options\.files should be an array of strings)/);
        done();
      });
    });

    describe('options.hash', () => {
      it('should throw an error if the hash option is not a boolean or function', done => {
        const nonBooleanCheck = [123, 'not a boolean', /regex/, [], {}];

        nonBooleanCheck.forEach(val => {
          const theCheck = () => {
            return new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: true, publicPath: true, hash: val });
          };
          expect(theCheck).toThrowError(/(options.hash should be a boolean or a function)/);
        });
        done();
      });
    });
  });

  xdescribe('plugin dependencies', () => {
    it('should throw an error if html-webpack-plugin is not in the webpack config', done => {
      const theError = /(are you sure you have html-webpack-plugin before it in your webpack config's plugins)/;
      const theFunction = () => {
        webpack({
          entry: {
            app: path.join(__dirname, 'fixtures', 'entry.js'),
            style: path.join(__dirname, 'fixtures', 'app.css')
          },
          output: {
            path: OUTPUT_DIR,
            filename: '[name].js'
          },
          module: {
            rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
          },
          plugins: [
            new MiniCssExtractPlugin({ filename: '[name].css' }),
            new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.js', append: true, publicPath: false })
          ]
        }, () => {});
      };
      expect(theFunction).toThrowError(theError);
      done();
    });
  });

  describe('option.append', () => {
    it('should include a single js file and append it', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.js', append: true, publicPath: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(1);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('script[src="foobar.js"]').toString()).toBe('<script type="text/javascript" src="foobar.js"></script>');
          expect($($('script').get(2)).toString()).toBe('<script type="text/javascript" src="foobar.js"></script>');
          done();
        });
      });
    });

    it('should include a single css file and append it', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.css', append: true, publicPath: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="foobar.css"]').toString()).toBe('<link href="foobar.css" rel="stylesheet">');
          expect($($('link').get(1)).toString()).toBe('<link href="foobar.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should include a single js file and prepend it', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.js', append: false, publicPath: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(1);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('script[src="foobar.js"]').toString()).toBe('<script type="text/javascript" src="foobar.js"></script>');
          expect($($('script').get(0)).toString()).toBe('<script type="text/javascript" src="foobar.js"></script>');
          done();
        });
      });
    });

    it('should include a single css file and prepend it', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.css', append: false, publicPath: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="foobar.css"]').toString()).toBe('<link href="foobar.css" rel="stylesheet">');
          expect($($('link').get(0)).toString()).toBe('<link href="foobar.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should support appending and prepending at the same time', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.css', 'foo.js'], append: false, publicPath: false, debug: true }),
          new HtmlWebpackIncludeAssetsPlugin({ assets: ['bar.css', 'bar.js'], append: true, publicPath: false, debug: true })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(4);
          expect($('link').length).toBe(3);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="foo.js"]').toString()).toBe('<script type="text/javascript" src="foo.js"></script>');
          expect($('script[src="bar.js"]').toString()).toBe('<script type="text/javascript" src="bar.js"></script>');
          expect($($('script').get(0)).toString()).toBe('<script type="text/javascript" src="foo.js"></script>');
          expect($($('script').get(3)).toString()).toBe('<script type="text/javascript" src="bar.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="foo.css"]').toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($('link[href="bar.css"]').toString()).toBe('<link href="bar.css" rel="stylesheet">');
          expect($($('link').get(0)).toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($($('link').get(2)).toString()).toBe('<link href="bar.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should include multiple css files and append them in order', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.css', 'bar.css', { path: 'baz.css' }], append: true, publicPath: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(4);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="foo.css"]').toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($('link[href="bar.css"]').toString()).toBe('<link href="bar.css" rel="stylesheet">');
          expect($('link[href="baz.css"]').toString()).toBe('<link href="baz.css" rel="stylesheet">');
          expect($($('link').get(1)).toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($($('link').get(2)).toString()).toBe('<link href="bar.css" rel="stylesheet">');
          expect($($('link').get(3)).toString()).toBe('<link href="baz.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should include multiple css files and prepend them in order', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.css', 'bar.css'], append: false, publicPath: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(3);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="foo.css"]').toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($('link[href="bar.css"]').toString()).toBe('<link href="bar.css" rel="stylesheet">');
          expect($($('link').get(0)).toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($($('link').get(1)).toString()).toBe('<link href="bar.css" rel="stylesheet">');
          done();
        });
      });
    });
  });

  describe('option.files', () => {
    it('should not include if not present in defined files', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({
            files: ['fail.html'],
            assets: 'foobar.js',
            append: true,
            publicPath: false
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(1);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should include if present in defined files', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({
            files: ['*.html'],
            assets: 'foobar.js',
            append: true,
            publicPath: false
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(1);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('script[src="foobar.js"]').toString()).toBe('<script type="text/javascript" src="foobar.js"></script>');
          expect($($('script').get(2)).toString()).toBe('<script type="text/javascript" src="foobar.js"></script>');
          done();
        });
      });
    });
  });

  describe('option.assets', () => {
    it('should not include assets when none are requested', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: [path.join(__dirname, 'fixtures', 'app.css')]
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: true })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(1);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should include a mixture of js and css files', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [
              'foo.js',
              'foo.css',
              { path: 'baz', type: 'css' },
              { path: 'bar.js' },
              'bar.css',
              { path: 'qux', type: 'js' }
            ],
            append: true,
            publicPath: false
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(5);
          expect($('link').length).toBe(4);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('script[src="foo.js"]').toString()).toBe('<script type="text/javascript" src="foo.js"></script>');
          expect($('script[src="bar.js"]').toString()).toBe('<script type="text/javascript" src="bar.js"></script>');
          expect($('script[src="qux"]').toString()).toBe('<script type="text/javascript" src="qux"></script>');
          expect($('link[href="foo.css"]').toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($('link[href="bar.css"]').toString()).toBe('<link href="bar.css" rel="stylesheet">');
          expect($('link[href="baz"]').toString()).toBe('<link href="baz" rel="stylesheet">');
          done();
        });
      });
    });
  });

  describe('option.jsExtensions', () => {
    it('should include all js type files when multiple jsExtensions are specified', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.js', 'foo.jsx'], append: true, jsExtensions: ['.js', '.jsx'] })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(4);
          expect($('link').length).toBe(1);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('script[src="foo.js"]').toString()).toBe('<script type="text/javascript" src="foo.js"></script>');
          expect($('script[src="foo.jsx"]').toString()).toBe('<script type="text/javascript" src="foo.jsx"></script>');
          done();
        });
      });
    });
  });

  describe('option.cssExtensions', () => {
    it('should include all css type files when multiple cssExtensions are specified', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: ['foo.css', 'foo.style'], append: true, cssExtensions: ['.css', '.style'] })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(3);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="foo.css"]').toString()).toBe('<link href="foo.css" rel="stylesheet">');
          expect($('link[href="foo.style"]').toString()).toBe('<link href="foo.style" rel="stylesheet">');
          done();
        });
      });
    });
  });

  describe('option.assets.glob', () => {
    it('should include any files for a glob that does match files', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new CopyWebpackPlugin([{ from: 'spec/fixtures/g*', to: 'assets/', flatten: true }]),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [{ path: 'assets/', globPath: 'spec/fixtures/', glob: 'g*.js' }, { path: 'assets/', globPath: 'spec/fixtures/', glob: 'g*.css' }], append: true })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(2);
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="assets/glob.css"]').toString()).toBe('<link href="assets/glob.css" rel="stylesheet">');
          expect($('script[src="assets/glob.js"]').toString()).toBe('<script type="text/javascript" src="assets/glob.js"></script>');
          done();
        });
      });
    });
  });

  describe('option.assets.attributes', () => {
    it('should add the given attributes to the matching tag', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [{ path: 'assets/abc.js', attributes: { id: 'abc' } }, { path: 'assets/def.css', attributes: { id: 'def', media: 'screen' } }, { path: 'assets/ghi.css' }], append: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(3);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('script[src="assets/abc.js"]').toString()).toBe('<script type="text/javascript" src="assets/abc.js" id="abc"></script>');
          expect($('link[href="assets/def.css"]').toString()).toBe('<link href="assets/def.css" rel="stylesheet" id="def" media="screen">');
          expect($('link[href="assets/ghi.css"]').toString()).toBe('<link href="assets/ghi.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('can match tags with an overridden publicPath and set hash', done => {
      const appendHash = (v, hash) => {
        if (hash.length > 0) hash = '?' + hash;
        return v + hash;
      };

      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          publicPath: 'thePublicPath/',
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({ hash: true }),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [{ path: 'assets/abc.js', attributes: { id: 'abc' } }, { path: 'assets/def.css', attributes: { id: 'def', media: 'screen' } }, { path: 'assets/ghi.css' }], append: false, hash: true })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const hash = result.compilation.hash;
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(3);
          expect($('script[src^="thePublicPath/app.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('thePublicPath/app.js', hash) + '"></script>');
          expect($('script[src^="thePublicPath/style.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('thePublicPath/style.js', hash) + '"></script>');
          expect($('link[href^="thePublicPath/style.css"]').toString()).toBe('<link href="' + appendHash('thePublicPath/style.css', hash) + '" rel="stylesheet">');
          expect($('script[src^="thePublicPath/assets/abc.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('thePublicPath/assets/abc.js', hash) + '" id="abc"></script>');
          expect($('link[href^="thePublicPath/assets/def.css"]').toString()).toBe('<link href="' + appendHash('thePublicPath/assets/def.css', hash) + '" rel="stylesheet" id="def" media="screen">');
          expect($('link[href^="thePublicPath/assets/ghi.css"]').toString()).toBe('<link href="' + appendHash('thePublicPath/assets/ghi.css', hash) + '" rel="stylesheet">');
          done();
        });
      });
    });
  });

  describe('option.assets.assetPath', () => {
    it('should not throw an error when assets assetPath is used and the file exists', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/astyle.css' }], append: false })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="assets/astyle.css"]').toString()).toBe('<link href="assets/astyle.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should throw an error when assets assetPath is used and the file does not exist', done => {
      const theFunction = () => {
        webpack({
          entry: {
            app: path.join(__dirname, 'fixtures', 'entry.js'),
            style: path.join(__dirname, 'fixtures', 'app.css')
          },
          output: {
            path: OUTPUT_DIR,
            filename: '[name].js'
          },
          module: {
            rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
          },
          plugins: [
            new MiniCssExtractPlugin({ filename: '[name].css' }),
            new HtmlWebpackPlugin(),
            new HtmlWebpackIncludeAssetsPlugin({ assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/anotherstyle.css' }], append: false })
          ]
        }, (err, result) => {
          expect(err).toBeFalsy();
          expect(JSON.stringify(result.compilation.errors)).not.toBe('[]');
          done();
        });
      };

      theFunction();
      // expect(theFunction).toThrowError(/(HtmlWebpackPlugin: could not load file)/);
    });
  });

  describe('options.links', () => {
    it('should prepend when the links are all valid and append is set to false', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: false, links: [{ path: 'the-href', attributes: { rel: 'the-rel' } }] })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href" rel="the-rel">');
          done();
        });
      });
    });

    it('should append when the links are all valid and append is set to true', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: true, links: [{ path: 'the-href', attributes: { rel: 'the-rel' } }] })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href" rel="the-rel">');
          done();
        });
      });
    });

    it('should append links and assets together with a custom index.html template when inject is false and append is set to false', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({
            template: path.join(__dirname, 'fixtures', 'index-no-inject.html'),
            inject: false
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: false,
            links: [{ path: 'the-href', attributes: { rel: 'the-rel', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(3);
          expect($('script[src="app.js"]').toString()).toBe('<script src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script src="style.js"></script>');
          expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script" type="text/javascript">');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css">');
          expect($('link[href="assets/astyle.css"]').toString()).toBe('<link href="assets/astyle.css">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href">');
          done();
        });
      });
    });

    it('should append links and assets together with a custom index.html template when inject is false and append is set to true', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({
            template: path.join(__dirname, 'fixtures', 'index-no-inject.html'),
            inject: false
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: true,
            links: [{ path: 'the-href', attributes: { rel: 'the-rel', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(3);
          expect($('script[src="app.js"]').toString()).toBe('<script src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script src="style.js"></script>');
          expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script" type="text/javascript">');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css">');
          expect($('link[href="assets/astyle.css"]').toString()).toBe('<link href="assets/astyle.css">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href">');
          done();
        });
      });
    });

    it('should append links and assets together with a custom index.html template when inject is false and append is set to true and false', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({
            template: path.join(__dirname, 'fixtures', 'index-no-inject.html'),
            inject: false
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle-1.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: true,
            links: [{ path: 'the-href-1', attributes: { rel: 'the-rel-1', sizes: '16x16' } }]
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle-2.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: false,
            links: [{ path: 'the-href-2', attributes: { rel: 'the-rel-2', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(5);
          expect($('script[src="app.js"]').toString()).toBe('<script src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script src="style.js"></script>');
          expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script" type="text/javascript">');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css">');
          expect($('link[href="assets/astyle-1.css"]').toString()).toBe('<link href="assets/astyle-1.css">');
          expect($('link[href="the-href-1"]').toString()).toBe('<link href="the-href-1">');
          expect($('link[href="assets/astyle-2.css"]').toString()).toBe('<link href="assets/astyle-2.css">');
          expect($('link[href="the-href-2"]').toString()).toBe('<link href="the-href-2">');
          done();
        });
      });
    });

    it('should append links and assets together with a custom index.html template when inject is true and append is set to true and false', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({
            template: path.join(__dirname, 'fixtures', 'index.html'),
            inject: true
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle-1.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: true,
            links: [{ path: 'the-href-1', attributes: { rel: 'the-rel-1', sizes: '16x16' } }]
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle-2.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: false,
            links: [{ path: 'the-href-2', attributes: { rel: 'the-rel-2', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(5);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script" type="text/javascript">');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="assets/astyle-1.css"]').toString()).toBe('<link href="assets/astyle-1.css" rel="stylesheet">');
          expect($('link[href="the-href-1"]').toString()).toBe('<link href="the-href-1" rel="the-rel-1" sizes="16x16">');
          expect($('link[href="assets/astyle-2.css"]').toString()).toBe('<link href="assets/astyle-2.css" rel="stylesheet">');
          expect($('link[href="the-href-2"]').toString()).toBe('<link href="the-href-2" rel="the-rel-2" sizes="16x16">');
          done();
        });
      });
    });

    it('should append links and assets together with a custom index.html template when append is set to false', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({
            template: path.join(__dirname, 'fixtures', 'index.html')
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: false,
            links: [{ path: 'the-href', attributes: { rel: 'the-rel', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(3);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script" type="text/javascript">');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="assets/astyle.css"]').toString()).toBe('<link href="assets/astyle.css" rel="stylesheet">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href" rel="the-rel" sizes="16x16">');
          done();
        });
      });
    });

    it('should append links and assets together with a custom index.html template when append is set to true', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({
            template: path.join(__dirname, 'fixtures', 'index.html')
          }),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: true,
            links: [{ path: 'the-href', attributes: { rel: 'the-rel', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(3);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script" type="text/javascript">');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href" rel="the-rel" sizes="16x16">');
          expect($('link[href="assets/astyle.css"]').toString()).toBe('<link href="assets/astyle.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should append links and assets together when append is set to false', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: false,
            links: [{ path: 'the-href', attributes: { rel: 'the-rel', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(3);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href" rel="the-rel" sizes="16x16">');
          expect($('link[href="assets/astyle.css"]').toString()).toBe('<link href="assets/astyle.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should append links and assets together when append is set to true', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [{ path: 'assets/astyle.css', assetPath: 'spec/fixtures/astyle.css' }],
            append: true,
            links: [{ path: 'the-href', attributes: { rel: 'the-rel', sizes: '16x16' } }]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(3);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="the-href"]').toString()).toBe('<link href="the-href" rel="the-rel" sizes="16x16">');
          expect($('link[href="assets/astyle.css"]').toString()).toBe('<link href="assets/astyle.css" rel="stylesheet">');
          done();
        });
      });
    });

    it('should output links attributes other than href', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: [], append: false, links: [{ path: '/the-href', attributes: { rel: 'the-rel', a: 'abc', x: 'xyz' } }] })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src="app.js"]').toString()).toBe('<script type="text/javascript" src="app.js"></script>');
          expect($('script[src="style.js"]').toString()).toBe('<script type="text/javascript" src="style.js"></script>');
          expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
          expect($('link[href="/the-href"]').toString()).toBe('<link href="/the-href" rel="the-rel" a="abc" x="xyz">');
          done();
        });
      });
    });

    it('should output link attributes and inject the publicPath only when link.asset is not false', done => {
      const publicPath = '/pub-path/';

      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          publicPath: publicPath,
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({
            assets: [],
            append: false,
            links: [
              { path: '/the-href', publicPath: false, attributes: { rel: 'the-rel-a', a: 'abc', x: 'xyz' } },
              { path: 'the-href-1', publicPath: true, attributes: { rel: 'the-rel-b', a: '123', x: '789' } },
              { path: 'the-href-2', attributes: { rel: 'the-rel-c', a: '___', x: '---' } }
            ]
          })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(4);
          expect($('script[src="' + publicPath + 'app.js"]').toString()).toBe('<script type="text/javascript" src="' + publicPath + 'app.js"></script>');
          expect($('script[src="' + publicPath + 'style.js"]').toString()).toBe('<script type="text/javascript" src="' + publicPath + 'style.js"></script>');
          expect($('link[href="' + publicPath + 'style.css"]').toString()).toBe('<link href="' + publicPath + 'style.css" rel="stylesheet">');
          expect($('link[href="/the-href"]').toString()).toBe('<link href="/the-href" rel="the-rel-a" a="abc" x="xyz">');
          expect($('link[href="' + publicPath + 'the-href-1"]').toString()).toBe('<link href="' + publicPath + 'the-href-1" rel="the-rel-b" a="123" x="789">');
          expect($('link[href="' + publicPath + 'the-href-2"]').toString()).toBe('<link href="' + publicPath + 'the-href-2" rel="the-rel-c" a="___" x="---">');
          done();
        });
      });
    });
  });

  describe('option.publicPath', () => {
    it('should prefix the publicPath if the publicPath option is set to true', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js',
          publicPath: 'thePublicPath'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.js', append: false, publicPath: true })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(1);
          expect($('script[src="thePublicPath/style.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/style.js"></script>');
          expect($('script[src="thePublicPath/app.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/app.js"></script>');
          expect($('link[href="thePublicPath/style.css"]').toString()).toBe('<link href="thePublicPath/style.css" rel="stylesheet">');
          expect($('script[src="thePublicPath/foobar.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/foobar.js"></script>');
          expect($($('script').get(0)).toString()).toBe('<script type="text/javascript" src="thePublicPath/foobar.js"></script>');
          done();
        });
      });
    });

    it('should not prefix the publicPath if the publicPath option is set to false', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js',
          publicPath: 'thePublicPath'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin(
            { assets: 'local-with-public-path.js', append: false, publicPath: true }
          ),
          new HtmlWebpackIncludeAssetsPlugin(
            { assets: ['local-without-public-path.js', 'http://www.foo.com/foobar.js'], append: false, publicPath: false }
          )
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(5);
          expect($('link').length).toBe(1);
          expect($('script[src="thePublicPath/style.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/style.js"></script>');
          expect($('script[src="thePublicPath/app.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/app.js"></script>');
          expect($('link[href="thePublicPath/style.css"]').toString()).toBe('<link href="thePublicPath/style.css" rel="stylesheet">');
          expect($('script[src="thePublicPath/local-with-public-path.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/local-with-public-path.js"></script>');
          expect($('script[src="local-without-public-path.js"]').toString()).toBe('<script type="text/javascript" src="local-without-public-path.js"></script>');
          expect($('script[src="http://www.foo.com/foobar.js"]').toString()).toBe('<script type="text/javascript" src="http://www.foo.com/foobar.js"></script>');
          expect($($('script').get(2)).toString()).toBe('<script type="text/javascript" src="thePublicPath/local-with-public-path.js"></script>');
          expect($($('script').get(0)).toString()).toBe('<script type="text/javascript" src="local-without-public-path.js"></script>');
          expect($($('script').get(1)).toString()).toBe('<script type="text/javascript" src="http://www.foo.com/foobar.js"></script>');
          done();
        });
      });
    });

    it('should not prefix the publicPath if the publicPath option is set to false and the asset is a protocol-relative path', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js',
          publicPath: 'thePublicPath'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin(
            { assets: 'local-with-public-path.js', append: false, publicPath: true }
          ),
          new HtmlWebpackIncludeAssetsPlugin(
            { assets: ['//www.foo.com/foobar.js'], append: false, publicPath: false }
          )
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(4);
          expect($('link').length).toBe(1);
          expect($('script[src="thePublicPath/style.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/style.js"></script>');
          expect($('script[src="thePublicPath/app.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/app.js"></script>');
          expect($('link[href="thePublicPath/style.css"]').toString()).toBe('<link href="thePublicPath/style.css" rel="stylesheet">');
          expect($('script[src="thePublicPath/local-with-public-path.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/local-with-public-path.js"></script>');
          expect($('script[src="//www.foo.com/foobar.js"]').toString()).toBe('<script type="text/javascript" src="//www.foo.com/foobar.js"></script>');
          expect($($('script').get(1)).toString()).toBe('<script type="text/javascript" src="thePublicPath/local-with-public-path.js"></script>');
          expect($($('script').get(0)).toString()).toBe('<script type="text/javascript" src="//www.foo.com/foobar.js"></script>');
          done();
        });
      });
    });

    it('should prefix the value of the publicPath option if the publicPath option is set to a string', done => {
      webpack({
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js',
          publicPath: 'thePublicPath'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin(),
          new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.js', append: false, publicPath: 'abc/' })
        ]
      }, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(1);
          expect($('script[src="thePublicPath/style.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/style.js"></script>');
          expect($('script[src="thePublicPath/app.js"]').toString()).toBe('<script type="text/javascript" src="thePublicPath/app.js"></script>');
          expect($('link[href="thePublicPath/style.css"]').toString()).toBe('<link href="thePublicPath/style.css" rel="stylesheet">');
          expect($('script[src="abc/foobar.js"]').toString()).toBe('<script type="text/javascript" src="abc/foobar.js"></script>');
          expect($($('script').get(0)).toString()).toBe('<script type="text/javascript" src="abc/foobar.js"></script>');
          done();
        });
      });
    });
  });

  describe('option.hash', () => {
    beforeEach(() => {
      this.hashTestWebpackConfig = {
        entry: {
          app: path.join(__dirname, 'fixtures', 'entry.js'),
          style: path.join(__dirname, 'fixtures', 'app.css')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js',
          publicPath: 'myPublic'
        },
        module: {
          rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }]
        },
        plugins: [
          new MiniCssExtractPlugin({ filename: '[name].css' }),
          new HtmlWebpackPlugin({ hash: true })
        ]
      };
    });

    const appendHash = (v, hash) => {
      if (hash.length > 0) hash = '?' + hash;
      return v + hash;
    };

    it('should not append hash if hash options are not provided', done => {
      this.hashTestWebpackConfig.plugins.push(new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.css', append: false, publicPath: true }));
      webpack(this.hashTestWebpackConfig, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const hash = result.compilation.hash;
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src^="myPublic/style.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('myPublic/style.js', hash) + '"></script>');
          expect($('script[src^="myPublic/app.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('myPublic/app.js', hash) + '"></script>');
          expect($('link[href^="myPublic/style.css"]').toString()).toBe('<link href="' + appendHash('myPublic/style.css', hash) + '" rel="stylesheet">');
          expect($($('link[href^="myPublic/foobar.css"]')).attr('href')).toBe('myPublic/foobar.css');
          done();
        });
      });
    });

    it('should not append hash if hash options are set to false', done => {
      this.hashTestWebpackConfig.plugins.push(new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.css', append: false, publicPath: true, hash: false }));
      webpack(this.hashTestWebpackConfig, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const hash = result.compilation.hash;
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src^="myPublic/style.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('myPublic/style.js', hash) + '"></script>');
          expect($('script[src^="myPublic/app.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('myPublic/app.js', hash) + '"></script>');
          expect($('link[href^="myPublic/style.css"]').toString()).toBe('<link href="' + appendHash('myPublic/style.css', hash) + '" rel="stylesheet">');
          expect($($('link[href^="myPublic/foobar.css"]')).attr('href')).toBe('myPublic/foobar.css');
          done();
        });
      });
    });

    it('should append hash if hash options are set to true', done => {
      this.hashTestWebpackConfig.plugins.push(new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.css', append: false, publicPath: true, hash: true }));
      webpack(this.hashTestWebpackConfig, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const hash = result.compilation.hash;
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src^="myPublic/style.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('myPublic/style.js', hash) + '"></script>');
          expect($('script[src^="myPublic/app.js"]').toString()).toBe('<script type="text/javascript" src="' + appendHash('myPublic/app.js', hash) + '"></script>');
          expect($('link[href^="myPublic/style.css"]').toString()).toBe('<link href="' + appendHash('myPublic/style.css', hash) + '" rel="stylesheet">');
          expect($($('link[href^="myPublic/foobar.css"]')).attr('href')).toBe(appendHash('myPublic/foobar.css', hash));
          done();
        });
      });
    });

    it('should append hash if hash option in this plugin set to true but hash options in HtmlWebpackPlugin config are set to false', done => {
      this.hashTestWebpackConfig.plugins[1] = new HtmlWebpackPlugin({ hash: false });
      this.hashTestWebpackConfig.plugins.push(new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.css', append: false, publicPath: true, hash: true }));
      webpack(this.hashTestWebpackConfig, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const hash = result.compilation.hash;
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src^="myPublic/style.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/style.js"></script>');
          expect($('script[src^="myPublic/app.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/app.js"></script>');
          expect($('link[href^="myPublic/style.css"]').toString()).toBe('<link href="myPublic/style.css" rel="stylesheet">');
          expect($($('link[href^="myPublic/foobar.css"]')).attr('href')).toBe(appendHash('myPublic/foobar.css', hash));
          done();
        });
      });
    });

    it('should not append hash if hash option in this plugin set to false and hash options in HtmlWebpackPlugin config are set to false', done => {
      this.hashTestWebpackConfig.plugins[1] = new HtmlWebpackPlugin({ hash: false });
      this.hashTestWebpackConfig.plugins.push(new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.css', append: false, publicPath: true, hash: false }));
      webpack(this.hashTestWebpackConfig, (err, result) => {
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src^="myPublic/style.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/style.js"></script>');
          expect($('script[src^="myPublic/app.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/app.js"></script>');
          expect($('link[href^="myPublic/style.css"]').toString()).toBe('<link href="myPublic/style.css" rel="stylesheet">');
          expect($($('link[href^="myPublic/foobar.css"]')).attr('href')).toBe('myPublic/foobar.css');
          done();
        });
      });
    });

    it('should replace the hash if a replacer hash function is provided in the plugin options', done => {
      const hashReplacer = (assetName, hash) => {
        return assetName.replace(/\[hash\]/, hash);
      };
      this.hashTestWebpackConfig.plugins[1] = new HtmlWebpackPlugin({ hash: false });
      this.hashTestWebpackConfig.plugins.push(new HtmlWebpackIncludeAssetsPlugin({ assets: 'foobar.[hash].css', append: false, publicPath: true, hash: hashReplacer }));
      webpack(this.hashTestWebpackConfig, (err, result) => {
        const theHash = result.compilation.hash;
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(2);
          expect($('link').length).toBe(2);
          expect($('script[src^="myPublic/style.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/style.js"></script>');
          expect($('script[src^="myPublic/app.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/app.js"></script>');
          expect($('link[href^="myPublic/style.css"]').toString()).toBe('<link href="myPublic/style.css" rel="stylesheet">');
          expect($($('link[href^="myPublic/foobar.' + theHash + '.css"]')).attr('href')).toBe('myPublic/foobar.' + theHash + '.css');
          done();
        });
      });
    });

    it('should inject the hash if an injector hash function is provided in the plugin options', done => {
      const hashInjector = (assetName, hash) => {
        assetName = assetName.replace(/\.js$/, '.' + hash + '.js');
        assetName = assetName.replace(/\.css$/, '.' + hash + '.css');
        return assetName;
      };
      this.hashTestWebpackConfig.plugins = [
        new MiniCssExtractPlugin({ filename: '[name].css' }),
        new CopyWebpackPlugin([{ from: 'spec/fixtures/g*', to: 'assets/', flatten: true }]),
        new HtmlWebpackPlugin(),
        new HtmlWebpackIncludeAssetsPlugin({
          assets: [
            { path: 'assets/', globPath: 'spec/fixtures/', glob: 'g*.js' },
            { path: 'assets/', globPath: 'spec/fixtures/', glob: 'g*.css' }
          ],
          hash: hashInjector,
          append: true
        })
      ];
      webpack(this.hashTestWebpackConfig, (err, result) => {
        const theHash = result.compilation.hash;
        expect(err).toBeFalsy();
        expect(JSON.stringify(result.compilation.errors)).toBe('[]');
        const htmlFile = path.resolve(__dirname, '../dist/index.html');
        fs.readFile(htmlFile, 'utf8', (er, data) => {
          expect(er).toBeFalsy();
          const $ = cheerio.load(data);
          expect($('script').length).toBe(3);
          expect($('link').length).toBe(2);
          expect($('script[src^="myPublic/style.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/style.js"></script>');
          expect($('script[src^="myPublic/app.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/app.js"></script>');
          expect($('link[href^="myPublic/style.css"]').toString()).toBe('<link href="myPublic/style.css" rel="stylesheet">');
          expect($('link[href^="myPublic/assets/glob.' + theHash + '.css"]').toString()).toBe('<link href="myPublic/assets/glob.' + theHash + '.css" rel="stylesheet">');
          expect($('script[src^="myPublic/assets/glob.' + theHash + '.js"]').toString()).toBe('<script type="text/javascript" src="myPublic/assets/glob.' + theHash + '.js"></script>');
          done();
        });
      });
    });
  });
});
