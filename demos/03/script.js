(function () {
    'use strict';
        
    var program = null;
    var size = 465;

    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    c.width  = size;
    c.height = size;
    
    // webglコンテキストを取得
    var gl = $gl.getGLContext(c);

    // Shderをロード
    util.when([
        $gl.loadShader('vertex', 'shader/vertex.shader'),
        $gl.loadShader('fragment', 'shader/fragment2.shader')
    ]).done(function (shaders) {
        program = $gl.setupProgram({
            vertexShader: shaders[0],
            fragmentShader: shaders[1]
        });
        run();
    });

    /**
     * Render object class.
     *
     * @param {WebGLProgram} program
     * @param {Model} model it has position, normal, color, texCoord, index.
     * @param {Array<string>} attributes
     * @param {Array<number>} stride
     * @param {Array<string>} uniforms
     */
    function RenderObject(program, model, attributes, stride, uniforms) {
        // for attributes.
        this.VBOs = [];
        this.attrLocations = [];
        for (var i = 0; i < attributes.length; i++) {
            var attr = attributes[i];
            this.VBOs[i] = $gl.createVBO(model[attr]);
            this.attrLocations[i] = gl.getAttribLocation(program, attr);
        }
        this.index  = $gl.createIBO(model.index);
        this.length = model.index.length;
        this.stride = stride;

        // for uniforms.
        this.uniLocations = {};
        for (i = 0; i < uniforms.length; i++) {
            var uniformName = uniforms[i];
            this.uniLocations[uniformName] = gl.getUniformLocation(program, uniformName);
        }
    }

    /**
     * Set render object.
     *
     * @param {RenderObject} obj
     */
    function setRenderObject(obj) {
        $gl.setupAttributes(obj.VBOs, obj.attrLocations, obj.stride);
        $gl.setupIndex(obj.index);
    }

    /**
     * コードの実行
     */
    var mouse = [0, 0];
    function run() {
        document.addEventListener('mousemove', function (e) {
            mouse[0] = e.pageX > size ? 1 : e.pageX / size;
            mouse[1] = e.pageY > size ? 1 : e.pageY / size;
        }, false);

        /////////////////////////////////////////////////////////////////////////////////

        // 深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        /////////////////////////////////////////////////////////////////////////////////

        var attributes = [
            'position',
        ];
            var stride = [3];
        var uniforms = [
            'time',
            'mouse',
            'resolution',
        ];
            
        var plane = {
            position: [
                -1.0,  1.0,  0.0,
                 1.0,  1.0,  0.0,
                -1.0, -1.0,  0.0,
                 1.0, -1.0,  0.0
            ],
            index   : [
                0, 2, 1,
                1, 2, 3
            ],
        };
            
        var renderPlane  = new RenderObject(program, plane,  attributes, stride, uniforms);

        // カウンタの宣言
        var count = 0;
        var startTime = +new Date();
        var resolution = [size, size];
        (function loop() {

            count += 0.5;
            var angle = (count % 360);
            var currentRnederObj;
            var time = (+new Date() - startTime) * 0.001;

            ////////////////////////////////////////////////////////////////

            // for rendering screen.
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            setRenderObject(renderPlane);

            // uniform変数の登録と描画
            gl.uniform1f(renderPlane.uniLocations.time, time);
            gl.uniform2fv(renderPlane.uniLocations.mouse, mouse);
            gl.uniform2fv(renderPlane.uniLocations.resolution, resolution);
            gl.drawElements(gl.TRIANGLES, renderPlane.length, gl.UNSIGNED_SHORT, 0);

            // コンテキストの再描画
            gl.flush();

            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
}());
