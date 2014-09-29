(function () {
    'use strict';
        
    // テクスチャ用変数の宣言
    var texture     = null;
    var programs    = [];

    // canvasエレメントを取得
    var c = document.getElementById('canvas');
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    
    // webglコンテキストを取得
    var gl = $gl.getGLContext(c);

    // シェーダの読み込み
    util.when([
        $gl.loadShader('vertex', 'shader/vertex.shader'),
        $gl.loadShader('fragment', 'shader/fragment.shader')
    ]).done(function (shaders) {
        for (var i = 0, l = shaders.length; i < l; i += 2) {
            // ソースコードをコンパイル、プログラムオブジェクトの生成
            programs[i] = $gl.setupProgram({
                vertexShader  : shaders[i + 0],
                fragmentShader: shaders[i + 1]
            });
        }

        run();
    });

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

    function setRenderObject(obj) {
        $gl.setupAttributes(obj.VBOs, obj.attrLocations, obj.stride);
        $gl.setupIndex(obj.index);
    }

    function render(obj) {
        setRenderObject(obj);
    }

    /**
     * コードの実行
     */
    function run() {
        var sphere = new Sphere(32, 32, 2.0, [1, 1, 1, 1]);
        var torus  = new Torus(32, 32, 1.0, 2.0, [1, 1, 1, 1]);
        var plane  = new Plane(2, 2, 2, 2, [1, 1, 1, 1]);

        var attributes = [
            'position',
            'color',
            'normal'
        ];
        var stride = [3, 4, 3];
        var uniforms = [
            'mvpMatrix',
            'texture',
            'mMatrix',
            'mMatrixInv',
            'lightPosition',
            'tMatrix',
        ];

        var renderSphere = new RenderObject(programs[0], sphere, attributes, stride, uniforms);
        var renderTorus  = new RenderObject(programs[0], torus,  attributes, stride, uniforms);
        var renderPlane  = new RenderObject(programs[0], plane,  attributes, stride, uniforms);

        // 各種行列の生成と初期化
        var mMatrix   = mat4();
        var vMatrix   = mat4();
        var pMatrix   = mat4();
        var tmpMatrix = mat4();
        var mvpMatrix = mat4();

        var cameraPos = vec3(0, 1, 15);
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
        }, false);
        document.addEventListener('mouseup', function (e) {
            dragging = false;
        }, false);

        document.addEventListener('mousewheel', function (e) {
            cameraPos.z -= e.wheelDelta / 5;
            e.preventDefault();
        }, false);

        var lightPosition = vec3(0.0, 1.0, 2.0);
        var lightUp       = vec3.up;

        var tMatrix   = mat4.projectiveTexture;
        var lvMatrix  = mat4();
        var lpMatrix  = mat4();
        var lvpMatrix = mat4();

        // ライトから見たビューｘプロジェクション座標変換行列
        mat4.lookAt(lightPosition, vec3.zero, lightUp, lvMatrix);
        mat4.perspective(60, 1.0, 0.1, 150, lpMatrix);
        mat4.multiply(tMatrix, lpMatrix, lvpMatrix);
        mat4.multiply(lvpMatrix, lvMatrix, tMatrix);
        
        // 深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // 有効にするテクスチャユニットを指定
        gl.activeTexture(gl.TEXTURE0);
        
        // テクスチャを生成
        texture = $gl.setupTexture('img/logo.jpg');
        // texture = $gl.setupTexture('../../img/texture.jpg');
        
        // カウンタの宣言
        var count = 0;
        (function loop() {
            // canvasを初期化
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // ビュー×プロジェクション座標変換行列
            mat4.lookAt(cameraPos, vec3(0, 0, 0), vec3(0, 1, 0), vMatrix);
            mat4.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
            mat4.multiply(pMatrix, vMatrix, tmpMatrix);
            
            count += 0.5;
            var angle = (count % 360);
            
            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // uniform変数にテクスチャを登録
            gl.uniform1i(renderTorus.uniLocations.texture, 0);
            
            var currentRnederObj = renderTorus;
            {
                setRenderObject(currentRnederObj);
        
                // モデル座標変換行列の生成
                mat4.identity(mMatrix);
                mat4.scale(mMatrix, [0.5, 0.5, 0.5], mMatrix);
                mat4.rotate(mMatrix, angle, [1, 0, 0], mMatrix);
                mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                var mMatrixInv = mat4();
                mat4.inverse(mMatrix, mMatrixInv);
                
                // uniform変数の登録と描画
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrix,    false, mMatrix);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrixInv, false, mMatrixInv);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.tMatrix,    false, tMatrix);
                gl.uniform3fv(currentRnederObj.uniLocations.lightPosition, lightPosition);
                gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
            }

            {
                currentRnederObj = renderSphere;
                setRenderObject(currentRnederObj);
        
                // モデル座標変換行列の生成
                mat4.identity(mMatrix);
                mat4.translate(mMatrix, vec3(3, 0, 0), mMatrix);
                mat4.scale(mMatrix, [0.5, 0.5, 0.5], mMatrix);
                mat4.rotate(mMatrix, angle, [0, 1, 0], mMatrix);
                mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                var mMatrixInv = mat4();
                mat4.inverse(mMatrix, mMatrixInv);
                
                // uniform変数の登録と描画
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrix,    false, mMatrix);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrixInv, false, mMatrixInv);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.tMatrix,    false, tMatrix);
                gl.uniform3fv(currentRnederObj.uniLocations.lightPosition, lightPosition);
                gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
            }

            {
                currentRnederObj = renderPlane;
                setRenderObject(currentRnederObj);
        
                // モデル座標変換行列の生成
                mat4.identity(mMatrix);
                mat4.translate(mMatrix, vec3(0, 0, -2), mMatrix);
                mat4.scale(mMatrix, vec3(2), mMatrix);
                mat4.rotate(mMatrix, 90, [1, 0, 0], mMatrix);
                mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                var mMatrixInv = mat4();
                mat4.inverse(mMatrix, mMatrixInv);
                
                // uniform変数の登録と描画
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mvpMatrix,  false, mvpMatrix);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrix,    false, mMatrix);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.mMatrixInv, false, mMatrixInv);
                gl.uniformMatrix4fv(currentRnederObj.uniLocations.tMatrix,    false, tMatrix);
                gl.uniform3fv(currentRnederObj.uniLocations.lightPosition, lightPosition);
                gl.drawElements(gl.TRIANGLES, currentRnederObj.length, gl.UNSIGNED_SHORT, 0);
            }

            // コンテキストの再描画
            gl.flush();
            
            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
}());
