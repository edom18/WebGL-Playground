precision mediump float;

uniform sampler2D color_texture;

varying vec4 vColor;
varying vec2 vTexCoord;
uniform sampler2D position_texture;

const float pxSize = 3.0;
const float frag = 1.0 / pxSize;
const float texShift = frag * 0.5;

void main() {
    gl_FragColor = vColor * texture2D(color_texture, vTexCoord);
}
