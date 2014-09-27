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
            'textureCoord'
        ], attLocation);
        
        // attributeの要素数を配列に格納
        attStride[0] = 3;
        attStride[1] = 4;
        attStride[2] = 2;

        var model = new Sphere(32, 32, 2.0, [0.5, 0, 0, 1]);
        // var model = new Torus(32, 32, 1.0, 2.0, [0.5, 0, 0, 1]);
        var position = model.position;
        var color    = model.color;
        var index    = model.index;
        var textureCoord = model.texture;
        
        // 頂点の位置
        // var position = [
        //     -1.0,  1.0,  0.0,
        //      1.0,  1.0,  0.0,
        //     -1.0, -1.0,  0.0,
        //      1.0, -1.0,  0.0
        // ];
        
        // 頂点色
        // var color = [
        //     1.0, 1.0, 1.0, 1.0,
        //     1.0, 1.0, 1.0, 1.0,
        //     1.0, 1.0, 1.0, 1.0,
        //     1.0, 1.0, 1.0, 1.0
        // ];
        
        // テクスチャ座標
        // var textureCoord = [
        //     0.0, 0.0,
        //     1.0, 0.0,
        //     0.0, 1.0,
        //     1.0, 1.0
        // ];
        
        // 頂点インデックス
        // var index = [
        //     0, 1, 2,
        //     3, 2, 1
        // ];
        
        // VBOとIBOの生成
        var vPosition     = $gl.createVBO(position);
        var vColor        = $gl.createVBO(color);
        var vTextureCoord = $gl.createVBO(textureCoord);
        var VBOList       = [vPosition, vColor, vTextureCoord];
        var iIndex        = $gl.createIBO(index);
        
        // VBOとIBOの登録
        $gl.setupAttributes(VBOList, attLocation, attStride);
        $gl.setupIndex(iIndex);
        
        // uniformLocationを配列に取得
        $gl.getUniformLocations(programs[0], [
            'mvpMatrix',
            'texture'
        ], uniLocation);
        
        // 各種行列の生成と初期化
        var m = new matIV();
        var mMatrix   = m.identity(m.create());
        var vMatrix   = m.identity(m.create());
        var pMatrix   = m.identity(m.create());
        var tmpMatrix = m.identity(m.create());
        var mvpMatrix = m.identity(m.create());
        
        // ビュー×プロジェクション座標変換行列
        m.lookAt([0.0, 2.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
        m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);
        
        // 深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // 有効にするテクスチャユニットを指定
        gl.activeTexture(gl.TEXTURE0);
        
        // テクスチャを生成
        texture = $gl.setupTexture('../../img/texture.jpg');
        
        // カウンタの宣言
        var count = 0;
        (function loop() {
            // canvasを初期化
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // カウンタを元にラジアンを算出
            count += 0.5;
            var rad = (count % 360) * Math.PI / 180;
            
            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // uniform変数にテクスチャを登録
            gl.uniform1i(uniLocation[1], 0);
            
            // モデル座標変換行列の生成
            m.identity(mMatrix);
            m.scale(mMatrix, [0.5, 0.5, 0.5], mMatrix);
            m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
            m.multiply(tmpMatrix, mMatrix, mvpMatrix);
            
            // uniform変数の登録と描画
            gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
            gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
            
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
