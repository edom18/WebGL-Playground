(function (win, doc, exports) {

    'use strict';

    var gl,
        loading_image_queue = [];

    /**
     * WebGL helper
     *
     * @require util.js
     */
    var WebGLHelper = {

        //const variables.
        VERTEX_SHADER: 0,
        FRAGMENT_SHADER: 1,

        ARRAY_BUFFER: 0,
        ELEMENT_ARRAY_BUFFER: 1,

        //Class method.
        degToRad: function() {
            var factor = Math.PI / 180;
            return function (degrees) {
                return degrees * factor;
            };
        }(),

        radToDeg: function() {
            var factor = 180 / Math.PI;
            return function (rad) {
                return rad * factor;
            };
        }(),

        /**
         * Set parameters to the gl viewport.
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         */
        setViewport: function (x, y, w, h) {
            gl.viewport(x, y, w, h);
        },

        /**
         * Set parameters to the gl clear color.
         * @param {number} r
         * @param {number} g
         * @param {number} b
         * @param {number} a
         */
        setClearColor: function (r, g, b, a) {
            gl.clearColor(r, g, b, a);
        },

        /**
         * Set clear depth.
         * @param {number} depth
         */
        setClearDepth: function (depth) {
            gl.clearDepth(depth);
        },

        /**
         * Set a WebGL context.
         * @param {WebGLContext}
         */
        setGLContext: function (context) {
            gl = context;
        },

        /**
         * Get the current WebGL context.
         * @return {WebGLContext}
         */
        getCurrentContext: function () {
            return gl;
        },

        /**
         * Get shader source from DOM text
         * @param {string} id
         * @return {string} DOM's inner html.
         */
        getShaderSourceFromDOM: function (id) {
            var dom = doc.getElementById(id);

            if (!dom) {
                return null;
            }

            return dom.innerHTML;
        },

        /**
         * Get a WebGL context
         * @param {CanvasElement} canvas
         * @return {WebGLContext}
         */
        getGLContext: function (canvas) {

            var context,
                names = ['webgl', 'experimental-webgl'];

            if (!canvas.getContext) {
                alert('This browser doesn\'t suppoert canvas!');
            }

            for (var i = 0, l = names.length; i < l; i++) {
                try {
                    context = canvas.getContext(names[i]);
                }
                catch (e) {}

                if (context) {
                    break;
                }
            }

            if (!context) {
                alert('This browser doesn\'t suppoert WebGL!');
            }

            WebGLHelper.setGLContext(context);
            return context;
        },

        /**
         * Get attribute locations with program.
         *
         * @param {WebGLProgram} program
         * @param {Array<string>} attribNames
         * @param {Array} dstLocation
         *
         * @return {Array} locations
         */
        getAttribLocations: function (program, attribNames, dstLocation) {
            dstLocation || (dstLocation = []);

            for (var i = 0, l = attribNames.length; i < l; i++) {
                dstLocation[i] = gl.getAttribLocation(program, attribNames[i]);
            }

            return dstLocation;
        },


        /**
         * Get uniform locations with program.
         *
         * @param {WebGLProgram} program
         * @param {Array<string>} uniformNames
         * @param {Array} dstLocation
         *
         * @return {Array} locations
         */
        getUniformLocations: function (program, uniformNames, dstLocation) {
            dstLocation || (dstLocation = []);

            for (var i = 0, l = uniformNames.length; i < l; i++) {
                dstLocation[i] = gl.getUniformLocation(program, uniformNames[i]);
            }
        },

        /**
         * Load a shader.
         *
         * @param {string} type
         * @param {string} url
         *
         * @return {Deffered}
         */
        loadShader: function (type, url, callback) {
            var def = new util.Deferred();
            var shaderType = (type === 'vertex') ? this.VERTEX_SHADER : this.FRAGMENT_SHADER;

            util.ajax(url).done(util.bind(function (source) {
                def.resolve(this.createShader(shaderType, source))
            }, this));

            return def;
        },

        /**
         * Create a shader with a source.
         * @param {WebGLContext} gl
         * @param {string} type shader type
         * @param {string} source shader source
         * @return {WebGLShader}
         */
        createShader: function (type, source) {

            var shader;

            if (type === this.VERTEX_SHADER) {
                shader = gl.createShader(gl.VERTEX_SHADER);
            }
            else if (type === this.FRAGMENT_SHADER) {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            }

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        },

        /**
         * Create a program with vertex shader and fragment shader.
         * @param {WebGLContext} gl
         * @param {WebGLShader} vertex_shader
         * @param {WebGLShader} fragment_shader
         * @return {WebGLProgram}
         */
        createProgram: function (vertex_shader, fragment_shader) {
            var program = gl.createProgram();
            gl.attachShader(program, vertex_shader);
            gl.attachShader(program, fragment_shader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                alert(gl.getProgramInfoLog(program));
                return null;
            }

            gl.useProgram(program);

            return program;
        },

        /**
         * Create a buffer.
         * @param {string} type
         * @param {Float32Array} data
         */
        createBuffer: function (type, data) {
            var buffer = gl.createBuffer();

            if (type === this.ARRAY_BUFFER) {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }
            else if (type === this.ELEMENT_ARRAY_BUFFER) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }

            return buffer;
        },

        /**
         * Create a VBO
         *
         * @param {Float32Array} data
         * 
         * @return {WebGLBuffer}
         */
        createVBO: function (data) {
            return this.createBuffer(this.ARRAY_BUFFER, data);
        },

        /**
         * Create a IBO
         *
         * @param {Float32Array} data
         * 
         * @return {WebGLBuffer}
         */
        createIBO: function (data) {
            return this.createBuffer(this.ELEMENT_ARRAY_BUFFER, data);
        },

        /**
         * Set up frame buffer for off screen rendering.
         * @param {number} width
         * @param {number} height
         * @return {Object}
         */
        setupFrameBuffer: function (width, height) {

            //フレームバッファの生成
            var framebuffer = gl.createFramebuffer();

            //フレームバッファをWebGLにバインド
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

            //深度バッファ用レンダーバッファを生成とバインド
            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

            //レンダーバッファを深度バッファとして設定
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

            //フレームバッファにデプスバッファをアタッチ
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

            //フレームバッファ用テクスチャの生成とバインド
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            //[Interface]
            //void texImage2D(GLenum target, GLint level, GLenum internalformat,
            //  GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, ArrayBufferView? pixels);
            //フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            //テクスチャパラメータ
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            //フレームバッファにテクスチャをアタッチ
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            //各種オブジェクトのバインドを解除
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return {
                framebuffer: framebuffer,
                renderbuffer: renderbuffer,
                texture: texture
            };
        },


        /**
         * Set up a buffer.
         * @param {Object} args
         */
        setupBuffer: function (args) {
            var buffer = args.buffer,
                index  = args.index,
                size   = args.size,
                stride = args.stride || 0,
                offset = args.offset || 0;

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(index);
            gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset);
        },


        /**
         * Set up an index buffer.
         */
        setupIndex: function (indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        },

        /**
         * Set up attributes.
         *
         * @param {Array<WebGLBuffer>} vbos
         * @param {Array<number>} attributes
         * @param {Array<number>} strides
         */
        setupAttributes: function (vbos, attributes, strides) {
            for (var i = 0, l = vbos.length; i < l; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, vbos[i]);
                gl.enableVertexAttribArray(attributes[i]);
                gl.vertexAttribPointer(attributes[i], strides[i], gl.FLOAT, false, 0, 0);
            }
        },

        /**
         * Create a texture object.
         *
         * @param {string} url
         * @param {Function} callback
         *
         * @return {WebGLTexture}
         */
        setupTexture: function (url, callback) {

            var img     = new Image(),
                texture = gl.createTexture();

            loading_image_queue.push(img);

            img.onload = function () {
                loading_image_queue.splice(loading_image_queue.indexOf(img), 1);

                gl.bindTexture(gl.TEXTURE_2D, texture);

                //[Interface]
                //void texImage2D(GLenum target, GLint level, GLenum internalformat,
                //  GLenum format, GLenum type, ImageData? pixels);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);

                callback && callback(texture);
                texture = null;
            };
            img.src = url;

            return texture;
        },

        /**
         * Create a material with shader.
         * @param {Object} args
         * @return {Object}
         */
        setupProgram: function (args) {

            if (!util.isObject(args)) {
                throw new Error('An argument must be like Object.'); 
            }

            var vs;
            if (util.isString(args.vertexShader)) {
                vs  = this.createShader(this.VERTEX_SHADER, args.vertexShader);
            }
            else {
                vs = args.vertexShader;
            }

            var fs;
            if (util.isString(args.fragmentShader)) {
                fs  = this.createShader(this.FRAGMENT_SHADER, args.fragmentShader);
            }
            else {
                fs = args.fragmentShader;
            }

            return this.createProgram(vs, fs);
        }
    };

    WebGLHelper.$ = WebGLHelper.getShaderSourceFromDOM;

    var requestAnimFrame = win.requestAnimationFrame || win.mozRequestAnimationFrame || win.msRequestAnimationFrame ||
                           function (func) {
                               return setTimeout(func, 16);
                           };

    var cancelAnimFrame = win.cancelAnimationFrame || win.mozCancelAnimationFrame || win.msCancelAnimationFrame ||
                          function (id) {
                              clearTimeout(id);
                          };

    /*! -----------------------------------------------------------------
        EXPORTS.
    --------------------------------------------------------------------- */
    exports.requestAnimFrame = requestAnimFrame;
    exports.cancelAnimFrame  = cancelAnimFrame;
    exports.WebGLHelper      = exports.$gl = WebGLHelper;

}(window, document, window));
