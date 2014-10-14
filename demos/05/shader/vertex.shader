attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;
/*attribute vec3 weights;*/
/*attribute vec4 boneIndices;*/

varying vec4 vColor;

uniform mat4 MATRIX_MVP;
uniform mat4 combMatArr[5];

void main(void){
    vColor = color;

    /*vec3 w;*/
    /*for (int i = 0; i < 3; i++) {*/
    /*    w += weights;*/
    /*}*/

    /*mat4 comb;*/
    /*for (int i = 0; i < 3; i++) {*/
    /*    comb += combMatArr[boneIndices[i]] * weights[i];*/
    /*}*/
    /*comb += combMatArr[boneIndices[3]] * (1.0 - (weights[0] + weights[1] + weights[2]));*/

    gl_Position = MATRIX_MVP * vec4(position, 1.0);
}
