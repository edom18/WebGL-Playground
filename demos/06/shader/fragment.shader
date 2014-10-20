precision mediump float;

uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;
uniform sampler2D texture;

varying vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
