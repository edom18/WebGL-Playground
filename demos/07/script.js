(function () {
    'use strict';
        
    var programs = [];
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
        $gl.loadShader('fragment', 'shader/fragment.shader'),
    ]).done(function (shaders) {
        for (var i = 0, l = shaders.length; i < l; i += 2) {
            programs.push($gl.setupProgram({
                vertexShader  : shaders[i + 0],
                fragmentShader: shaders[i + 1]
            }));
        }
        run();
    });

    /**
     * コードの実行
     */
    function run() {
        /////////////////////////////////////////////////////////////////////////////////
        // 深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // 頂点テクスチャフェッチが可能か確認する
        var units = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
        if (units > 0) {
            console.log('max_vertex_texture_image_units: ', units);
        }
        else {
            alert('VTF not supported.');
            return;
        }


        /////////////////////////////////////////////////////////////////////////////////
        // モデルデータ
        var sphere = new Sphere(15, 15, 1.0, [1, 0, 0, 1]);
        var color_data = new Uint8Array([
            255,   0,   0,  255,
              0, 255,   0,  255,
              0,   0, 255,  255,
            100, 100, 100,  255,
        ]);

        var color_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, color_texture);
        gl.texImage2D(gl.TEXTURE_2D,
                      0,
                      gl.RGBA,
                      2, 2,
                      0,
                      gl.RGBA,
                      gl.UNSIGNED_BYTE,
                      color_data)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        ///////////////////////////////////////////////////////////////

        var position_data = new Uint8Array([
            255,   0,   0, 255,
              0, 255,   0, 255,
              0,   0, 255, 255,
            255, 255, 255, 255,
        ]);
        var position_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, position_texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,
                      0,
                      gl.RGBA,
                      2, 2,
                      0,
                      gl.RGBA,
                      gl.UNSIGNED_BYTE,
                      position_data);
        gl.bindTexture(gl.TEXTURE_2D, null);


        /////////////////////////////////////////////////////////////////////////////////
        // 通常レンダリングのセットアップ
        var attributes = [
            'position',
            'normal',
            'textureCoord',
        ];
        var strides = [3, 3, 2];
        var uniforms = [
            'MATRIX_MVP',
            'MATRIX_INV_M',
            'color_texture',
            'position_texture',
        ];
        var renderSphere = new $gl.utility.RenderObject(programs[0], sphere, attributes, strides, uniforms);


        /////////////////////////////////////////////////////////////////////////////////
        // カウンタの宣言
        var count = 0;
        var startTime = +new Date();
        var resolution = [size, size];
        var axis = vec3(1, 0, 0);

        var cameraPos  = vec3(0, 0, -5);
        var MATRIX_M   = mat4();
        var MATRIX_INV_M = mat4();
        var MATRIX_V   = mat4.lookAt(cameraPos, vec3.zero, vec3.up);
        var MATRIX_P   = mat4.perspective(60, c.width / c.height, 0.1, 1000);
        var MATRIX_MVP = mat4();
        (function loop() {

            count += 0.3;
            var angle = (count % 360);
            var time = (+new Date() - startTime) * 0.001;

            gl.useProgram(programs[0]);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, color_texture);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, position_texture);

            mat4.identity(MATRIX_M);
            mat4.rotate(MATRIX_M, angle, axis, MATRIX_M);
            mat4.inverse(MATRIX_M, MATRIX_INV_M);
            mat4.multiply(MATRIX_P,   MATRIX_V, MATRIX_MVP);
            mat4.multiply(MATRIX_MVP, MATRIX_M, MATRIX_MVP);

            ////////////////////////////////////////////////////////////////

            // for rendering screen.
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var currentObject = renderSphere;
            $gl.utility.setRenderObject(currentObject);

            // uniform変数の登録と描画
            gl.uniform1i(currentObject.uniLocations.color_texture, 0);
            gl.uniform1i(currentObject.uniLocations.position_texture, 1);
            gl.uniformMatrix4fv(currentObject.uniLocations.MATRIX_MVP, false, MATRIX_MVP);
            gl.uniformMatrix4fv(currentObject.uniLocations.MATRIX_INV_M, false, MATRIX_INV_M);
            gl.drawElements(gl.TRIANGLES, currentObject.length, gl.UNSIGNED_SHORT, 0);

            // コンテキストの再描画
            gl.flush();

            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
}());
