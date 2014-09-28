(function () {
    'use strict';

    var c, gl;
        
    // テクスチャ用変数の宣言
    var texture     = null;
    var programs    = [];
    var attLocation = [];
    var attStride   = [];
    var uniLocation = [];

    // シェーダの読み込み
    util.when([
        $gl.loadShader('vertex', 'vertex.shader'),
        $gl.loadShader('fragment', 'fragment.shader')
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

    /**
     * コードの実行
     */
    function run() {

        // attributeLocationを配列に取得
        $gl.getAttribLocations(programs[0], [
            'position',
            'color',
            'textureCoord',
            'normal',
        ], attLocation);
        
        // attributeの要素数を配列に格納
        attStride[0] = 3;
        attStride[1] = 4;
        attStride[2] = 2;
        attStride[3] = 3;

        // var model = new Sphere(32, 32, 2.0, [0.5, 0, 0, 1]);
        // var model = new Torus(32, 32, 1.0, 2.0, [0.5, 0, 0, 1]);
        var model = new Plane(2, 2, 2, 2, [0.5, 0, 0, 1]);

        var lightPosition = vec3(1, 1, 1);
        var lightUp       = vec3.up;
        
        // VBOとIBOの生成
        var vPosition     = $gl.createVBO(model.position);
        var vNormal       = $gl.createVBO(model.normal);
        var vColor        = $gl.createVBO(model.color);
        var vTextureCoord = $gl.createVBO(model.textureCoord);
        var VBOList       = [vPosition, vColor, vTextureCoord, vNormal];
        var iIndex        = $gl.createIBO(model.index);
        
        // VBOとIBOの登録
        $gl.setupAttributes(VBOList, attLocation, attStride);
        $gl.setupIndex(iIndex);
        
        // uniformLocationを配列に取得
        $gl.getUniformLocations(programs[0], [
            'mvpMatrix',
            'texture',
            'mMatix',
            'mMatrixInv',
            'lightPosition',
        ], uniLocation);
        
        // 各種行列の生成と初期化
        var mMatrix   = mat4();
        var vMatrix   = mat4();
        var pMatrix   = mat4();
        var tmpMatrix = mat4();
        var mvpMatrix = mat4();
        
        // ビュー×プロジェクション座標変換行列
        mat4.lookAt(vec3(0.0, 3.0, 5.0), vec3(0, 0, 0), vec3(0, 1, 0), vMatrix);
        mat4.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
        mat4.multiply(pMatrix, vMatrix, tmpMatrix);
        
        // 深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // 有効にするテクスチャユニットを指定
        gl.activeTexture(gl.TEXTURE0);
        
        // テクスチャを生成
        texture = $gl.setupTexture('../../img/texture.jpg');

        var m = new matIV();
        
        // カウンタの宣言
        var count = 0;
        (function loop() {
            // canvasを初期化
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            count += 0.5;
            var angle = (count % 360);
            
            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // uniform変数にテクスチャを登録
            gl.uniform1i(uniLocation[1], 0);
            
            {
                // モデル座標変換行列の生成
                mat4.identity(mMatrix);
                mat4.scale(mMatrix, [0.5, 0.5, 0.5], mMatrix);
                mat4.rotate(mMatrix, angle, [0, 1, 0], mMatrix);
                mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                var mMatrixInv = mat4();
                m.inverse(mMatrix, mMatrixInv);
                
                // uniform変数の登録と描画
                gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
                gl.uniformMatrix4fv(uniLocation[2], false, mMatrix);
                gl.uniformMatrix4fv(uniLocation[3], false, mMatrixInv);
                gl.uniform3fv(uniLocation[4], lightPosition);
                gl.drawElements(gl.TRIANGLES, model.index.length, gl.UNSIGNED_SHORT, 0);
            }

            // コンテキストの再描画
            gl.flush();
            
            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
    window.run = run;

    //////////////////////////////////////////////////////////////////////////////////////////////

    // 初期化
    window.onload = function(){
        // canvasエレメントを取得
        c = document.getElementById('canvas');
        c.width  = window.innerWidth;
        c.height = window.innerHeight;
        
        // webglコンテキストを取得
        gl = $gl.getGLContext(c);

        // コードを実行
        // run();
    };

}());
