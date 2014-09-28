precision mediump float;

uniform sampler2D texture;

varying vec4 vColor;
varying vec4 vTextureCoord;

void main() {
    vec4 texColor = texture2DProj(texture, vTextureCoord);
    gl_FragColor = vColor * texColor;
}
