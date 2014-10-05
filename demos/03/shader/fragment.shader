precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float sphereSize = 1.0;

float distanceFunc(vec3 p) {
    return length(p) - sphereSize;
}

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

    // Camera
    // vec3 cPos = vec3(0.0, 0.0, 2.0);
    vec3 cPos = vec3(mouse.xy, 2.0);
    vec3 cDir = vec3(0.0, 0.0, -1.0);
    vec3 cUp  = vec3(0.0, 1.0, 0.0);
    vec3 cSide = cross(cDir, cUp);
    float targetDepth = 1.0;

    // Ray
    vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir * targetDepth);

    // Marching loop
    float distance = 0.0;
    float rLen = 0.0;
    vec3 rPos = cPos;

    for (int i = 0; i < 16; i++) {
        distance = distanceFunc(rPos);
        rLen += distance;
        rPos = cPos + ray * rLen;
    }

    if (abs(distance) < 0.001) {
        gl_FragColor = vec4(vec3(1.0), 1.0);
    }
    else {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
}
