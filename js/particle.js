(function () {
    'use strict';

    var c, gl;
        
    // テクスチャ用変数の宣言
    var texture  = null;
    var v_shader = null;
    var f_shader = null;
    var prg      = null;

    var attLocation = [];
    var attStride   = [];
    var uniLocation = [];

    var material1 = {
        attLocation: [],
        attStride  : [],
        uniLocation: []
    };

    var material2 = {
        attLocation: [],
        attStride  : [],
        uniLocation: []
    };

    var running = false;
    var doLoop  = false;

    /**
     * ソースコードをコンパイル、プログラムオブジェクトの生成
     *
     * @return {WebGLProgram}
     */
    function compileSource() {
        // 頂点シェーダとフラグメントシェーダの生成
        var vertexShaderSource   = document.getElementById('vertex-shader').innerHTML;
        var fragmentShaderSource = document.getElementById('fragment-shader').innerHTML;
        v_shader = create_shader('vertex-shader',   vertexShaderSource);
        f_shader = create_shader('fragment-shader', fragmentShaderSource);
        
        // プログラムオブジェクトの生成とリンク
        return create_program(v_shader, f_shader);
    }


    function Material(vertSrc, fragSrc) {

    }

    /**
     * コードの実行
     */
    function run() {

        if (running) {
            gl.detachShader(prg, v_shader);
            gl.detachShader(prg, f_shader);
            gl.deleteProgram(prg);
            gl.deleteShader(v_shader);
            gl.deleteShader(f_shader);
        }
        running = true;

        // ソースコードをコンパイル、プログラムオブジェクトの生成
        prg = compileSource();
        
        // attributeLocationを配列に取得
        material1.attLocation[0] = gl.getAttribLocation(prg, 'position');
        material1.attLocation[1] = gl.getAttribLocation(prg, 'color');
        material1.attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');
        
        // attributeの要素数を配列に格納
        material1.attStride[0] = 3;
        material1.attStride[1] = 4;
        material1.attStride[2] = 2;
        
        // 頂点の位置
        var position = [
            -1.0,  1.0,  0.0,
             1.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        
        // 頂点色
        var color = [
            1.0, 0.0, 1.0, 1.0,
            0.0, 1.0, 1.0, 1.0,
            0.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0
        ];
        
        // テクスチャ座標
        var textureCoord = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
        
        // 頂点インデックス
        var index = [
            0, 1, 2,
            3, 2, 1
        ];
        
        // VBOとIBOの生成
        var vPosition     = create_vbo(position);
        var vColor        = create_vbo(color);
        var vTextureCoord = create_vbo(textureCoord);
        var VBOList       = [vPosition, vColor, vTextureCoord];
        var iIndex        = create_ibo(index);
        
        // VBOとIBOの登録
        set_attribute(VBOList, material1.attLocation, material1.attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);
        
        // uniformLocationを配列に取得
        material1.uniLocation[0]  = gl.getUniformLocation(prg, 'mvpMatrix');
        material1.uniLocation[1]  = gl.getUniformLocation(prg, 'texture');
        
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

        // アルファブレンディング
        gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        
        // 有効にするテクスチャユニットを指定
        gl.activeTexture(gl.TEXTURE0);
        
        // テクスチャを生成
        // create_texture('img/texture.jpg');
        create_texture_from_canvas(createParticleTexture(128));
        
        // カウンタの宣言
        var count = 0;
        
        // 恒常ループ
        if (doLoop) {
            return;
        }
        doLoop = true;

        (function loop() {
            // canvasを初期化
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // カウンタを元にラジアンを算出
            count += 0.01;
            var rad = (count % 360) * Math.PI / 180;
            
            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // uniform変数にテクスチャを登録
            gl.uniform1i(material1.uniLocation[1], 0);
            
            // モデル座標変換行列の生成
            m.identity(mMatrix);
            m.translate(mMatrix, [count, 0, 0], mMatrix);
            // m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
            m.multiply(tmpMatrix, mMatrix, mvpMatrix);
            
            // uniform変数の登録と描画
            gl.uniformMatrix4fv(material1.uniLocation[0], false, mvpMatrix);
            gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

            m.identity(mMatrix);
            m.translate(mMatrix, [-count, 0, 0], mMatrix);
            m.multiply(tmpMatrix, mMatrix, mvpMatrix);

            gl.uniformMatrix4fv(material1.uniLocation[0], false, mvpMatrix);
            gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
            
            // コンテキストの再描画
            gl.flush();
            
            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
    window.run = run;


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Utilities

    // シェーダを生成する関数
    function create_shader(type, source){
        // シェーダを格納する変数
        var shader;
        
        // scriptタグのtype属性をチェック
        switch(type){
            
            // 頂点シェーダの場合
            case 'vertex-shader':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
                
            // フラグメントシェーダの場合
            case 'fragment-shader':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default :
                return;
        }
        
        // 生成されたシェーダにソースを割り当てる
        gl.shaderSource(shader, source);
        
        // シェーダをコンパイルする
        gl.compileShader(shader);
        
        // シェーダが正しくコンパイルされたかチェック
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            // 成功していたらシェーダを返して終了
            return shader;
        }
    }
    
    // プログラムオブジェクトを生成しシェーダをリンクする関数
    function create_program(vs, fs){
        // プログラムオブジェクトの生成
        var program = gl.createProgram();
        
        // プログラムオブジェクトにシェーダを割り当てる
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        
        // シェーダをリンク
        gl.linkProgram(program);
        
        // シェーダのリンクが正しく行なわれたかチェック
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        
            // 成功していたらプログラムオブジェクトを有効にする
            gl.useProgram(program);
            
            // プログラムオブジェクトを返して終了
            return program;
        }
    }
    
    // VBOを生成する関数
    function create_vbo(data){
        // バッファオブジェクトの生成
        var vbo = gl.createBuffer();
        
        // バッファをバインドする
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        
        // バッファにデータをセット
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        
        // バッファのバインドを無効化
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // 生成した VBO を返して終了
        return vbo;
    }
    
    // VBOをバインドし登録する関数
    function set_attribute(vbo, attL, attS){
        // 引数として受け取った配列を処理する
        for(var i in vbo){
            // バッファをバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
            
            // attributeLocationを有効にする
            gl.enableVertexAttribArray(attL[i]);
            
            // attributeLocationを通知し登録する
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }
    
    // IBOを生成する関数
    function create_ibo(data){
        // バッファオブジェクトの生成
        var ibo = gl.createBuffer();
        
        // バッファをバインドする
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        
        // バッファにデータをセット
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        
        // バッファのバインドを無効化
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
        // 生成したIBOを返して終了
        return ibo;
    }

    // Canvasからテクスチャを生成
    function create_texture_from_canvas(source){
        // テクスチャオブジェクトの生成
        var tex = gl.createTexture();
        
        // テクスチャをバインドする
        gl.bindTexture(gl.TEXTURE_2D, tex);
        
        // テクスチャへイメージを適用
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        
        // ミップマップを生成
        gl.generateMipmap(gl.TEXTURE_2D);
        
        // テクスチャのバインドを無効化
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        // 生成したテクスチャをグローバル変数に代入
        texture = tex;
    }
    
    // テクスチャを生成する関数
    function create_texture(source){
        // イメージオブジェクトの生成
        var img = new Image();
        
        // データのオンロードをトリガーにする
        img.onload = function(){
            // テクスチャオブジェクトの生成
            var tex = gl.createTexture();
            
            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, tex);
            
            // テクスチャへイメージを適用
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            
            // ミップマップを生成
            gl.generateMipmap(gl.TEXTURE_2D);
            
            // テクスチャのバインドを無効化
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            // 生成したテクスチャをグローバル変数に代入
            texture = tex;
        };
        
        // イメージオブジェクトのソースを指定
        img.src = source;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////

    // 初期化
    window.onload = function(){
        // canvasエレメントを取得
        c = document.getElementById('canvas');
        c.width  = window.innerWidth;
        c.height = window.innerHeight;
        
        // webglコンテキストを取得
        gl = c.getContext('webgl') || c.getContext('experimental-webgl');

        // コードを実行
        run();
    };

    function createParticleTexture(size) {
        var cv = document.createElement('canvas');
        var ctx = cv.getContext('2d');
        cv.width = cv.height = size;

        var p = {
            x: size/2,
            y: size/2,
            r: size/4
        };
        var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grd.addColorStop(0, 'rgba(255, 155, 155, 150)');
        grd.addColorStop(1, 'rgba(250, 150, 150,   0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
        ctx.fill();

        document.body.appendChild(cv);
        return ctx.getImageData(0, 0, size, size);
    }

}());
