precision mediump float;

uniform sampler2D texture;
uniform sampler2D shadowTexture;
uniform bool showDepthBuffer;

varying vec4 vColor;
varying vec4 vShadowTextureCoord;
varying vec2 vTextureCoord;
varying vec4 vPosition;

float restDepth(vec4 RGBA){
    const float rMask = 1.0;
    const float gMask = 1.0 / 255.0;
    const float bMask = 1.0 / (255.0 * 255.0);
    const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
    float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
    return depth;
}

void main() {
    if (showDepthBuffer) {
        gl_FragColor = texture2DProj(shadowTexture, vShadowTextureCoord);
    }
    else {
        float depth = restDepth(texture2DProj(shadowTexture, vShadowTextureCoord));

        vec4 shadowFactor = vec4(1.0);
        if (vPosition.w > 0.0) {
            vec4 lightCoord = vPosition / vPosition.w;
            if (lightCoord.z - 0.0001 > depth) {
                shadowFactor = vec4(0.5, 0.5, 0.5, 1.0);
            }
        }

        vec4 texColor = texture2D(texture, vTextureCoord);
        gl_FragColor = vColor * texColor * shadowFactor;
    }
}
