(function () {
    'use strict';
        
    // テクスチャ用変数の宣言
    var texture     = null;
    var programs    = [];

    var size = 512;

    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    c.width  = size;//window.innerWidth;
    c.height = size;//window.innerHeight;
    
    // webglコンテキストを取得
    var gl = $gl.getGLContext(c);

    // シェーダの読み込み
    util.when([
        // 通常レンダリング用のシェーダ
        $gl.loadShader('vertex', 'shader/vertex.shader'),
        $gl.loadShader('fragment', 'shader/fragment.shader'),

        // 影レンダリング用のシェーダ
        $gl.loadShader('vertex', 'shader/shadowVertex.shader'),
        $gl.loadShader('fragment', 'shader/shadowFragment.shader')
    ]).done(function (shaders) {
        for (var i = 0, l = shaders.length; i < l; i += 2) {
            programs[i / 2] = $gl.setupProgram({
                vertexShader  : shaders[i + 0],
                fragmentShader: shaders[i + 1]
            });
        }

        gl.useProgram(programs[0]);

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
     * render (wrapper function)
     *
     * @param {RenderObject} obj
     */
    function render(obj) {
        setRenderObject(obj);
    }

    /**
     * コードの実行
     */
    function run() {
        var cameraPos = vec3(0, 1, 15);
        var lightPosition = vec3(0.0, 0.0, 5.0);
        var lightUp       = vec3.up;

        var dragging = false;
        var delta = 0;
        var previousX = 0;
        var previousY = 0;
        document.addEventListener('mousedown', function (e) {
            dragging = true;
            previousX = e.pageX;
            previousY = e.pageY;
        }, false);
        document.addEventListener('mousemove', function (e) {
            if (!dragging) {
                return;
            }

            var deltaX = e.pageX - previousX;
            var deltaY = e.pageY - previousY;
            previousX = e.pageX;
            previousY = e.pageY;

            cameraPos.x -= deltaX;
            cameraPos.y -= deltaY;
            // lightPosition.x -= deltaX / 10;
            // lightPosition.y -= deltaY / 10;
        }, false);
        document.addEventListener('mouseup', function (e) {
            dragging = false;
        }, false);

        document.addEventListener('mousewheel', function (e) {
            cameraPos.z -= e.wheelDelta / 5;
            // lightPosition.z -= e.wheelDelta / 10;
            e.preventDefault();
        }, false);

        /////////////////////////////////////////////////////////////////////////////////

        // Create models.
        var sphere = new Sphere(32, 32, 2.0, [1, 0, 0, 1]);
        var torus  = new Torus(32, 32, 1.0, 2.0, [1, 1, 1, 1]);
        var plane  = new Plane(2, 2, 2, 2, [1, 1, 1, 1]);

        /////////////////////////////////////////////////////////////////////////////////

        // 各種行列の生成と初期化
        var mMatrix   = mat4();
        var vMatrix   = mat4();
        var pMatrix   = mat4();
        var tmpMatrix = mat4();
        var mvpMatrix = mat4();

        // 射影テクスチャリング用行列を保持
        var textureProjMatrix = mat4.projectiveTexture;

        var tMatrix    = mat4();
        var lvMatrix   = mat4();
        var lpMatrix   = mat4();
        var lvpMatrix  = mat4();
        var lgtMatrix  = mat4();

        
        // 深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        /////////////////////////////////////////////////////////////////////////////////

        // Create a frame buffer as shadow map.
        var width  = size;
        var height = size;
        var f = $gl.setupFrameBuffer(width, height);

        /////////////////////////////////////////////////////////////////////////////////

        // for normal rendering.
        {
            var attributes = [
                'position',
                'color',
                'normal',
                'textureCoord'
            ];
            var stride = [3, 4, 3, 2];
            var uniforms = [
                'mvpMatrix',
                'texture',
                'shadowTexture',
                'mMatrix',
                'mMatrixInv',
                'lgtMatrix',
                'lightPosition',
                'tMatrix',
                'showDepthBuffer',
            ];

            var renderSphere = new RenderObject(programs[0], sphere, attributes, stride, uniforms);
            var renderTorus  = new RenderObject(programs[0], torus,  attributes, stride, uniforms);
            var renderPlane  = new RenderObject(programs[0], plane,  attributes, stride, uniforms);
        }

        // for shadow rendering.
        {
            var attributes = [
                'position'
            ];
            var stride = [3];
            var uniforms = [
                'mvpMatrix'
            ];

            var shadowSphere = new RenderObject(programs[1], sphere, attributes, stride, uniforms);
            var shadowTorus  = new RenderObject(programs[1], torus,  attributes, stride, uniforms);
            var shadowPlane  = new RenderObject(programs[1], plane,  attributes, stride, uniforms);
        }

        
        // 有効にするテクスチャユニットを指定
        gl.activeTexture(gl.TEXTURE0);
        
        // テクスチャを生成
        // texture = $gl.setupTexture('img/logo.jpg');
        texture = $gl.setupTexture('../../img/texture.jpg');
        

        // カウンタの宣言
        var count = 0;
        var DEG_TO_RAD = $gl.DEG_TO_RAD;
        (function loop() {

            count += 0.5;
            var angle = (count % 360);
            var currentRnederObj;

            var currentLightPos = vec3(0);
            var rad = $gl.degToRad(angle);
            currentLightPos.x = lightPosition.x + Math.cos(rad) * 3;
            currentLightPos.y = lightPosition.x + Math.sin(rad) * 3;
            currentLightPos.z = lightPosition.z;

            // ライトから見たビューｘプロジェクション座標変換行列
            mat4.lookAt(currentLightPos, vec3.zero, lightUp, lvMatrix);
            mat4.perspective(90, 1.0, 0.1, 1350, lpMatrix);
            mat4.multiply(lpMatrix, lvMatrix, lvpMatrix);

            // 射影テクスチャリング用に行列を生成
            mat4.multiply(textureProjMatrix, lvpMatrix, tMatrix);

            // for rendering shadow.
            {
                gl.useProgram(programs[1]);
                gl.bindFramebuffer(gl.FRAMEBUFFER, f.framebuffer);

                // canvasを初期化
                gl.clearColor(1.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                var mMatrix4Shadow    = mat4();
                var mvpMatrix4Shadow  = mat4();
                var mMatrixInv4Shadow = mat4();

                // シャドウ用トーラスモデル
                {
                    currentRnederObj = shadowTorus;
                    setRenderObject(currentRnederObj);
            
                    mat4.identity(mMatrix4Shadow);
                    mat4.translate(mMatrix4Shadow, vec3(-2, 0, -1), mMatrix4Shadow);
                    mat4.scale(mMatrix4Shadow, vec3(0.5), mMatrix4Shadow);
                    mat4.rotate(mMatrix4Shadow, angle, vec3(1, 0, 0), mMatrix4Shadow);
                    mat4.multiply(lvpMatrix, mMatrix4Shadow, mvpMatrix4Shadow);

                    // uniform変数の登録と描画
                    gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix4Shadow);
                    gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                }

                // シャドウ用トーラスモデル2
                {
                    currentRnederObj = shadowTorus;
                    setRenderObject(currentRnederObj);
            
                    mat4.identity(mMatrix4Shadow);
                    mat4.translate(mMatrix4Shadow, vec3(-1, 0, 2), mMatrix4Shadow);
                    mat4.scale(mMatrix4Shadow, vec3(0.5), mMatrix4Shadow);
                    mat4.rotate(mMatrix4Shadow, angle, vec3(0, 0, 1), mMatrix4Shadow);
                    mat4.multiply(lvpMatrix, mMatrix4Shadow, mvpMatrix4Shadow);

                    // uniform変数の登録と描画
                    gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix4Shadow);
                    gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                }

                // シャドウ用スフィアモデル
                // {
                //     currentRnederObj = shadowSphere;
                //     setRenderObject(currentRnederObj);
            
                //     mat4.identity(mMatrix4Shadow);
                //     mat4.translate(mMatrix4Shadow, vec3(2, 0, 0), mMatrix4Shadow);
                //     mat4.scale(mMatrix4Shadow, vec3(0.5, 0.5, 0.5), mMatrix4Shadow);
                //     mat4.rotate(mMatrix4Shadow, angle, vec3(0, 1, 0), mMatrix4Shadow);
                //     mat4.multiply(lvpMatrix, mMatrix4Shadow, mvpMatrix4Shadow);

                //     // uniform変数の登録と描画
                //     gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix4Shadow);
                //     gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                // }

                // シャドウ用プレーンモデル
                {
                    currentRnederObj = shadowPlane;
                    setRenderObject(currentRnederObj);
            
                    mat4.identity(mMatrix4Shadow);
                    mat4.translate(mMatrix4Shadow, vec3(0, 0, -10), mMatrix4Shadow);
                    mat4.scale(mMatrix4Shadow, vec3(5), mMatrix4Shadow);
                    mat4.rotate(mMatrix4Shadow, 90, [1, 0, 0], mMatrix4Shadow);
                    mat4.multiply(lvpMatrix, mMatrix4Shadow, mvpMatrix4Shadow);

                    // uniform変数の登録と描画
                    gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix4Shadow);
                    gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                }
            }

            ////////////////////////////////////////////////////////////////

            // for rendering screen.
            {
                // uniform変数にテクスチャを登録
                gl.useProgram(programs[0]);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(renderTorus.uniLocations.texture, 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, f.texture);
                gl.uniform1i(renderTorus.uniLocations.shadowTexture, 1);

                
                var check = document.getElementById('showDepthBuffer').checked;
                {
                    gl.clearColor(0.0, 0.0, 0.0, 1.0);
                    gl.clearDepth(1.0);
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                    // ビュー×プロジェクション座標変換行列
                    mat4.lookAt(cameraPos, vec3(0, 0, 0), vec3(0, 1, 0), vMatrix);
                    mat4.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
                    mat4.multiply(pMatrix, vMatrix, tmpMatrix);

                    // トーラスモデルの描画
                    {
                        currentRnederObj = renderTorus;
                        setRenderObject(currentRnederObj);
                
                        // モデル座標変換行列の生成
                        mat4.identity(mMatrix);
                        mat4.translate(mMatrix, vec3(-2, 0, -1), mMatrix);
                        mat4.scale(mMatrix, vec3(0.5), mMatrix);
                        mat4.rotate(mMatrix, angle, [1, 0, 0], mMatrix);
                        mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                        var mMatrixInv = mat4();
                        mat4.inverse(mMatrix, mMatrixInv);

                        mat4.identity(lgtMatrix);
                        mat4.multiply(lvpMatrix, mMatrix, lgtMatrix);
                        
                        // uniform変数の登録と描画
                        gl.uniform1i(currentRnederObj.uniLocations.texture, 0);
                        gl.uniform1i(currentRnederObj.uniLocations.showDepthBuffer, check);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrix,    false, mMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrixInv, false, mMatrixInv);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.tMatrix,    false, tMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.lgtMatrix,  false, lgtMatrix);
                        gl.uniform3fv(currentRnederObj.uniLocations.lightPosition, lightPosition);
                        gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                    }

                    // トーラスモデルの描画2
                    {
                        currentRnederObj = renderTorus;
                        setRenderObject(currentRnederObj);
                
                        // モデル座標変換行列の生成
                        mat4.identity(mMatrix);
                        mat4.translate(mMatrix, vec3(-1, 0, 2), mMatrix);
                        mat4.scale(mMatrix, vec3(0.5), mMatrix);
                        mat4.rotate(mMatrix, angle, [0, 0, 1], mMatrix);
                        mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                        var mMatrixInv = mat4();
                        mat4.inverse(mMatrix, mMatrixInv);

                        mat4.identity(lgtMatrix);
                        mat4.multiply(lvpMatrix, mMatrix, lgtMatrix);
                        
                        // uniform変数の登録と描画
                        gl.uniform1i(currentRnederObj.uniLocations.texture, 0);
                        gl.uniform1i(currentRnederObj.uniLocations.showDepthBuffer, check);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrix,    false, mMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrixInv, false, mMatrixInv);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.tMatrix,    false, tMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.lgtMatrix,  false, lgtMatrix);
                        gl.uniform3fv(currentRnederObj.uniLocations.lightPosition, lightPosition);
                        gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                    }

                    // スフィアモデルの描画
                    {
                        currentRnederObj = renderSphere;
                        setRenderObject(currentRnederObj);
                
                        // モデル座標変換行列の生成
                        mat4.identity(mMatrix);
                        // mat4.translate(mMatrix, vec3(2, 0, 0), mMatrix);
                        mat4.translate(mMatrix, currentLightPos, mMatrix);
                        mat4.scale(mMatrix, vec3(0.2), mMatrix);
                        mat4.rotate(mMatrix, angle, [0, 1, 0], mMatrix);
                        mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                        var mMatrixInv = mat4();
                        mat4.inverse(mMatrix, mMatrixInv);

                        mat4.identity(lgtMatrix);
                        mat4.multiply(lvpMatrix, mMatrix, lgtMatrix);
                        
                        // uniform変数の登録と描画
                        gl.uniform1i(currentRnederObj.uniLocations.texture, 0);
                        gl.uniform1i(currentRnederObj.uniLocations.showDepthBuffer, check);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrix,    false, mMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrixInv, false, mMatrixInv);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.tMatrix,    false, tMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.lgtMatrix,  false, lgtMatrix);
                        gl.uniform3fv(currentRnederObj.uniLocations.lightPosition, lightPosition);
                        gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                    }

                    // プレーンモデルの描画
                    {
                        currentRnederObj = renderPlane;
                        setRenderObject(currentRnederObj);
                
                        // モデル座標変換行列の生成
                        mat4.identity(mMatrix);
                        mat4.translate(mMatrix, vec3(0, 0, -10), mMatrix);
                        mat4.scale(mMatrix, vec3(5), mMatrix);
                        mat4.rotate(mMatrix, 90, [1, 0, 0], mMatrix);
                        mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                        var mMatrixInv = mat4();
                        mat4.inverse(mMatrix, mMatrixInv);

                        mat4.identity(lgtMatrix);
                        mat4.multiply(lvpMatrix, mMatrix, lgtMatrix);
                        
                        // uniform変数の登録と描画
                        gl.uniform1i(currentRnederObj.uniLocations.texture, 0);
                        gl.uniform1i(currentRnederObj.uniLocations.showDepthBuffer, check);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrix,    false, mMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrixInv, false, mMatrixInv);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.tMatrix,    false, tMatrix);
                        gl.uniformMatrix4fv(currentRnederObj.uniLocations.lgtMatrix,  false, lgtMatrix);
                        gl.uniform3fv(currentRnederObj.uniLocations.lightPosition, lightPosition);
                        gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
                    }
                }
            }

            // コンテキストの再描画
            gl.flush();

            
            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
}());
