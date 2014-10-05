attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 textureCoord;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 mMatrixInv;
uniform mat4 tMatrix;
uniform mat4 lgtMatrix;
uniform vec3 lightPosition;

varying vec4 vColor;
varying vec4 vShadowTextureCoord;
varying vec2 vTextureCoord;
varying vec4 vPosition;

void main(void) {
    vec3 wpos     = (mMatrix * vec4(position, 1.0)).xyz;
    vec3 wnormal  = (vec4(normal, 1.0) * mMatrixInv).xyz;
    float diffuse = clamp(dot(wnormal, lightPosition), 0.1, 1.0);

    vColor = color * vec4(vec3(diffuse), 1.0);
    vPosition     = lgtMatrix * vec4(position, 1.0);
    vTextureCoord = textureCoord;
    vShadowTextureCoord = tMatrix * vec4(wpos, 1.0);

    gl_Position = mvpMatrix * vec4(position, 1.0);
}
