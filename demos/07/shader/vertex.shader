attribute vec3 position;
attribute vec3 normal;
attribute vec2 textureCoord;

uniform mat4 MATRIX_MVP;
uniform mat4 MATRIX_INV_M;
uniform sampler2D position_texture;

varying vec4 vColor;
varying vec2 vTexCoord;

vec3 lightPos = normalize(vec3(1.0, 1.0, -1.0));

const float pxSize = 2.0;
const float frag = 1.0 / pxSize;
const float texShift = frag * 0.5;

void main() {
    vec2 asOnePx = vec2(texShift);
    vec3 addPos = texture2D(position_texture, asOnePx).xyz;
    vec3 wnormal = normalize(vec4(normal, 1.0) * MATRIX_INV_M).xyz;
    float diff  = clamp(dot(wnormal, lightPos), 0.1, 1.0);
    vColor = vec4(1.0) * vec4(diff, diff, diff, 1.0);
    vTexCoord = textureCoord;
    gl_Position = MATRIX_MVP * vec4(position + addPos, 1.0);
}
