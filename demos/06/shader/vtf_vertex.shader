attribute vec3  position;
attribute float index;

varying vec3 vColor;

const float pxSize   = 16.0;
const float frag     = 1.0 / pxSize;
const float texShift = frag * 0.5;

void main() {
    vColor = (normalize(position) + 1.0) * 0.5;
    float pixel_u = fract(index * frag) * 2.0 - 1.0;
    float pixel_v = floor(index * frag) * frag * 2.0 - 1.0;
    gl_Position = vec4(pixel_u + texShift, pixel_v + texShift, 0.0, 1.0);
    gl_PointSize = 1.0;
}
