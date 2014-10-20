attribute float index;
attribute vec4 color;
attribute vec3 normal;

uniform mat4 MATRIX_MVP;
uniform mat4 MATRIX_INV_M;
uniform sampler2D texture;

const float pxSize = 16.0;
const float frag = 1.0 / pxSize;
const float texShift = frag * 0.5;

vec3 lightPos = normalize(vec3(1.0, 1.0, 1.0));

varying vec4 vColor;

void main() {
    vec3 wnormal = (vec4(normal, 1.0) * MATRIX_INV_M).xyz;
    float diff = clamp(dot(wnormal, lightPos), 0.1, 1.0);
    vColor = color;// * vec4(diff, diff, diff, 1.0);
    float pixel_u = fract(index * frag + texShift);
    float pixel_v = floor(index * frag) * frag + texShift;
    vec3 tPosition = texture2D(texture, vec2(pixel_u, pixel_v)).rgb * 2.0 - 1.0;
    gl_Position = MATRIX_MVP * vec4(tPosition, 1.0);
    gl_PointSize = 3.0;
}
