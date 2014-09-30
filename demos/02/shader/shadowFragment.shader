precision mediump float;

vec4 convRGBA(float depth) {
    float r = depth;
    float g = fract(r * 255.0);
    float b = fract(g * 255.0);
    float a = fract(b * 255.0);
    float coef = 1.0 / 255.0;

    r -= g * coef;
    g -= b * coef;
    b -= a * coef;

    return vec4(r, g, b, a);
}

void main() {
    gl_FragColor = convRGBA(gl_FragCoord.z);
}
