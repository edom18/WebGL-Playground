attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 textureCoord;

uniform mat4 mvpMatrix;
uniform mat4 mMatrix;
uniform mat4 mMatrixInv;
uniform mat4 tMatrix;
uniform vec3 lightPosition;

varying vec4 vNormal;
varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    vec3 wnormal = (vec4(normal, 1.0) * mMatrixInv).xyz;
    float diffuse = clamp(dot(wnormal, lightPosition), 0.1, 1.0);

    vNormal = vec4(normal, 1.0);
    vColor = vec4(1.0) * vec4(vec3(diffuse), 1.0);
    vTextureCoord = textureCoord;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
