precision mediump float;

uniform sampler2D texture;

varying vec4 vNormal;
varying vec4 vColor;
varying vec2 vTextureCoord;

void main() {
    vec4 sum = vec4(0);
    vec4 texColor = texture2D(texture, vTextureCoord);
    float strength = 0.25;

    for (int i = -4; i < 4; i++) {
        for (int j = -3; j < 3; j++) {
            sum += texture2D(texture, vTextureCoord + vec2(j, i) * 0.004) * strength;
        }
    }

    vec4 dstColor;
    if (texColor.r < 0.3) {
        // discard;
        dstColor = sum * sum * 0.012 + texColor;
    }
    else if (texColor.r < 0.5) {
        // discard;
        dstColor = sum * sum * 0.009 + texColor;
    }
    else {
        // discard;
        dstColor = sum * sum * 0.0075 + texColor;
    }

    gl_FragColor = vColor * dstColor;
}
