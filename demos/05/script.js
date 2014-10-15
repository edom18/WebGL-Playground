/**
 * @param {vec3} position
 */
function Bone(position) {
    this.init(position);
}

/**
 * 各種ボーンを親空間の相対位置に変換
 */
Bone.calcRelativeMat = function (bone, parentOffsteMat) {
    bone.children.forEach(function (childBone, idx) {
        Bone.calcRelativeMat(childBone, bone.matrixOffset);
    });

    if (parentOffsteMat) {
        mat4.multiply(bone.matrixInit, parentOffsteMat, bone.matrixInit);
    }
};

/**
 * 各種ボーンの合成行列を生成
 */
Bone.updateBone = function (bone, parentWorldMat) {
    // 親の姿勢行列（オフセット行列）を左から自身の姿勢行列に掛ける
    mat4.multiply(parentWorldMat, bone.matrixBone, bone.matrixBone);

    // 自身のオフセット行列を右から掛けて合成行列を生成
    mat4.multiply(bone.matrixBone, bone.matrixOffset, bone.matrixComb);

    bone.children.forEach(function (childBone, idx) {
        Bone.updateBone(childBone, bone.matrixBone);
    });
};

Bone.prototype = {
    constructor: Bone,
    init: function (position) {
        this.matrix       = mat4();
        this.matrixBone   = mat4();
        this.matrixComb   = mat4();
        this.matrixInit   = mat4.translate(mat4(), position);
        this.matrixOffset = mat4.inverse(this.matrixInit);
        this.children = [];
    },
    parentBone: null,
    add: function (bone) {
        if (bone.parentBone) {
            bone.parentBone.remove(bone);
        }
        this.children.push(bone);
        bone.parentBone = this;
    },
    remove: function (bone) {
        var index = this.children.indexOf(bone);
        if (~index) {
            return;
        }
        this.children.splice(index, 1);
        bone.parentBone = null;
    },
    translate: function (translate) {
        mat4.translate(this.matrix, translate, this.matrix);
        this.updateMatrix();
    },
    rotate: function (angle, axis) {
        mat4.rotate(this.matrix, angle, axis, this.matrix);
        this.updateMatrix();
    },
    scale: function (scale) {
        mat4.scale(this.matrix, scale, this.matrx);
        this.updateMatrix();
    },
    updateMatrix: function () {
        mat4.multiply(this.matrixInit, this.matrix, this.matrixBone);
    },
};


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
        $gl.loadShader('fragment', 'shader/fragment.shader')
    ]).done(function (shaders) {
        program = $gl.setupProgram({
            vertexShader: shaders[0],
            fragmentShader: shaders[1]
        });
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

        /////////////////////////////////////////////////////////////////////////////////

        var attributes = [
            'position',
            'color',
            'normal',
        ];
        var stride = [3, 4, 3];
        var uniforms = [
            'time',
            'mouse',
            'resolution',
            'MATRIX_MVP',
        ];
            
        // Planeの定義
        var plane = {
            position: [
                2.0, 0.0, 0.0,
                2.0, 1.0, 0.0,
                3.0, 1.0, 0.0,
                3.0, 0.0, 0.0,

                2.0, 2.0, 0.0,
                3.0, 2.0, 0.0,
                2.0, 3.0, 0.0,
                3.0, 3.0, 0.0,

                2.0, 4.0, 0.0,
                3.0, 4.0, 0.0,
                2.0, 5.0, 0.0,
                3.0, 5.0, 0.0,
            ],
            color: [
                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 0.0, 1.0,

                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 0.0, 1.0,

                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 0.0, 1.0,
            ],
            normal: [
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,

                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,

                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
            ],
            index: [
                0, 1, 2,
                2, 3, 0,

                1, 4, 5,
                5, 2, 1,

                4, 6, 7,
                7, 5, 4,

                6, 8, 9,
                9, 7, 6,

                8, 10, 11,
                11, 9,  8,
            ],
            boneIndices: [
                0, 0, 0, 0,
                1, 2, 0, 0,
                0, 1, 0, 0,
                0, 0, 0, 0,
                1, 2, 0, 0,
                1, 2, 0, 0,
                2, 3, 0, 0,
                2, 3, 0, 0,
                3, 4, 0, 0,
                3, 4, 0, 0,
                4, 0, 0, 0,
                4, 0, 0, 0,
            ],
            weights: [
                1.0, 0.0, 0.0,
                0.5, 0.5, 0.0,
                0.5, 0.5, 0.0,
                1.0, 0.0, 0.0,

                0.5, 0.5, 0.0,
                0.5, 0.5, 0.0,
                0.5, 0.5, 0.0,
                0.5, 0.5, 0.0,

                0.5, 0.5, 0.0,
                0.5, 0.5, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
            ],
        };

        var rootBone = new Bone(vec3(2.5, 0.5, 0.0));
        var bones = [
            rootBone,
            new Bone(vec3(2.5, 1.5, 0.0)),
            new Bone(vec3(2.5, 2.5, 0.0)),
            new Bone(vec3(2.5, 3.5, 0.0)),
            new Bone(vec3(2.5, 4.5, 0.0)),
        ];
        var combMatArr = [];


        var cameraPos  = vec3(0, 0, 7);
        var MATRIX_M   = mat4();
        var MATRIX_V   = mat4.lookAt(cameraPos, vec3.zero, vec3.up);
        var MATRIX_P   = mat4.perspective(60, c.width / c.height, 0.1, 1000);
        var MATRIX_MVP = mat4();

        var renderPlane  = new $gl.utility.RenderObject(program, plane,  attributes, stride, uniforms);

        // ボーンのセットアップ
        var global = mat4();
        for (var i = 0; i < bones.length - 1; i++) {
            bones[i].add(bones[i + 1]);
        }
        Bone.calcRelativeMat(bones[0], global);

        // カウンタの宣言
        var count = 0;
        var startTime = +new Date();
        var resolution = [size, size];
        var axis = vec3(1, 0, 0);
        (function loop() {

            count += 0.01;
            var angle = (count % 360);
            var currentRnederObj;
            var time = (+new Date() - startTime) * 0.001;

            var s = Math.sin(count) / 5;

            for (var i = 0; i < bones.length; i++) {
                bones[i].rotate(s, axis);
            }

            Bone.updateBone(bones[0], global);

            for (var i = 0; i < bones.length; i++) {
                combMatArr[i] = bones[i].matrixComb;
            }

            mat4.identity(MATRIX_M);
            mat4.translate(MATRIX_M, vec3(-2.0, -2.0), MATRIX_M);
            mat4.multiply(MATRIX_P,   MATRIX_V, MATRIX_MVP);
            mat4.multiply(MATRIX_MVP, MATRIX_M, MATRIX_MVP);

            ////////////////////////////////////////////////////////////////

            // for rendering screen.
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            $gl.utility.setRenderObject(renderPlane);

            var newPosition = [];
            var newNormal   = [];
            for (var i = 0; i < 12; i++) {
                var idxBase = i * 3;
                var idx0 = idxBase + 0;
                var idx1 = idxBase + 1;
                var idx2 = idxBase + 2;
                
                var comb1 = [
                    mat4(),
                    mat4(),
                    mat4(),
                    mat4()
                ];
                var comb2 = mat4.zero;

                for (var j = 0; j < 3; j++) {
                    var boneIdx   = i * 4 + j;
                    var weightIdx = i * 3 + j;
                    mat4.multiplyScalar(combMatArr[plane.boneIndices[boneIdx]], plane.weights[weightIdx], comb1[j]);
                }
                var weight = 1.0 - (plane.weights[i * 3 + 0] +
                                    plane.weights[i * 3 + 1] +
                                    plane.weights[i * 3 + 2]);
                mat4.multiplyScalar(combMatArr[plane.boneIndices[i * 4 + 3]], weight, comb1[3]);

                for (var k = 0; k < 4; k++) {
                    mat4.add(comb2, comb1[k], comb2);
                }

                var pos = vec3(plane.position[idx0],
                               plane.position[idx1],
                               plane.position[idx2]);

                vec3.applyMatrix4(pos, comb2, pos);
                newPosition[idx0] = pos.x;
                newPosition[idx1] = pos.y;
                newPosition[idx2] = pos.z;

                var nor = vec3(plane.normal[idx0],
                               plane.normal[idx1],
                               plane.normal[idx2]);
                mat4.inverse(comb2, comb2);

                vec3.applyMatrix4FromRight(nor, comb2, nor);
                newNormal[idx0] = nor.x;
                newNormal[idx1] = nor.y;
                newNormal[idx2] = nor.z;
            }

            var vbo = $gl.createVBO(newPosition);
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.enableVertexAttribArray(renderPlane.attrLocations[0]);
            gl.vertexAttribPointer(renderPlane.attrLocations[0], 3, gl.FLOAT, false, 0, 0);

            var vboNor = $gl.createVBO(newNormal);
            gl.bindBuffer(gl.ARRAY_BUFFER, vboNor);
            gl.enableVertexAttribArray(renderPlane.attrLocations[2]);
            gl.vertexAttribPointer(renderPlane.attrLocations[2], 3, gl.FLOAT, false, 0, 0);

            // uniform変数の登録と描画
            gl.uniform1f(renderPlane.uniLocations.time, time);
            gl.uniform2fv(renderPlane.uniLocations.mouse, mouse);
            gl.uniform2fv(renderPlane.uniLocations.resolution, resolution);
            gl.uniformMatrix4fv(renderPlane.uniLocations.MATRIX_MVP, false, MATRIX_MVP);
            gl.drawElements(gl.TRIANGLES, renderPlane.length, gl.UNSIGNED_SHORT, 0);

            // コンテキストの再描画
            gl.flush();

            // ループのために再帰呼び出し
            requestAnimationFrame(loop);
        })();
    }
}());
