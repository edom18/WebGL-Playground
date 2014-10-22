precision mediump float;

uniform sampler2D color_texture;

varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    gl_FragColor = vColor * texture2D(color_texture, vTexCoord);
}
