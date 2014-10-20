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
        $gl.loadShader('vertex', 'shader/vtf_vertex.shader'),
        $gl.loadShader('fragment', 'shader/vtf_fragment.shader'),
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

        var attributes = [
            'position',
            'color',
            'normal',
            'textureCoord',
        ];
        var stride = [3, 4, 3, 2];
        var uniforms = [
            'time',
            'mouse',
            'resolution',
            'MATRIX_MVP',
            'MATRIX_INV_M',
            'texture',
        ];

        var sphere = new Sphere(15, 15, 1.0, [1, 0, 0, 1]);
        var torus  = new Torus(32, 32, 1.0, 2.0, [1, 1, 1, 1]);
        var plane  = new Plane(2, 2, 2, 2, [1, 1, 1, 1]);

        var renderPlane  = new $gl.utility.RenderObject(programs[1], plane, attributes, stride, uniforms);
        var renderSphere = new $gl.utility.RenderObject(programs[1], sphere, attributes, stride, uniforms);

        /////////////////////////////////////////////////////////////////////////////////

        var vtf_attributes = [
            'position',
            'index'
        ];
        var vtf_stride = [3, 1];
        var vtf_uniforms = [
            //
        ];
        var vtfSphere  = new $gl.utility.RenderObject(programs[0], sphere, vtf_attributes, vtf_stride, vtf_uniforms);
        var vtfPlane   = new $gl.utility.RenderObject(programs[0], plane, vtf_attributes, vtf_stride, vtf_uniforms);

        var position = sphere.position;
        var indices  = [];
        for (var i = 0, l = position.length / 3; i < l; i++) {
            indices[i] = i;
        }

        var vtf_pos_vbo = $gl.createVBO(position);
        var vtf_idx_vbo = $gl.createVBO(indices);

        // オフスクリーン用バッファの準備
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 16, 16);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        // Bind texture.
        var vtf_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, vtf_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, vtf_texture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        /////////////////////////////////////////////////////////////////////////////////

        // カウンタの宣言
        var count = 0;
        var startTime = +new Date();
        var resolution = [size, size];
        var axis = vec3(1, 0, 0);

        var cameraPos  = vec3(0, 0, -10);
        var MATRIX_M   = mat4();
        var MATRIX_INV_M = mat4();
        var MATRIX_V   = mat4.lookAt(cameraPos, vec3.zero, vec3.up);
        var MATRIX_P   = mat4.perspective(60, c.width / c.height, 0.1, 1000);
        var MATRIX_MVP = mat4();

        (function loop() {

            count += 0.3;
            var angle = (count % 360);
            var currentRnederObj;
            var time = (+new Date() - startTime) * 0.001;


            // Pass1
            {
                gl.viewport(0, 0, 16, 16);
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.useProgram(programs[0]);

                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

                gl.bindBuffer(gl.ARRAY_BUFFER, vtf_pos_vbo);
                gl.enableVertexAttribArray(vtfSphere.attrLocations[0]);
                gl.vertexAttribPointer(vtfSphere.attrLocations[0], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, vtf_idx_vbo);
                gl.enableVertexAttribArray(vtfSphere.attrLocations[1]);
                gl.vertexAttribPointer(vtfSphere.attrLocations[1], 1, gl.FLOAT, false, 0, 0);

                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                // gl.activeTexture(gl.TEXTURE0);
                // gl.bindTexture(gl.TEXTURE_2D, vtf_texture);

                gl.drawArrays(gl.POINTS, 0, indices.length);
                gl.flush();
            }

            // Pass2
            {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, vtf_texture);
                gl.useProgram(programs[1]);
                mat4.identity(MATRIX_M);
                mat4.rotate(MATRIX_M, angle, axis, MATRIX_M);
                // mat4.translate(MATRIX_M, vec3(-2.0, -2.0), MATRIX_M);
                mat4.inverse(MATRIX_M, MATRIX_INV_M);
                mat4.multiply(MATRIX_P,   MATRIX_V, MATRIX_MVP);
                mat4.multiply(MATRIX_MVP, MATRIX_M, MATRIX_MVP);

                ////////////////////////////////////////////////////////////////

                // for rendering screen.
                gl.viewport(0, 0, size, size);
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // currentRnederObj = renderPlane;
                currentRnederObj = renderSphere;

                $gl.utility.setRenderObject(currentRnederObj);

                // uniform変数の登録と描画
                gl.uniform1f(currentRnederObj.uniLocations.time, time);
                gl.uniform1i(currentRnederObj.uniLocations.texture, 0);
                gl.uniform2fv(currentRnederObj.uniLocations.mouse, mouse);
                gl.uniform2fv(currentRnederObj.uniLocations.resolution, resolution);
                gl.uniformMatrix4fv(renderPlane.uniLocations.MATRIX_MVP, false, MATRIX_MVP);
                gl.uniformMatrix4fv(renderPlane.uniLocations.MATRIX_INV_M, false, MATRIX_INV_M);
                gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);

                // コンテキストの再描画
                gl.flush();
            }

            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
}());
